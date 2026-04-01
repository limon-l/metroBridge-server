const express = require("express");
const { body } = require("express-validator");

const { register, login, me } = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { auth } = require("../middleware/auth");
const { authRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post(
  "/register",
  authRateLimiter,
  [
    body("fullName").trim().isLength({ min: 2 }),
    body("email").trim().isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").optional().isIn(["student", "mentor", "admin"]),
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

router.get("/me", auth, me);

module.exports = router;
