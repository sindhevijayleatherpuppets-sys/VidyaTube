const User = require("../models/User");
const Video = require("../models/Video");
const Subscription = require("../models/Subscription");
const Notification = require("../models/Notification");

// @desc    Get a user's public profile/channel page
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const videos = await Video.find({ channel: user._id, isRemoved: false, isShort: false }).sort({
      createdAt: -1,
    });

    const shorts = await Video.find({ channel: user._id, isRemoved: false, isShort: true }).sort({
      createdAt: -1,
    });

    let isSubscribed = false;
    if (req.user) {
      const sub = await Subscription.findOne({
        subscriber: req.user._id,
        channel: user._id,
      });
      isSubscribed = !!sub;
    }

    const totalViews = [...videos, ...shorts].reduce((sum, v) => sum + (v.views || 0), 0);

    return res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        banner: user.banner || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80",
        bio: user.bio || "Welcome to my official VidyTube channel!",
        handle: user.handle || `@${user.fullName.toLowerCase().replace(/\s+/g, "")}`,
        subscriberCount: user.subscriberCount || 0,
        createdAt: user.createdAt,
        totalViews,
      },
      videos,
      shorts,
      videoCount: videos.length + shorts.length,
      isSubscribed,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update channel profile (banner, avatar, bio, handle, name)
// @route   PUT /api/users/profile/update
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { fullName, avatar, banner, bio, handle } = req.body;
    if (fullName) user.fullName = fullName.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();
    if (banner !== undefined) user.banner = banner.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (handle !== undefined) user.handle = handle.trim();

    await user.save();

    return res.status(200).json({
      message: "Channel profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        banner: user.banner,
        bio: user.bio,
        handle: user.handle,
        subscriberCount: user.subscriberCount,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Subscribe/unsubscribe to a channel (toggle)
// @route   POST /api/users/:id/subscribe
// @access  Private
const toggleSubscribe = async (req, res, next) => {
  try {
    const channelId = req.params.id;

    if (channelId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot subscribe to your own channel" });
    }

    const channel = await User.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const existing = await Subscription.findOne({
      subscriber: req.user._id,
      channel: channelId,
    });

    let subscribed;
    if (existing) {
      await existing.deleteOne();
      channel.subscriberCount = Math.max(0, channel.subscriberCount - 1);
      subscribed = false;
    } else {
      await Subscription.create({ subscriber: req.user._id, channel: channelId });
      channel.subscriberCount += 1;
      subscribed = true;

      // Send notification
      await Notification.create({
        recipient: channel._id,
        sender: req.user._id,
        type: "subscribe",
        message: `${req.user.fullName} subscribed to your channel!`,
      });
    }

    await channel.save();

    return res.status(200).json({
      subscribed,
      subscriberCount: channel.subscriberCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List channels the current user is subscribed to
// @route   GET /api/users/subscriptions/mine
// @access  Private
const getMySubscriptions = async (req, res, next) => {
  try {
    const subs = await Subscription.find({ subscriber: req.user._id }).populate(
      "channel",
      "fullName avatar subscriberCount handle bio banner"
    );
    return res.status(200).json({ channels: subs.map((s) => s.channel).filter(Boolean) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's favorites
// @route   GET /api/users/library/favorites
// @access  Private
const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favorites",
      populate: { path: "channel", select: "fullName avatar handle" },
    });
    return res.status(200).json({ favorites: user.favorites || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite on a video
// @route   POST /api/users/library/favorites/:videoId
// @access  Private
const toggleFavorite = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const user = await User.findById(req.user._id);

    // Support either ObjectId or YouTube-sourced ID
    let video = await Video.findById(videoId);
    if (!video && videoId.startsWith("yt_")) {
      // Find or register reference
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

    const index = user.favorites.indexOf(video._id);
    let isFavorite = false;
    if (index > -1) {
      user.favorites.splice(index, 1);
      isFavorite = false;
    } else {
      user.favorites.push(video._id);
      isFavorite = true;
    }

    await user.save();
    return res.status(200).json({ isFavorite, message: isFavorite ? "Added to Favorites" : "Removed from Favorites" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's Watch Later queue
// @route   GET /api/users/library/watch-later
// @access  Private
const getWatchLater = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "watchLater",
      populate: { path: "channel", select: "fullName avatar handle" },
    });
    return res.status(200).json({ watchLater: user.watchLater || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Watch Later on a video
// @route   POST /api/users/library/watch-later/:videoId
// @access  Private
const toggleWatchLater = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const user = await User.findById(req.user._id);

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

    const index = user.watchLater.indexOf(video._id);
    let isWatchLater = false;
    if (index > -1) {
      user.watchLater.splice(index, 1);
      isWatchLater = false;
    } else {
      user.watchLater.push(video._id);
      isWatchLater = true;
    }

    await user.save();
    return res.status(200).json({ isWatchLater, message: isWatchLater ? "Saved to Watch Later" : "Removed from Watch Later" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's liked videos
// @route   GET /api/users/library/liked
// @access  Private
const getLikedVideos = async (req, res, next) => {
  try {
    const liked = await Video.find({ likes: req.user._id, isRemoved: false })
      .populate("channel", "fullName avatar handle")
      .sort({ updatedAt: -1 });
    return res.status(200).json({ videos: liked });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  toggleSubscribe,
  getMySubscriptions,
  getFavorites,
  toggleFavorite,
  getWatchLater,
  toggleWatchLater,
  getLikedVideos,
};
