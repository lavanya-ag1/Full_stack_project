const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Url",
    required: true,
    unique: true,
    index: true,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  monetizedClicks: {
    type: Number,
    default: 0,
  },
  visitHistory: [
    {
      clickedAt: {
        type: Date,
        default: Date.now,
      },
      ipAddress: {
        type: String,
      },
      browser: {
        type: String,
      },
      device: {
        type: String,
      },
      referrer: {
        type: String,
        default: "Direct",
      },
    },
  ],
});

const Analytics = mongoose.model("Analytics", analyticsSchema);

module.exports = Analytics;
