const Playlist = require("../models/Playlist");
const Video = require("../models/Video");

// @desc    Create a playlist
// @route   POST /api/playlists
// @access  Private
const createPlaylist = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Playlist name is required" });
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      owner: req.user._id,
    });
    return res.status(201).json({ playlist });
  } catch (error) {
    next(error);
  }
};

// @desc    List the current user's playlists
// @route   GET /api/playlists
// @access  Private
const getMyPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "videos",
        populate: { path: "channel", select: "fullName avatar handle" },
      });
    return res.status(200).json({ playlists });
  } catch (error) {
    next(error);
  }
};

// @desc    Get one playlist by id
// @route   GET /api/playlists/:id
// @access  Private
const getPlaylistById = async (req, res, next) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      owner: req.user._id,
    }).populate({
      path: "videos",
      populate: { path: "channel", select: "fullName avatar handle" },
    });

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    return res.status(200).json({ playlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or remove a video from a playlist / rename
// @route   PUT /api/playlists/:id
// @access  Private
// @body    { action: "add" | "remove", videoId, name }
const updatePlaylist = async (req, res, next) => {
  try {
    const { action, videoId, name } = req.body;

    const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user._id });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (typeof name === "string" && name.trim()) {
      playlist.name = name.trim();
    }

    if (videoId) {
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

      if (video) {
        if (action === "add") {
          if (!playlist.videos.some((v) => v.toString() === video._id.toString())) {
            playlist.videos.push(video._id);
          }
        } else if (action === "remove") {
          playlist.videos = playlist.videos.filter((v) => v.toString() !== video._id.toString());
        }
      }
    }

    await playlist.save();
    return res.status(200).json({ playlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a playlist
// @route   DELETE /api/playlists/:id
// @access  Private
const deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }
    return res.status(200).json({ message: "Playlist deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
};
