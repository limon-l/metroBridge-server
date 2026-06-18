const mongoose = require("mongoose");

const courseMaterialSchema = new mongoose.Schema(
  {
    downloadUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    fileType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    uploadedBy: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
  },
  { _id: false, strict: true },
);

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
      maxlength: 40,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    materials: {
      type: [courseMaterialSchema],
      default: [],
      validate: {
        validator: (materials) => Array.isArray(materials),
        message: "materials must be an array",
      },
    },
  },
  {
    timestamps: true,
    strict: true,
    minimize: false,
  },
);

courseSchema.index({ title: "text", courseCode: "text", department: "text" });

module.exports = mongoose.model("Course", courseSchema);
