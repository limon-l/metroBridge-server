const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topic: { type: String, required: true, trim: true, maxlength: 300 },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 60, min: 15, max: 240 },
    meetingLink: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
