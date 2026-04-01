const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    mediaUrl: { type: String, trim: true },
    reactionCounts: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      support: { type: Number, default: 0 },
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        type: {
          type: String,
          enum: ["like", "love", "wow", "support"],
          required: true,
        },
      },
    ],
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", postSchema);
