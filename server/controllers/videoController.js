const fs = require("fs");
const path = require("path");
const Video = require("../models/Video");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const WatchHistory = require("../models/WatchHistory");
const Notification = require("../models/Notification");
const { MAX_THUMBNAIL_SIZE } = require("../middleware/uploadMiddleware");

// @desc    Upload a new video / short
// @route   POST /api/videos
// @access  Private
const uploadVideo = async (req, res, next) => {
  try {
    const { title, description, category, isShort, duration, tags, visibility } = req.body;
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!videoFile) {
      return res.status(400).json({ message: "Video file is required" });
    }
    if (!thumbnailFile) {
      return res.status(400).json({ message: "Thumbnail is required" });
    }
    if (thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
      return res.status(400).json({ message: "File size too large" });
    }

    const parsedTags = tags
      ? (typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags).filter(Boolean)
      : [];

    const video = await Video.create({
      title: title.trim(),
      description: description?.trim() || "",
      category: category || "Other",
      duration: duration || (isShort === "true" || isShort === true ? "00:45" : "04:20"),
      isShort: isShort === "true" || isShort === true,
      tags: parsedTags,
      visibility: visibility || "public",
      videoUrl: `/uploads/videos/${videoFile.filename}`,
      thumbnailUrl: `/uploads/thumbnails/${thumbnailFile.filename}`,
      channel: req.user._id,
    });

    return res.status(201).json({ message: "Video uploaded successfully", video });
  } catch (error) {
    next(error);
  }
};

// Auto-detect and replace fake/sample videos with original real YouTube videos
const ensureRealYouTubeVideos = async () => {
  try {
    const fakeCount = await Video.countDocuments({
      $or: [
        { source: { $ne: "youtube" } },
        { youtubeVideoId: { $in: [null, ""] } },
        { videoUrl: { $regex: /sample|BigBuck|Elephants|Tears|sintel/i } },
      ],
    });
    const realCount = await Video.countDocuments({ source: "youtube" });

    if (fakeCount > 0 || realCount < 12) {
      console.log(`Auto-detection: Detected ${fakeCount} fake videos. Replacing with original playable YouTube videos...`);
      const { seedDatabase } = require("../utils/seed");
      await seedDatabase();
      console.log("Auto-detection: Replaced with 100% playable official YouTube videos!");
    }
  } catch (e) {
    console.warn("Video auto-healing warning:", e.message);
  }
};

// @desc    List videos (supports category filter, search, sort, isShort)
// @route   GET /api/videos?category=&search=&isShort=&sort=&channel=
// @access  Public
const getVideos = async (req, res, next) => {
  try {
    await ensureRealYouTubeVideos();
    const { category, search, isShort, sort, channel } = req.query;
    const query = { isRemoved: false, visibility: "public" };

    if (category && category !== "All") {
      query.category = category;
    }

    if (channel) {
      query.channel = channel;
    }

    if (isShort === "true") {
      query.isShort = true;
    } else if (isShort === "false") {
      query.isShort = { $ne: true };
    }

    let videosQuery;
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
      videosQuery = Video.find(query, { score: { $meta: "textScore" } }).sort({
        score: { $meta: "textScore" },
      });
    } else {
      let sortCriteria = { createdAt: -1 };
      if (sort === "views" || sort === "popular") {
        sortCriteria = { views: -1 };
      } else if (sort === "oldest") {
        sortCriteria = { createdAt: 1 };
      }
      videosQuery = Video.find(query).sort(sortCriteria);
    }

    const videos = await videosQuery.populate("channel", "fullName avatar subscriberCount handle");
    return res.status(200).json({ videos });
  } catch (error) {
    next(error);
  }
};

