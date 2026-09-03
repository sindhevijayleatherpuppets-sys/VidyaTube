const youtubeService = require("../services/youtubeService");
const Video = require("../models/Video");

// @desc    Search videos and channels dynamically in real-time via YouTube Data API
// @route   GET /api/youtube/search
// @access  Public
const searchYouTube = async (req, res, next) => {
  try {
    const { q = "", pageToken = "", category = "", maxResults = 20, type = "video", order = "relevance" } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({
        success: true,
        query: "",
        nativeResults: [],
        videos: [],
        channels: [],
        nextPageToken: null,
        totalResults: 0,
      });
    }

    // 1. Search YouTube Data API in real-time
    const ytResults = await youtubeService.searchVideos({
      q: q.trim(),
      pageToken,
      category,
      maxResults: parseInt(maxResults, 10) || 20,
      type,
      order,
    });

    // 2. Search Channels if first page
    let channelResults = [];
    if (!pageToken && !ytResults.isKeyMissing && !ytResults.error) {
      try {
        const chanData = await youtubeService.searchChannels({ q: q.trim(), maxResults: 3 });
        channelResults = chanData.channels || [];
      } catch (e) {}
    }

    // 3. Search Native VidyTube database if first page
    let nativeVideos = [];
    if (!pageToken && q.trim()) {
      try {
        nativeVideos = await Video.find({
          $text: { $search: q.trim() },
          isRemoved: { $ne: true },
          visibility: "public",
        })
          .populate("channel", "fullName avatar handle")
          .limit(6);
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      query: q.trim(),
      nativeResults: nativeVideos,
      videos: ytResults.videos || [],
      channels: channelResults,
      nextPageToken: ytResults.nextPageToken,
      prevPageToken: ytResults.prevPageToken,
      totalResults: (ytResults.totalResults || 0) + nativeVideos.length,
      isKeyMissing: !!ytResults.isKeyMissing,
      errorType: ytResults.errorType || null,
      error: ytResults.error || null,
      notice: ytResults.notice || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending videos from YouTube Data API v3
// @route   GET /api/youtube/trending
// @access  Public
const getTrending = async (req, res, next) => {
  try {
    const { regionCode = "IN", categoryId = "", maxResults = 20, pageToken = "" } = req.query;

    const results = await youtubeService.getTrendingVideos({
      regionCode,
      categoryId,
      maxResults: parseInt(maxResults, 10) || 20,
      pageToken,
    });

    // Also get top trending VidyTube native uploads
    let topNative = [];
    try {
      topNative = await Video.find({
        isRemoved: { $ne: true },
        visibility: "public",
      })
        .sort({ views: -1, createdAt: -1 })
        .populate("channel", "fullName avatar handle")
        .limit(6);
    } catch (e) {}

    return res.status(200).json({
      success: true,
      regionCode,
      nativeTrending: topNative,
      videos: results.videos || [],
      nextPageToken: results.nextPageToken,
      isKeyMissing: !!results.isKeyMissing,
      errorType: results.errorType || null,
      error: results.error || null,
      notice: results.notice || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get video details by YouTube Video ID
// @route   GET /api/youtube/videos/:id
// @access  Public
const getVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cleanId = (id || "").replace(/^yt_/, "");
    const video = await youtubeService.getVideoDetails(cleanId);
    let related = [];
    try {
      related = await youtubeService.getRelatedVideos(cleanId, video?.title);
    } catch (e) {}

    return res.status(200).json({
      success: true,
      video,
      related,
    });
  } catch (error) {
    // If any error occurs, still return a valid streamable video payload
    const cleanId = (req.params.id || "").replace(/^yt_/, "");
    return res.status(200).json({
      success: true,
      video: {
        _id: `yt_${cleanId}`,
        youtubeVideoId: cleanId,
        source: "youtube",
        title: "Creator Video",
        description: "Streaming via VidyTube player.",
        channelTitle: "Creator",
        channel: {
          fullName: "Creator",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
        },
        embedUrl: `https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=1&enablejsapi=1`,
        videoUrl: `https://www.youtube.com/watch?v=${cleanId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
        duration: "HD",
        views: 1000,
        likes: [],
      },
      related: [],
    });
  }
};

// @desc    Get channel details by Channel ID
// @route   GET /api/youtube/channels/:id
// @access  Public
const getChannel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const channel = await youtubeService.getChannelDetails(id);
    return res.status(200).json({
      success: true,
      channel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live dynamic YouTube Shorts
// @route   GET /api/youtube/shorts
// @access  Public
const getShorts = async (req, res, next) => {
  try {
    const { q = "shorts trending viral", pageToken = "", maxResults = 20 } = req.query;
    const result = await youtubeService.getYouTubeShorts({ q, pageToken, maxResults });

    // Also get native database shorts
    let nativeShorts = [];
    if (!pageToken) {
      try {
        nativeShorts = await Video.find({ isShort: true, isRemoved: false, visibility: "public" })
          .populate("channel", "fullName avatar handle subscriberCount")
          .limit(10);
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      shorts: [...nativeShorts, ...(result.shorts || [])],
      nextPageToken: result.nextPageToken,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchYouTube,
  getTrending,
  getVideo,
  getChannel,
  getShorts,
};

