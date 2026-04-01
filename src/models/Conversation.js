const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    ],
    lastMessage: { type: String, trim: true, maxlength: 1000 },
    lastMessageAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Conversation", conversationSchema);
