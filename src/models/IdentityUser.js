const mongoose = require("mongoose");

const identityUserSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Student", "Mentor", "Admin"],
      default: "Student",
      index: true,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    approvalStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (skills) =>
          Array.isArray(skills) &&
          skills.every((skill) => typeof skill === "string"),
        message: "skills must be an array of strings",
      },
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
    strict: true,
    minimize: false,
  },
);

identityUserSchema.pre("validate", function normalizeApproval(next) {
  if (this.role === "Admin") {
    this.approvalStatus = "Approved";
  }

  next();
});

module.exports = mongoose.model("IdentityUser", identityUserSchema);
