const mongoose = require("mongoose");

const sessionBookingSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    mentorId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Requested", "Confirmed", "Completed"],
      default: "Requested",
      index: true,
    },
    videoRoomId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      maxlength: 120,
    },
  },
  {
    timestamps: true,
    strict: true,
    minimize: false,
  },
);

module.exports = mongoose.model("SessionBooking", sessionBookingSchema);
