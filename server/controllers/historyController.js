const WatchHistory = require("../models/WatchHistory");
const Video = require("../models/Video");

// @desc    Get the current user's watch history, most recent first
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res, next) => {
  try {
    const history = await WatchHistory.find({ user: req.user._id })
      .sort({ watchedAt: -1 })
      .populate({
        path: "video",
        populate: { path: "channel", select: "fullName avatar handle" },
      });

    const cleaned = history.filter((h) => h.video);
    return res.status(200).json({ history: cleaned });
  } catch (error) {
    next(error);
  }
};

// @desc    Record that the current user watched a video
// @route   POST /api/history
// @access  Private
const addHistory = async (req, res, next) => {
  try {
    let { videoId } = req.body;
    if (!videoId) {
      return res.status(400).json({ message: "videoId is required" });
    }

    let video = await Video.findById(videoId);
    if (!video && videoId.startsWith("yt_")) {
      const ytId = videoId.replace(/^yt_/, "");
      video = await Video.findOne({ youtubeVideoId: ytId });
      if (!video) {
        video = await Video.create({
          title: `YouTube Video (${ytId})`,
          videoUrl: `https://www.youtube.com/watch?v=${ytId}`,
          thumbnailUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
          source: "youtube",
          youtubeVideoId: ytId,
          embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
          channel: req.user._id,
        });
      }
    }

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const entry = await WatchHistory.findOneAndUpdate(
      { user: req.user._id, video: video._id },
      { watchedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ history: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an individual item from history
// @route   DELETE /api/history/:id
// @access  Private
const removeHistoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await WatchHistory.findOneAndDelete({ _id: id, user: req.user._id });
    return res.status(200).json({ message: "History item removed" });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear the current user's entire watch history
// @route   DELETE /api/history
// @access  Private
const clearHistory = async (req, res, next) => {
  try {
    await WatchHistory.deleteMany({ user: req.user._id });
    return res.status(200).json({ message: "History cleared successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistory, addHistory, removeHistoryItem, clearHistory };
