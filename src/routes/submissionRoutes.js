const express = require("express");
const { body, param } = require("express-validator");

const { gradeSubmission } = require("../controllers/submissionController");
const { auth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.use(auth);

router.patch(
  "/:submissionId/grade",
  [
    param("submissionId").isMongoId(),
    body("grade").isFloat({ min: 0, max: 1000 }),
    body("feedback").optional().trim().isLength({ max: 3000 }),
  ],
  validate,
  gradeSubmission,
);

module.exports = router;
