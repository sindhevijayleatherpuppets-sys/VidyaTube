const express = require("express");
const router = express.Router();
const {
  uploadVideo,
  getVideos,
  getShorts,
  getVideoById,
  updateVideo,
  getMyStudioVideos,
  getLikedVideos,
  deleteVideo,
  toggleLike,
  toggleDislike,
  getComments,
  addComment,
  toggleCommentLike,
  toggleCommentPin,
  deleteComment,
  reportVideo,
  getTrendingVideos,
  getRecommendedVideos,
  importYouTubeVideo,
  downloadVideo,
} = require("../controllers/videoController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { uploadVideoMiddleware } = require("../middleware/uploadMiddleware");

// Feeds & Special Lists
router.get("/", getVideos);
router.get("/shorts", getShorts);
router.get("/trending/list", getTrendingVideos);
router.get("/recommendations/list", protect, getRecommendedVideos);
router.get("/studio/mine", protect, getMyStudioVideos);
router.get("/user/liked", protect, getLikedVideos);

// Upload & Details
router.post("/", protect, uploadVideoMiddleware, uploadVideo);
router.post("/youtube/import", protect, importYouTubeVideo);
router.get("/:id", optionalAuth, getVideoById);
router.get("/:id/download", protect, downloadVideo);
router.put("/:id", protect, updateVideo);
router.delete("/:id", protect, deleteVideo);

// Interactions: Likes, Dislikes, Reports
router.post("/:id/like", protect, toggleLike);
router.post("/:id/dislike", protect, toggleDislike);
router.post("/:id/report", protect, reportVideo);

// Comments & Replies
router.get("/:id/comments", getComments);
router.post("/:id/comments", protect, addComment);
router.post("/:id/comments/:commentId/like", protect, toggleCommentLike);
router.put("/:id/comments/:commentId/pin", protect, toggleCommentPin);
router.delete("/:id/comments/:commentId", protect, deleteComment);

module.exports = router;
