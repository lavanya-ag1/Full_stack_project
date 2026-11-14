const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents access from client-side JavaScript (XSS protection)
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax", // Protects against CSRF
  maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
};

// Signup Controller
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if account was created with Google OAuth (no password set)
    if (!user.password) {
      return res.status(400).json({
        message: "This account was registered using Google. Please log in with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "1d" }
    );

    // Set JWT in HTTP-only cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Google OAuth Callback Handler
const googleCallback = (req, res) => {
  try {
    // Generate JWT token for the authenticated user
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "1d" }
    );

    // Set JWT cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    // Redirect user to frontend home
    const frontendUrl = process.env.FRONTEND
      ? process.env.FRONTEND.replace(/\/$/, "")
      : "http://localhost:5173";
    res.redirect(`${frontendUrl}/home`);
  } catch (error) {
    console.error("Google callback error:", error);
    const frontendUrl = process.env.FRONTEND
      ? process.env.FRONTEND.replace(/\/$/, "")
      : "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?error=OAuthFailed`);
  }
};

// Logout Controller
const logout = (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = {
  signup,
  login,
  googleCallback,
  logout,
};
