const mongoose = require("mongoose");

const trackedChannelSchema = new mongoose.Schema(
  {
    channelId: {
      type: String,
      required: true,
      unique: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    channelAvatar: {
      type: String,
      default: "",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "paused", "expired"],
      default: "active",
    },
    autoSync: {
      type: Boolean,
      default: true,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    syncedVideosCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrackedChannel", trackedChannelSchema);