// @desc    List YouTube Shorts
// @route   GET /api/videos/shorts
// @access  Public
const getShorts = async (req, res, next) => {
  try {
    const shorts = await Video.find({ isShort: true, isRemoved: false, visibility: "public" })
      .sort({ createdAt: -1 })
      .populate("channel", "fullName avatar subscriberCount handle");
    return res.status(200).json({ shorts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single video, increment view count
// @route   GET /api/videos/:id
// @access  Public
const getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findOneAndUpdate(
      { _id: req.params.id, isRemoved: false },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("channel", "fullName avatar subscriberCount handle bio banner");

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (req.user) {
      await WatchHistory.findOneAndUpdate(
        { user: req.user._id, video: video._id },
        { watchedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return res.status(200).json({ video });
  } catch (error) {
    next(error);
  }
};

// @desc    Update video metadata (for Creator Studio)
// @route   PUT /api/videos/:id
// @access  Private (owner or admin)
const updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.channel.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this video" });
    }

    const { title, description, category, tags, visibility, isShort } = req.body;
    if (title) video.title = title.trim();
    if (description !== undefined) video.description = description.trim();
    if (category) video.category = category;
    if (visibility) video.visibility = visibility;
    if (isShort !== undefined) video.isShort = isShort;
    if (tags) {
      video.tags = (typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags).filter(Boolean);
    }

    await video.save();
    return res.status(200).json({ message: "Video updated successfully", video });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's uploaded videos with studio statistics
// @route   GET /api/videos/studio/mine
// @access  Private
const getMyStudioVideos = async (req, res, next) => {
  try {
    const videos = await Video.find({ channel: req.user._id, isRemoved: false })
      .sort({ createdAt: -1 });

    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.likes ? v.likes.length : 0), 0);

    return res.status(200).json({
      videos,
      analytics: {
        totalVideos: videos.length,
        totalViews,
        totalLikes,
        estimatedWatchHours: (totalViews * 4.2 / 60).toFixed(1),
        subscribers: req.user.subscriberCount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all videos liked by current user
// @route   GET /api/videos/user/liked
// @access  Private
const getLikedVideos = async (req, res, next) => {
  try {
    const videos = await Video.find({
      likes: req.user._id,
      isRemoved: false,
    })
      .sort({ updatedAt: -1 })
      .populate("channel", "fullName avatar subscriberCount handle");

    return res.status(200).json({ videos });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private
const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const isOwner = video.channel.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this video" });
    }

    [video.videoUrl, video.thumbnailUrl].forEach((relPath) => {
      if (relPath && relPath.startsWith("/uploads")) {
        const absPath = path.join(__dirname, "..", relPath.replace(/^\/+/, ""));
        fs.unlink(absPath, () => {});
      }
    });

    await video.deleteOne();
    await Comment.deleteMany({ video: video._id });
    await WatchHistory.deleteMany({ video: video._id });

    return res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or unlike a video
// @route   POST /api/videos/:id/like
// @access  Private
const toggleLike = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const userId = req.user._id.toString();
    const alreadyLiked = video.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      video.likes = video.likes.filter((id) => id.toString() !== userId);
    } else {
      video.likes.push(req.user._id);
      video.dislikes = video.dislikes.filter((id) => id.toString() !== userId);

      // Create notification for channel owner if not self
      if (video.channel.toString() !== userId) {
        await Notification.create({
          recipient: video.channel,
          sender: req.user._id,
          type: "like",
          video: video._id,
          message: `${req.user.fullName} liked your video "${video.title}"`,
        });
      }
    }

    await video.save();

    return res.status(200).json({
      liked: !alreadyLiked,
      disliked: false,
      likeCount: video.likes.length,
      dislikeCount: video.dislikes.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dislike or un-dislike a video
// @route   POST /api/videos/:id/dislike
// @access  Private
const toggleDislike = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const userId = req.user._id.toString();
    const alreadyDisliked = video.dislikes.some((id) => id.toString() === userId);

    if (alreadyDisliked) {
      video.dislikes = video.dislikes.filter((id) => id.toString() !== userId);
    } else {
      video.dislikes.push(req.user._id);
      video.likes = video.likes.filter((id) => id.toString() !== userId);
    }

    await video.save();

    return res.status(200).json({
      disliked: !alreadyDisliked,
      liked: false,
      likeCount: video.likes.length,
      dislikeCount: video.dislikes.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a video (with nested replies & pin status)
// @route   GET /api/videos/:id/comments
// @access  Public
const getComments = async (req, res, next) => {
  try {
    const allComments = await Comment.find({ video: req.params.id })
      .sort({ isPinned: -1, createdAt: -1 })
      .populate("user", "fullName avatar");

    // Separate root comments and nested replies
    const rootComments = [];
    const replyMap = {};

    allComments.forEach((c) => {
      if (c.parentId) {
        const pId = c.parentId.toString();
        if (!replyMap[pId]) replyMap[pId] = [];
        replyMap[pId].push(c);
      } else {
        rootComments.push(c);
      }
    });

    const populatedRoots = rootComments.map((root) => {
      const rootObj = root.toObject();
      rootObj.replies = replyMap[root._id.toString()] || [];
      return rootObj;
    });

    return res.status(200).json({ comments: populatedRoots });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment or nested reply
// @route   POST /api/videos/:id/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { text, parentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const comment = await Comment.create({
      video: video._id,
      user: req.user._id,
      text: text.trim(),
      parentId: parentId || null,
    });

    const populated = await Comment.findById(comment._id).populate("user", "fullName avatar");

    // Notification
    if (video.channel.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: video.channel,
        sender: req.user._id,
        type: parentId ? "reply" : "comment",
        video: video._id,
        message: `${req.user.fullName} commented: "${text.trim().slice(0, 50)}..."`,
      });
    }

    return res.status(201).json({ comment: { ...populated.toObject(), replies: [] } });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / unlike a comment
// @route   POST /api/videos/:id/comments/:commentId/like
// @access  Private
const toggleCommentLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = req.user._id.toString();
    const alreadyLiked = comment.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();
    return res.status(200).json({ liked: !alreadyLiked, likeCount: comment.likes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Pin / unpin comment by video creator
// @route   PUT /api/videos/:id/comments/:commentId/pin
// @access  Private
const toggleCommentPin = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.channel.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the video creator can pin comments" });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.isPinned = !comment.isPinned;
    await comment.save();

    return res.status(200).json({ isPinned: comment.isPinned });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/videos/:id/comments/:commentId
// @access  Private
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const video = await Video.findById(req.params.id);
    const isCommentAuthor = comment.user.toString() === req.user._id.toString();
    const isVideoOwner = video && video.channel.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isVideoOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete comment" });
    }

    await comment.deleteOne();
    await Comment.deleteMany({ parentId: comment._id }); // Delete child replies

    return res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a video
// @route   POST /api/videos/:id/report
// @access  Private
const reportVideo = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const report = await Report.create({
      video: video._id,
      user: req.user._id,
      reason: reason.trim(),
    });

    video.reportCount = (video.reportCount || 0) + 1;
    await video.save();

    return res.status(201).json({ message: "Report submitted", report });
  } catch (error) {
    next(error);
  }
};

// @desc    Trending videos list
// @route   GET /api/videos/trending/list
// @access  Public
const getTrendingVideos = async (req, res, next) => {
  try {
    const videos = await Video.find({ isRemoved: false, visibility: "public" })
      .populate("channel", "fullName avatar subscriberCount handle");

    const now = Date.now();
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

    const scored = videos.map((v) => {
      const ageMs = now - new Date(v.createdAt).getTime();
      const recentness = Math.max(0, 1 - ageMs / FOURTEEN_DAYS) * 100;
      const views = v.views || 0;
      const likes = v.likes ? v.likes.length : 0;
      const score = views * 0.6 + likes * 0.3 + recentness * 0.1;
      return { video: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return res.status(200).json({ videos: scored.map((s) => s.video) });
  } catch (error) {
    next(error);
  }
};

// @desc    Content-based recommendations
// @route   GET /api/videos/recommendations/list
// @access  Private
const getRecommendedVideos = async (req, res, next) => {
  try {
    const recentWatches = await WatchHistory.find({ user: req.user._id })
      .sort({ watchedAt: -1 })
      .limit(20)
      .populate("video");

    const watchedVideos = recentWatches.map((w) => w.video).filter(Boolean);
    const watchedIds = new Set(watchedVideos.map((v) => v._id.toString()));

    if (watchedVideos.length === 0) {
      const fallback = await Video.find({ isRemoved: false, visibility: "public" })
        .sort({ views: -1 })
        .limit(12)
        .populate("channel", "fullName avatar subscriberCount handle");
      return res.status(200).json({ videos: fallback });
    }

    const candidateVideos = await Video.find({
      _id: { $nin: Array.from(watchedIds) },
      isRemoved: false,
      visibility: "public",
    }).populate("channel", "fullName avatar subscriberCount handle");

    const userCategories = new Set(watchedVideos.map((v) => v.category));
    const extractKeywords = (str) =>
      (str || "").toLowerCase().split(/\W+/).filter((w) => w.length > 3);

    const userKeywords = new Set(
      watchedVideos.flatMap((v) => [
        ...extractKeywords(v.title),
        ...extractKeywords(v.description),
        ...(v.tags || []),
      ])
    );

    const scored = candidateVideos.map((cand) => {
      let score = 0;
      if (userCategories.has(cand.category)) score += 30;
      const candWords = [
        ...extractKeywords(cand.title),
        ...extractKeywords(cand.description),
        ...(cand.tags || []),
      ];
      candWords.forEach((w) => {
        if (userKeywords.has(w)) score += 5;
      });
      score += Math.min(20, (cand.views || 0) * 0.05);
      return { video: cand, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return res.status(200).json({ videos: scored.slice(0, 12).map((s) => s.video) });
  } catch (error) {
    next(error);
  }
};

// @desc    Import / Sync a YouTube video (Phase 4E Integration)
// @route   POST /api/videos/youtube/import
// @access  Private
const importYouTubeVideo = async (req, res, next) => {
  try {
    const { youtubeUrl, title, description, category, isShort, tags } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({ message: "YouTube URL or Video ID is required" });
    }

    const extractYouTubeId = (url) => {
      if (!url) return null;
      const clean = url.trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = clean.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ message: "Invalid YouTube URL or Video ID" });
    }

    const videoTitle = title?.trim() || `YouTube Video - ${videoId}`;
    const videoDesc = description?.trim() || `Synced and embedded via YouTube. Original video ID: ${videoId}`;
    const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const embed = `https://www.youtube-nocookie.com/embed/${videoId}`;

    const tagArray = tags
      ? (Array.isArray(tags) ? tags : tags.split(",")).map((t) => t.trim()).filter(Boolean)
      : ["youtube", "sync"];

    const newVideo = await Video.create({
      title: videoTitle,
      description: videoDesc,
      category: category || "Technology",
      source: "youtube",
      youtubeVideoId: videoId,
      embedUrl: embed,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: thumb,
      duration: isShort ? "00:45" : "14:20",
      isShort: Boolean(isShort),
      tags: tagArray,
      channel: req.user._id,
      visibility: "public",
    });

    const populated = await Video.findById(newVideo._id).populate(
      "channel",
      "fullName avatar subscriberCount handle"
    );

    return res.status(201).json({
      message: "YouTube video synced successfully!",
      video: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Securely download uploaded video master file (Creator / Owner only)
// @route   GET /api/videos/:id/download
// @access  Private (Owner or Admin)
const downloadVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Reject YouTube IDs immediately
    if (id.startsWith("yt_")) {
      return res.status(403).json({
        message: "External YouTube videos cannot be downloaded. Only VidyTube-hosted videos can be downloaded by their creator.",
      });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if video is YouTube/external sourced
    if (video.source === "youtube" || video.youtubeVideoId) {
      return res.status(403).json({
        message: "External YouTube videos cannot be downloaded. Only VidyTube-hosted videos can be downloaded by their creator.",
      });
    }

    // Verify ownership: only the creator/uploader or admin can download
    const isOwner = video.channel.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Access denied. Only the original creator/uploader can download the source video master file.",
      });
    }

    // Resolve local file path
    const cleanFileName = path.basename(video.videoUrl);
    const localFilePath = path.join(__dirname, "../uploads/videos", cleanFileName);
    const safeDownloadName = `${video.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50) || "video"}.mp4`;

    if (fs.existsSync(localFilePath)) {
      res.setHeader("Content-Disposition", `attachment; filename="${safeDownloadName}"`);
      res.setHeader("Content-Type", "video/mp4");
      return res.download(localFilePath, safeDownloadName);
    }

    // If videoUrl is an external/sample hosted URL, stream it securely as an attachment
    if (video.videoUrl.startsWith("http://") || video.videoUrl.startsWith("https://")) {
      const client = video.videoUrl.startsWith("https://") ? require("https") : require("http");
      res.setHeader("Content-Disposition", `attachment; filename="${safeDownloadName}"`);
      res.setHeader("Content-Type", "video/mp4");

      return client.get(video.videoUrl, (fileStream) => {
        fileStream.pipe(res);
      }).on("error", (err) => {
        return res.status(500).json({ message: "Failed to stream video file." });
      });
    }

    return res.status(404).json({ message: "Source video file not found on server storage." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};

