const express = require("express");
const { body } = require("express-validator");

const {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { auth } = require("../middleware/auth");
const { authRateLimiter } = require("../middleware/rateLimiter");
const { syncFirebaseUser } = require("../controllers/gatewayController");

const router = express.Router();

router.post(
  "/sync",
  authRateLimiter,
  [
    body("firebaseToken").optional().isString(),
    body("name").optional().trim().isLength({ min: 2, max: 120 }),
    body("email").optional().trim().isEmail(),
    body("role").optional().isIn(["Student", "Mentor", "Admin"]),
    body("department").optional().trim().isLength({ max: 120 }),
    body("skills").optional().isArray(),
    body("bio").optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  syncFirebaseUser,
);

router.post(
  "/register",
  authRateLimiter,
  [
    body("fullName").trim().isLength({ min: 2 }),
    body("universityId").optional().trim().isLength({ min: 4, max: 50 }),
    body("email").trim().isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").optional().isIn(["student", "mentor"]),
    body("department").optional().trim().isLength({ min: 2, max: 100 }),
    body("batch").optional().trim().isLength({ max: 30 }),
    body("section").optional().trim().isLength({ max: 30 }),
    body("shift").optional().trim().isLength({ max: 30 }),
    body("phone").optional().trim().isLength({ max: 30 }),
    body("bloodGroup").optional().trim().isLength({ max: 5 }),
    body("gender").optional().trim().isLength({ max: 30 }),
    body("homeAddress").optional().trim().isLength({ max: 500 }),
    body("emergencyContactName").optional().trim().isLength({ max: 120 }),
    body("emergencyContactPhone").optional().trim().isLength({ max: 30 }),
    body("guardianName").optional().trim().isLength({ max: 120 }),
    body("guardianPhone").optional().trim().isLength({ max: 30 }),
    body("bio").optional().trim().isLength({ max: 600 }),
    body("expertise").optional().isArray(),
  ],
  validate,
  register,
);

router.post(
  "/login",
  authRateLimiter,
  [body("email").trim().isEmail(), body("password").isLength({ min: 6 })],
  validate,
  login,
);

router.post(
  "/forgot-password",
  authRateLimiter,
  [body("email").trim().isEmail()],
  validate,
  forgotPassword,
);

router.post(
  "/reset-password",
  authRateLimiter,
  [
    body("token").trim().isLength({ min: 20 }),
    body("password").isLength({ min: 6 }),
  ],
  validate,
  resetPassword,
);

router.get("/me", auth, me);

module.exports = router;
