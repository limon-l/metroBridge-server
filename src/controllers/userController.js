const User = require("../models/User");
const { asyncHandler } = require("../utils/helpers");

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getMyProfile = asyncHandler(async (req, res) => {
  return res.status(200).json({ data: req.user });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "fullName",
    "department",
    "batch",
    "section",
    "shift",
    "dateOfBirth",
    "bloodGroup",
    "gender",
    "emergencyContactName",
    "emergencyContactPhone",
    "guardianName",
    "guardianPhone",
    "bio",
    "expertise",
    "projects",
    "thesis",
    "jobDetails",
    "educationDetails",
    "profilePhoto",
  ];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  return res.status(200).json({ data: user });
});

const listPendingUsers = asyncHandler(async (req, res) => {
  const filter = {
    approvalStatus: "pending",
    role: { $in: ["student", "mentor"] },
  };
  if (req.query.role && ["student", "mentor"].includes(req.query.role)) {
    filter.role = req.query.role;
  }

  const users = await User.find(filter)
    .select(
      "fullName email role department universityId batch section shift phone bloodGroup createdAt",
    )
    .sort({ createdAt: -1 });

  return res.status(200).json({ data: users });
});

const listApprovedUsers = asyncHandler(async (req, res) => {
  const { q, department, role, bloodGroup } = req.query;

  const filter = {
    approvalStatus: "approved",
    role: { $in: ["student", "mentor"] },
  };

  if (role && ["student", "mentor"].includes(role)) {
    filter.role = role;
  }

  if (department) {
    filter.department = { $regex: escapeRegex(department), $options: "i" };
  }

  if (bloodGroup) {
    filter.bloodGroup = bloodGroup;
  }

  if (q) {
    filter.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { universityId: { $regex: q, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select(
      "fullName email role department universityId bloodGroup batch section shift phone approvalStatus createdAt",
    )
    .sort({ fullName: 1 });

  return res.status(200).json({ data: users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({ data: user });
});

const reviewUser = asyncHandler(async (req, res) => {
  const { action, note } = req.body;
  if (!["approve", "ban"].includes(action)) {
    return res.status(400).json({ message: "Invalid review action." });
  }

  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "admin") {
    return res
      .status(400)
      .json({ message: "Admin accounts cannot be reviewed." });
  }

  user.approvalStatus = action === "approve" ? "approved" : "banned";
  user.reviewedBy = req.user._id;
  user.reviewedAt = new Date();
  user.reviewNote = note || "";
  user.isActive = action === "approve";
  await user.save();

  return res.status(200).json({
    message: `User ${action === "approve" ? "approved" : "banned"} successfully`,
    data: user,
  });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  listPendingUsers,
  listApprovedUsers,
  getUserById,
  reviewUser,
};
