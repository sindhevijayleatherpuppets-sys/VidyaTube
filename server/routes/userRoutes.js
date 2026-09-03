const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  toggleSubscribe,
  getMySubscriptions,
  getFavorites,
  toggleFavorite,
  getWatchLater,
  toggleWatchLater,
  getLikedVideos,
} = require("../controllers/userController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");

// Library Endpoints
router.get("/library/favorites", protect, getFavorites);
router.post("/library/favorites/:videoId", protect, toggleFavorite);
router.get("/library/watch-later", protect, getWatchLater);
router.post("/library/watch-later/:videoId", protect, toggleWatchLater);
router.get("/library/liked", protect, getLikedVideos);

// Profile & Subscription Endpoints
router.get("/subscriptions/mine", protect, getMySubscriptions);
router.put("/profile/update", protect, updateProfile);
router.get("/:id", optionalAuth, getUserProfile);
router.post("/:id/subscribe", protect, toggleSubscribe);

module.exports = router;
