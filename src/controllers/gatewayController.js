const { asyncHandler } = require("../utils/helpers");
const IdentityUser = require("../models/IdentityUser");
const Course = require("../models/Course");
const { verifyFirebaseToken } = require("../middleware/checkRole");

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeRole = (value) => {
  const role = String(value || "Student")
    .trim()
    .toLowerCase();
  if (role === "admin") return "Admin";
  if (role === "mentor") return "Mentor";
  return "Student";
};

const normalizeArray = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];

const syncFirebaseUser = asyncHandler(async (req, res) => {
  const authorizationToken = req.headers.authorization || "";
  const bodyToken = req.body.firebaseToken
    ? `Bearer ${req.body.firebaseToken}`
    : "";
  const decoded = await verifyFirebaseToken(authorizationToken || bodyToken);
  const firebaseUid = decoded.uid || decoded.user_id || decoded.sub;

  const identityUser = await IdentityUser.findOneAndUpdate(
    { uid: firebaseUid },
    {
      uid: firebaseUid,
      name:
        req.body.name ||
        decoded.name ||
        decoded.displayName ||
        "MetroBridge User",
      email: (req.body.email || decoded.email || "").toLowerCase(),
      role: normalizeRole(
        req.body.role || decoded.role || decoded.customClaims?.role,
      ),
      department: req.body.department || "",
      skills: normalizeArray(req.body.skills),
      bio: req.body.bio || "",
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return res.status(200).json({
    message: "Firebase user synchronized successfully",
    data: { user: identityUser },
  });
});

const toggleApprovalStatus = asyncHandler(async (req, res) => {
  const user = await IdentityUser.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.approvalStatus =
    user.approvalStatus === "Approved" ? "Rejected" : "Approved";
  await user.save();

  return res.status(200).json({
    message: `Approval status updated to ${user.approvalStatus}`,
    data: { user },
  });
});

const searchCourses = asyncHandler(async (req, res) => {
  const query = String(req.query.q || req.query.query || "").trim();
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));

  const filter = query
    ? {
        $or: [
          { courseCode: { $regex: escapeRegex(query), $options: "i" } },
          { title: { $regex: escapeRegex(query), $options: "i" } },
          { department: { $regex: escapeRegex(query), $options: "i" } },
          {
            "materials.fileType": { $regex: escapeRegex(query), $options: "i" },
          },
          {
            "materials.downloadUrl": {
              $regex: escapeRegex(query),
              $options: "i",
            },
          },
          {
            "materials.uploadedBy": {
              $regex: escapeRegex(query),
              $options: "i",
            },
          },
        ],
      }
    : {};

  const courses = await Course.find(filter)
    .sort({ courseCode: 1, title: 1 })
    .limit(limit)
    .lean();

  return res.status(200).json({
    data: courses,
    meta: {
      query,
      count: courses.length,
    },
  });
});

module.exports = {
  syncFirebaseUser,
  toggleApprovalStatus,
  searchCourses,
};
