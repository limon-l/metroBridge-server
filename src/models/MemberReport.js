const mongoose = require("mongoose");

const memberReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: { type: String, trim: true, maxlength: 500, required: true },
    category: {
      type: String,
      enum: ["chat", "resource", "profile", "other"],
      default: "other",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "rejected"],
      default: "pending",
      index: true,
    },
    adminDecision: {
      type: String,
      enum: ["none", "approve", "reject", "ban"],
      default: "none",
    },
    adminNote: { type: String, trim: true, maxlength: 500 },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

memberReportSchema.index(
  { reporter: 1, reportedUser: 1 },
  { unique: true, name: "unique_member_report_pair" },
);

module.exports = mongoose.model("MemberReport", memberReportSchema);
