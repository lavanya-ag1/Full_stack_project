const express = require("express");
const router = express.Router();
const {
  createShortUrl,
  getUrlAndTrackAnalytics,
  trackMonetizedClick,
  getUserLinks,
  deleteUserLink,
} = require("../controllers/urlController");

// URL creation routes
router.post("/shorten", createShortUrl);
router.post("/", createShortUrl);

// Get user's created links with analytics
router.get("/my-links", getUserLinks);

// Delete a link
router.delete("/:id", deleteUserLink);

// Record monetized click (when user clicks continue after 10s wait)
router.post("/:shortCode/monetized-click", trackMonetizedClick);

// Retrieve URL and record visit
router.get("/:shortCode", getUrlAndTrackAnalytics);

module.exports = router;
