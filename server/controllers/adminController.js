const User = require("../models/User");
const Video = require("../models/Video");
const Report = require("../models/Report");
const Comment = require("../models/Comment");
const fs = require("fs");
const path = require("path");

// @desc    Platform-wide statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalVideos, totalReports, viewAgg] = await Promise.all([
      User.countDocuments(),
      Video.countDocuments(),
      Report.countDocuments({ status: "open" }),
      Video.aggregate([{ $group: { _id: null, totalViews: { $sum: "$views" } } }]),
    ]);

    const totalViews = viewAgg[0]?.totalViews || 0;

    return res.status(200).json({ totalUsers, totalVideos, totalViews, totalReports });
  } catch (error) {
    next(error);
  }
};

// @desc    List all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user (and cascade their videos)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const videos = await Video.find({ channel: user._id });
    for (const video of videos) {
      [video.videoUrl, video.thumbnailUrl].forEach((relPath) => {
        const absPath = path.join(__dirname, "..", relPath.replace(/^\/+/, ""));
        fs.unlink(absPath, () => {});
      });
    }
    await Video.deleteMany({ channel: user._id });
    await Comment.deleteMany({ user: user._id });

    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    List all videos (admin moderation view)
// @route   GET /api/admin/videos
// @access  Private/Admin
const getAllVideos = async (req, res, next) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 }).populate("channel", "fullName email");
    return res.status(200).json({ videos });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/remove an inappropriate video
// @route   DELETE /api/admin/videos/:id
// @access  Private/Admin
const removeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    [video.videoUrl, video.thumbnailUrl].forEach((relPath) => {
      const absPath = path.join(__dirname, "..", relPath.replace(/^\/+/, ""));
      fs.unlink(absPath, () => {});
    });

    await video.deleteOne();
    await Comment.deleteMany({ video: video._id });
    await Report.updateMany({ video: video._id }, { status: "resolved" });

    return res.status(200).json({ message: "Video removed" });
  } catch (error) {
    next(error);
  }
};

// @desc    List all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getAllReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .populate("video", "title thumbnailUrl")
      .populate("user", "fullName email");
    return res.status(200).json({ reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a report as resolved
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
const resolveReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "resolved" },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    return res.status(200).json({ report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getAllUsers,
  deleteUser,
  getAllVideos,
  removeVideo,
  getAllReports,
  resolveReport,
};
