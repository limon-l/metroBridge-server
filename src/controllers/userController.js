const User = require("../models/User");
const { asyncHandler } = require("../utils/helpers");

const getMyProfile = asyncHandler(async (req, res) => {
  return res.status(200).json({ data: req.user });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["fullName", "department", "bio", "expertise"];
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

module.exports = {
  getMyProfile,
  updateMyProfile,
};
