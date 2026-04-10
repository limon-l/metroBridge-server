const express = require("express");
const { body, param } = require("express-validator");

const { getAssignmentById } = require("../controllers/assignmentController");
const {
  upsertMySubmission,
  getMySubmission,
  listAssignmentSubmissions,
} = require("../controllers/submissionController");
const { auth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.use(auth);

router.get(
  "/:assignmentId",
  [param("assignmentId").isMongoId()],
  validate,
  getAssignmentById,
);

router.post(
  "/:assignmentId/submission",
  [
    param("assignmentId").isMongoId(),
    body("textSubmission").optional().trim().isLength({ max: 10000 }),
    body("fileUrl").optional().trim().isLength({ max: 2048 }),
  ],
  validate,
  upsertMySubmission,
);

router.get(
  "/:assignmentId/submission/me",
  [param("assignmentId").isMongoId()],
  validate,
  getMySubmission,
);

router.get(
  "/:assignmentId/submissions",
  [param("assignmentId").isMongoId()],
  validate,
  listAssignmentSubmissions,
);

module.exports = router;
