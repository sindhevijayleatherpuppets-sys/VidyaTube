const mongoose = require("mongoose");

const CATEGORIES = [
  "Technology",
  "Education",
  "Music",
  "Gaming",
  "Entertainment",
  "News",
  "Comedy",
  "Science",
  "Sports",
  "Other",
];

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: "Other",
    },
    source: {
      type: String,
      enum: ["native", "youtube"],
      default: "native",
    },
    youtubeVideoId: {
      type: String,
      default: "",
    },
    embedUrl: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      default: "03:45",
    },
    tags: {
      type: [String],
      default: [],
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    visibility: {
      type: String,
      enum: ["public", "unlisted", "private"],
      default: "public",
    },
    isShort: {
      type: Boolean,
      default: false,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    isRemoved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Support real MongoDB-backed search on title/description/tags
videoSchema.index({ title: "text", description: "text", tags: "text" });
videoSchema.index({ category: 1 });
videoSchema.index({ channel: 1 });
videoSchema.index({ isShort: 1 });
videoSchema.index({ createdAt: -1 });

videoSchema.virtual("likeCount").get(function () {
  return this.likes ? this.likes.length : 0;
});
videoSchema.virtual("dislikeCount").get(function () {
  return this.dislikes ? this.dislikes.length : 0;
});
videoSchema.set("toJSON", { virtuals: true });
videoSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Video", videoSchema);
module.exports.CATEGORIES = CATEGORIES;

