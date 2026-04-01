const User = require("../models/User");
const { signJwt } = require("../config/jwt");
const { asyncHandler } = require("../utils/helpers");
const { createNotification } = require("../utils/notifications");
const crypto = require("crypto");

const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    universityId,
    email,
    password,
    role = "student",
    department,
    batch,
    section,
    shift,
    phone,
    dateOfBirth,
    bloodGroup,
    gender,
    homeAddress,
    emergencyContactName,
    emergencyContactPhone,
    guardianName,
    guardianPhone,
    bio,
    expertise,
  } = req.body;

  if (!["student", "mentor"].includes(role)) {
    return res
      .status(400)
      .json({ message: "Only student or mentor registration is allowed." });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const user = await User.create({
    fullName,
    universityId,
    email,
    password,
    role,
    department,
    batch,
    section,
    shift,
    phone,
    dateOfBirth,
    bloodGroup,
    gender,
    homeAddress,
    emergencyContactName,
    emergencyContactPhone,
    guardianName,
    guardianPhone,
    bio,
    expertise,
    approvalStatus: "pending",
  });

  await createNotification({
    recipient: user._id,
    type: "system",
    title: "Welcome to MetroBridge",
    message: "Your account has been created successfully.",
    entityType: "user",
    entityId: user._id,
  });

  return res.status(201).json({
    message: "Registration submitted. Wait for admin approval before login.",
    data: {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "Account is inactive" });
  }

  if (user.role !== "admin" && user.approvalStatus !== "approved") {
    if (user.approvalStatus === "banned") {
      return res
        .status(403)
        .json({ message: "Your account is banned by admin." });
    }

    return res.status(403).json({
      message: "Your account is pending admin approval.",
    });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signJwt({ sub: user._id.toString(), role: user.role });

  return res.status(200).json({
    message: "Login successful",
    data: {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    },
  });
});

const me = asyncHandler(async (req, res) => {
  return res.status(200).json({ data: req.user });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(200).json({
      message:
        "If the email exists, password reset instructions have been generated.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  return res.status(200).json({
    message:
      "If the email exists, password reset instructions have been generated.",
    data: {
      // Returned for local development where email delivery is not configured.
      resetToken,
      expiresInMinutes: 15,
    },
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpires");

  if (!user) {
    return res.status(400).json({
      message: "Invalid or expired password reset token.",
    });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.status(200).json({
    message: "Password reset successful. Please login with your new password.",
  });
});

module.exports = {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
};
