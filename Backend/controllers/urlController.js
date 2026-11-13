const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const Url = require("../models/Url");
const Analytics = require("../models/Analytics");

// Helper to generate a random 6-character short code
const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Helper to parse simple browser and device from User-Agent
const parseUserAgent = (userAgent = "") => {
  let browser = "Other";
  if (/chrome|crios/i.test(userAgent) && !/edge|edg|opr/i.test(userAgent)) {
    browser = "Chrome";
  } else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
    browser = "Safari";
  } else if (/firefox|fxios/i.test(userAgent)) {
    browser = "Firefox";
  } else if (/edg/i.test(userAgent)) {
    browser = "Edge";
  } else if (/opera|opr/i.test(userAgent)) {
    browser = "Opera";
  }

  let device = "Desktop";
  if (/tablet|ipad/i.test(userAgent)) {
    device = "Tablet";
  } else if (/mobile|iphone|android/i.test(userAgent)) {
    device = "Mobile";
  }

  return { browser, device };
};

// Create Short URL Controller
const createShortUrl = async (req, res) => {
  try {
    const { originalUrl, customCode, expiresAt, isOneTime, password } = req.body;

    // 1. Validate original URL
    if (!originalUrl) {
      return res.status(400).json({ message: "Please provide an original URL" });
    }

    let formattedUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    // 2. Determine short code (custom or auto-generated)
    let shortCode = customCode ? customCode.trim() : generateRandomCode();

    // Check if custom or generated short code already exists
    const existingUrl = await Url.findOne({ shortCode });
    if (existingUrl) {
      if (customCode) {
        return res.status(400).json({ message: "Custom short code is already in use" });
      }
      // If auto-generated collision, generate a new one
      shortCode = generateRandomCode() + Math.floor(Math.random() * 10);
    }

    // 3. Check if user is logged in via cookie/token (optional createdBy)
    let createdBy = null;
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
        createdBy = decoded.id;
      } catch (err) {
        // Token invalid or expired, continue as guest
        createdBy = null;
      }
    }

    // 4. Handle optional password hashing
    let hashedPassword = null;
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // 5. Build full short URL link (points to frontend /:id) & generate QR Code
    const frontendUrl = process.env.FRONTEND
      ? process.env.FRONTEND.replace(/\/$/, "")
      : "http://localhost:5173";
    const fullShortUrl = `${frontendUrl}/${shortCode}`;

    let qrCode = null;
    try {
      qrCode = await QRCode.toDataURL(fullShortUrl);
    } catch (qrErr) {
      console.error("QR Code generation failed:", qrErr.message);
    }

    // 6. Save URL to Database
    const newUrl = await Url.create({
      originalUrl: formattedUrl,
      shortCode,
      createdBy,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isOneTime: Boolean(isOneTime),
      password: hashedPassword,
      qrCode,
    });

    // 7. Initialize Analytics entry for this URL
    await Analytics.create({
      urlId: newUrl._id,
      clicks: 0,
      visitHistory: [],
    });

    res.status(201).json({
      message: "Short URL created successfully",
      shortUrl: fullShortUrl,
      url: newUrl,
    });
  } catch (error) {
    console.error("Error creating short URL:", error);
    res.status(500).json({ message: "Server error while creating short URL" });
  }
};

// Get Original URL & Track Analytics
const getUrlAndTrackAnalytics = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { password } = req.query;

    // 1. Find URL in database
    const url = await Url.findOne({ shortCode });
    if (!url || !url.isActive) {
      return res.status(404).json({ message: "Short link not found or no longer active" });
    }

    // 2. Check if link is expired
    if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
      url.isActive = false;
      await url.save();
      return res.status(410).json({ message: "This short link has expired" });
    }

    // 3. Check password protection
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

    // 4. Extract Analytics Information
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "Unknown";

    const userAgent = req.headers["user-agent"] || "";
    const { browser, device } = parseUserAgent(userAgent);
    const referrer = req.headers["referer"] || req.headers["referrer"] || "Direct";

    // 5. Update Analytics: Increment clicks and record visit history
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

    // 6. If it's a one-time link, deactivate it after access
    if (url.isOneTime) {
      url.isActive = false;
      await url.save();
    }

    // 7. Return the original URL for redirection
    res.status(200).json({
      originalUrl: url.originalUrl,
    });
  } catch (error) {
    console.error("Error retrieving URL and updating analytics:", error);
    res.status(500).json({ message: "Server error while processing link" });
  }
};

module.exports = {
  createShortUrl,
  getUrlAndTrackAnalytics,
};
