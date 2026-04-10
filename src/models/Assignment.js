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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Assignment", assignmentSchema);
