const mongoose = require("mongoose");

const classroomMaterialSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    fileUrl: { type: String, required: true, trim: true, maxlength: 2048 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ClassroomMaterial", classroomMaterialSchema);
