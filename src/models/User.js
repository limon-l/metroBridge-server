const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    universityId: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["student", "mentor", "admin"],
      default: "student",
      index: true,
    },
    department: { type: String, trim: true },
    batch: { type: String, trim: true },
    section: { type: String, trim: true },
    shift: { type: String, trim: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    bloodGroup: { type: String, trim: true },
    gender: { type: String, trim: true },
    homeAddress: { type: String, trim: true, maxlength: 500 },
    emergencyContactName: { type: String, trim: true },
    emergencyContactPhone: { type: String, trim: true },
    guardianName: { type: String, trim: true },
    guardianPhone: { type: String, trim: true },
    expertise: [{ type: String, trim: true }],
    projects: [{ type: String, trim: true }],
    thesis: { type: String, trim: true, maxlength: 300 },
    jobDetails: { type: String, trim: true, maxlength: 600 },
    educationDetails: { type: String, trim: true, maxlength: 600 },
    bio: { type: String, trim: true, maxlength: 600 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    isActive: { type: Boolean, default: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "banned"],
      default: "pending",
      index: true,
    },
    reviewedAt: { type: Date },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNote: { type: String, trim: true, maxlength: 500 },
    lastLoginAt: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.pre("validate", function applyRoleDefaults(next) {
  if (this.role === "admin") {
    this.approvalStatus = "approved";
  }
  next();
});

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(input) {
  return bcrypt.compare(input, this.password);
};

module.exports = mongoose.model("User", userSchema);
