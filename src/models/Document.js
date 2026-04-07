const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    category: {
      type: String,
      enum: [
        "resources",
        "assignments",
        "lecture-notes",
        "practice",
        "reference",
      ],
      default: "resources",
      index: true,
    },
    subject: { type: String, trim: true, maxlength: 120, index: true },
    department: { type: String, trim: true, maxlength: 100, index: true },
    fileUrl: { type: String, required: true, trim: true },
    fileName: { type: String, trim: true, maxlength: 200 },
    fileType: { type: String, trim: true, maxlength: 80 },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Document", documentSchema);
