const express = require("express");
const { body } = require("express-validator");

const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/userController");
const { auth } = require("../middleware/auth");
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

module.exports = router;
