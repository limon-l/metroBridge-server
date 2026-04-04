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
  },
  { timestamps: true },
);

memberReportSchema.index(
  { reporter: 1, reportedUser: 1 },
  { unique: true, name: "unique_member_report_pair" },
);

module.exports = mongoose.model("MemberReport", memberReportSchema);
