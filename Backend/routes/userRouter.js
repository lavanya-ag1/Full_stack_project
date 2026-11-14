const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  signup,
  login,
  googleCallback,
  logout,
} = require("../controllers/userController");

// Standard email/password routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Google OAuth login route (initiates authentication)
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Google OAuth callback route (Google redirects here after user signs in)
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND || "http://localhost:5173"}/login?error=OAuthFailed`,
    session: false,
  }),
  googleCallback
);

module.exports = router;
