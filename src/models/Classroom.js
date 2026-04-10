const mongoose = require("mongoose");

const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateJoinCode(length = 6) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * JOIN_CODE_CHARS.length);
    code += JOIN_CODE_CHARS.charAt(randomIndex);
  }
  return code;
}

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    joinCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      minlength: 6,
      maxlength: 6,
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

classroomSchema.pre("validate", function ensureJoinCode(next) {
  if (!this.joinCode) {
    this.joinCode = generateJoinCode(6);
  }
  this.joinCode = this.joinCode.toUpperCase();
  next();
});

module.exports = mongoose.model("Classroom", classroomSchema);
