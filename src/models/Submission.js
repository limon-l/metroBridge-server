const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    textSubmission: { type: String, trim: true, maxlength: 10000 },
    fileUrl: { type: String, trim: true, maxlength: 2048 },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["submitted", "graded"],
      default: "submitted",
    },
    grade: { type: Number, min: 0 },
    feedback: { type: String, trim: true, maxlength: 3000 },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    gradedAt: { type: Date },
  },
  { timestamps: true },
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

submissionSchema.pre("validate", function ensureSubmissionContent(next) {
  if (!this.textSubmission && !this.fileUrl) {
    return next(new Error("Either textSubmission or fileUrl is required."));
  }
  return next();
});

module.exports = mongoose.model("Submission", submissionSchema);
