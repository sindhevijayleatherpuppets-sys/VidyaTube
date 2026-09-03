const CommunityPost = require("../models/CommunityPost");

// @desc    Get community posts for a channel
// @route   GET /api/community/:channelId
// @access  Public
const getChannelPosts = async (req, res, next) => {
  try {
    const posts = await CommunityPost.find({ channel: req.params.channelId })
      .sort({ createdAt: -1 })
      .populate("channel", "fullName avatar handle");

    return res.status(200).json({ posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a community post
// @route   POST /api/community
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { text, imageUrl, pollOptions } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Post text is required" });
    }

    let parsedPoll = [];
    if (pollOptions && Array.isArray(pollOptions)) {
      parsedPoll = pollOptions
        .filter((opt) => opt && opt.trim())
        .map((opt) => ({ text: opt.trim(), votes: [] }));
    }

    const post = await CommunityPost.create({
      channel: req.user._id,
      text: text.trim(),
      imageUrl: imageUrl || "",
      pollOptions: parsedPoll,
    });

    const populated = await CommunityPost.findById(post._id).populate(
      "channel",
      "fullName avatar handle"
    );

    return res.status(201).json({ message: "Community post created", post: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote in a community poll
// @route   POST /api/community/:id/vote
// @access  Private
const votePoll = async (req, res, next) => {
  try {
    const { optionIndex } = req.body;
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.pollOptions || optionIndex < 0 || optionIndex >= post.pollOptions.length) {
      return res.status(400).json({ message: "Invalid poll option" });
    }

    const userId = req.user._id.toString();

    // Remove previous vote from all options
    post.pollOptions.forEach((opt) => {
      opt.votes = opt.votes.filter((id) => id.toString() !== userId);
    });

    // Add vote to chosen option
    post.pollOptions[optionIndex].votes.push(req.user._id);
    await post.save();

    const populated = await CommunityPost.findById(post._id).populate(
      "channel",
      "fullName avatar handle"
    );

    return res.status(200).json({ post: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / unlike a community post
// @route   POST /api/community/:id/like
// @access  Private
const toggleLikePost = async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    return res.status(200).json({ liked: !alreadyLiked, likeCount: post.likes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a community post
// @route   DELETE /api/community/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.channel.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete post" });
    }

    await post.deleteOne();
    return res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChannelPosts,
  createPost,
  votePoll,
  toggleLikePost,
  deletePost,
};
