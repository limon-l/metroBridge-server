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
    fileUrl: { type: String, required: true, trim: true },
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
