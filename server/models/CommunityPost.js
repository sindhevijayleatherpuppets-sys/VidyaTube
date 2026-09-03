const mongoose = require("mongoose");

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  votes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const communityPostSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, "Post text is required"],
      trim: true,
      maxlength: 3000,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    pollOptions: [pollOptionSchema],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

communityPostSchema.virtual("likeCount").get(function () {
  return this.likes ? this.likes.length : 0;
});
communityPostSchema.set("toJSON", { virtuals: true });
communityPostSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("CommunityPost", communityPostSchema);
