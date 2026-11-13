const express = require("express");
const router = express.Router();
const { createShortUrl, getUrlAndTrackAnalytics } = require("../controllers/urlController");

// POST route to shorten a URL
router.post("/shorten", createShortUrl);
router.post("/", createShortUrl);

// GET route to get original URL and track analytics
router.get("/:shortCode", getUrlAndTrackAnalytics);

module.exports = router;
