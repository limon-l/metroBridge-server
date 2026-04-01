const User = require("../models/User");
const { signJwt } = require("../config/jwt");
const { asyncHandler } = require("../utils/helpers");
const { createNotification } = require("../utils/notifications");

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role = "student", department } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role,
    department,
  });

  const token = signJwt({ sub: user._id.toString(), role: user.role });

  await createNotification({
    recipient: user._id,
    type: "system",
    title: "Welcome to MetroBridge",
    message: "Your account has been created successfully.",
    entityType: "user",
    entityId: user._id,
  });

  return res.status(201).json({
    message: "Registration successful",
    data: {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
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
      },
    },
  });
});

const me = asyncHandler(async (req, res) => {
  return res.status(200).json({ data: req.user });
});

module.exports = {
  register,
  login,
  me,
};
