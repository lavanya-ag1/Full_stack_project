const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const Url = require("../models/Url");
const Analytics = require("../models/Analytics");
const User = require("../models/User");

// Generate a random 6-character short code
const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Simple helper to detect browser and device type from User-Agent
const parseUserAgent = (userAgent = "") => {
  let browser = "Other";
  if (/chrome|crios/i.test(userAgent) && !/edge|edg|opr/i.test(userAgent)) browser = "Chrome";
  else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) browser = "Safari";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
  else if (/edg/i.test(userAgent)) browser = "Edge";
  else if (/opera|opr/i.test(userAgent)) browser = "Opera";

  let device = "Desktop";
  if (/tablet|ipad/i.test(userAgent)) device = "Tablet";
  else if (/mobile|iphone|android/i.test(userAgent)) device = "Mobile";

  return { browser, device };
};

// 1. Create a new short URL
const createShortUrl = async (req, res) => {
  try {
    const { originalUrl, customCode, expiresAt, isOneTime, password, enableRevenue } = req.body;

    // Validate original URL
    if (!originalUrl) {
      return res.status(400).json({ message: "Please provide an original URL" });
    }

    let formattedUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    // Determine short code (use custom if provided, otherwise generate random)
    let shortCode = customCode ? customCode.trim() : generateRandomCode();

    const existingUrl = await Url.findOne({ shortCode });
    if (existingUrl) {
      if (customCode) {
        return res.status(400).json({ message: "Custom short code is already in use" });
      }
      shortCode = generateRandomCode() + Math.floor(Math.random() * 10);
    }

    // Check if user is logged in via cookie/token (optional)
    let createdBy = null;
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
        createdBy = decoded.id;
      } catch (err) {
        createdBy = null;
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Build the full short URL and QR code
    const frontendUrl = process.env.FRONTEND
      ? process.env.FRONTEND.replace(/\/$/, "")
      : "http://localhost:5173";
    const fullShortUrl = `${frontendUrl}/${shortCode}`;

    let qrCode = null;
    try {
      qrCode = await QRCode.toDataURL(fullShortUrl);
    } catch (qrErr) {
      console.error("QR Code generation error:", qrErr.message);
    }

    // Save URL document in MongoDB
    const newUrl = await Url.create({
      originalUrl: formattedUrl,
      shortCode,
      createdBy,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isOneTime: Boolean(isOneTime),
      password: hashedPassword,
      qrCode,
      enableRevenue: Boolean(enableRevenue),
    });

    // Initialize analytics document for this URL
    await Analytics.create({
      urlId: newUrl._id,
      clicks: 0,
      monetizedClicks: 0,
      visitHistory: [],
    });

    res.status(201).json({
      message: "Short URL created successfully",
      shortUrl: fullShortUrl,
      url: newUrl,
    });
  } catch (error) {
    console.error("Create URL error:", error);
    res.status(500).json({ message: "Server error while creating short URL" });
  }
};

// 2. Get destination URL and record regular visit analytics
const getUrlAndTrackAnalytics = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { password } = req.query;

    const url = await Url.findOne({ shortCode });
    if (!url || !url.isActive) {
      return res.status(404).json({ message: "Short link not found or no longer active" });
    }

    // Check expiration
    if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
      url.isActive = false;
      await url.save();
      return res.status(410).json({ message: "This short link has expired" });
    }

    // Check password protection
    if (url.password) {
      if (!password) {
        return res.status(200).json({
          passwordRequired: true,
          message: "This link is password protected",
        });
      }

      const isMatch = await bcrypt.compare(password, url.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }
    }

    // Extract visitor details for analytics
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "Unknown";

    const userAgent = req.headers["user-agent"] || "";
    const { browser, device } = parseUserAgent(userAgent);
    const referrer = req.headers["referer"] || req.headers["referrer"] || "Direct";

    // Increment click count and record visit history
    await Analytics.findOneAndUpdate(
      { urlId: url._id },
      {
        $inc: { clicks: 1 },
        $push: {
          visitHistory: {
            clickedAt: new Date(),
            ipAddress,
            browser,
            device,
            referrer,
          },
        },
      },
      { upsert: true, new: true }
    );

    // Deactivate one-time link if revenue mode is not enabled
    if (url.isOneTime && !url.enableRevenue) {
      url.isActive = false;
      await url.save();
    }

    res.status(200).json({
      originalUrl: url.originalUrl,
      enableRevenue: Boolean(url.enableRevenue),
    });
  } catch (error) {
    console.error("Get URL error:", error);
    res.status(500).json({ message: "Server error while processing link" });
  }
};

// 3. Record monetized click when user finishes 10s ad and clicks continue
const trackMonetizedClick = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({ message: "Short link not found" });
    }

    // Increment monetized clicks and creator earnings
    if (url.enableRevenue) {
      await Analytics.findOneAndUpdate(
        { urlId: url._id },
        { $inc: { monetizedClicks: 1 } },
        { upsert: true }
      );

      if (url.createdBy) {
        await User.findByIdAndUpdate(url.createdBy, {
          $inc: { earnings: 0.01 },
        });
      }
    }

    // Deactivate one-time link after final continue click
    if (url.isOneTime) {
      url.isActive = false;
      await url.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Monetized click error:", error);
    res.status(500).json({ message: "Server error recording monetized click" });
  }
};

// 4. Fetch all links created by the current user with analytics
const getUserLinks = async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(200).json({ links: [] });
    }

    let userId = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
      userId = decoded.id;
    } catch (err) {
      return res.status(200).json({ links: [] });
    }

    // Fetch user's links
    const urls = await Url.find({ createdBy: userId }).sort({ createdAt: -1 }).lean();

    if (urls.length === 0) {
      return res.status(200).json({ links: [] });
    }

    // Fetch analytics for these URLs
    const urlIds = urls.map((u) => u._id);
    const analyticsList = await Analytics.find({ urlId: { $in: urlIds } }).lean();

    const analyticsMap = {};
    analyticsList.forEach((item) => {
      analyticsMap[item.urlId.toString()] = item;
    });

    const frontendUrl = process.env.FRONTEND
      ? process.env.FRONTEND.replace(/\/$/, "")
      : "http://localhost:5173";

    const linksWithStats = urls.map((link) => ({
      ...link,
      shortUrl: `${frontendUrl}/${link.shortCode}`,
      analytics: {
        clicks: analyticsMap[link._id.toString()]?.clicks || 0,
        monetizedClicks: analyticsMap[link._id.toString()]?.monetizedClicks || 0,
      },
    }));

    res.status(200).json({ links: linksWithStats });
  } catch (error) {
    console.error("Error fetching user links:", error);
    res.status(500).json({ message: "Server error fetching user links" });
  }
};

// 5. Delete a short link
const deleteUserLink = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");

    const link = await Url.findOne({ _id: id, createdBy: decoded.id });
    if (!link) {
      return res.status(404).json({ message: "Link not found or unauthorized to delete" });
    }

    await Url.findByIdAndDelete(id);
    await Analytics.findOneAndDelete({ urlId: id });

    res.status(200).json({ success: true, message: "Link deleted successfully" });
  } catch (error) {
    console.error("Error deleting link:", error);
    res.status(500).json({ message: "Server error deleting link" });
  }
};

module.exports = {
  createShortUrl,
  getUrlAndTrackAnalytics,
  trackMonetizedClick,
  getUserLinks,
  deleteUserLink,
};
