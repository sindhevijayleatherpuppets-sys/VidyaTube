const express = require("express");
const router = express.Router();
const {
  getChannelPosts,
  createPost,
  votePoll,
  toggleLikePost,
  deletePost,
} = require("../controllers/communityController");
const { protect } = require("../middleware/authMiddleware");

router.get("/:channelId", getChannelPosts);
router.post("/", protect, createPost);
router.post("/:id/vote", protect, votePoll);
router.post("/:id/like", protect, toggleLikePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
