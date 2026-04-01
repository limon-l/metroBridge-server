const express = require("express");
const { body, param } = require("express-validator");

const {
  getMyProfile,
  updateMyProfile,
  listPendingUsers,
  getUserById,
  reviewUser,
} = require("../controllers/userController");
const { auth, requireRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.use(auth);

router.get("/me", getMyProfile);

router.patch(
  "/me",
  [
    body("fullName").optional().trim().isLength({ min: 2, max: 100 }),
    body("department").optional().trim().isLength({ min: 2, max: 100 }),
    body("bio").optional().trim().isLength({ max: 600 }),
    body("expertise").optional().isArray(),
  ],
  validate,
  updateMyProfile,
);

router.get("/pending", requireRoles("admin"), listPendingUsers);

router.get(
  "/:userId",
  requireRoles("admin"),
  [param("userId").isMongoId()],
  validate,
  getUserById,
);

router.patch(
  "/:userId/review",
  requireRoles("admin"),
  [
    param("userId").isMongoId(),
    body("action").isIn(["approve", "ban"]),
    body("note").optional().trim().isLength({ max: 500 }),
  ],
  validate,
  reviewUser,
);

module.exports = router;
