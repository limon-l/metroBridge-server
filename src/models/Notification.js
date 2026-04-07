const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "system",
        "post_comment",
        "post_reaction",
        "mention",
        "message",
        "appointment_created",
        "appointment_status_changed",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, trim: true, maxlength: 600 },
    entityType: {
      type: String,
      enum: [
        "post",
        "comment",
        "conversation",
        "appointment",
        "document",
        "user",
      ],
    },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
