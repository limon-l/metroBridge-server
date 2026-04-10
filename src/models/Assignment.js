const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    dueDate: { type: Date, required: true, index: true },
    maxPoints: { type: Number, default: 100, min: 1 },
    attachmentUrl: { type: String, trim: true, maxlength: 2048 },
    attachmentName: { type: String, trim: true, maxlength: 255 },
    attachmentType: { type: String, trim: true, maxlength: 100 },
    attachmentSize: { type: Number, min: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Assignment", assignmentSchema);
