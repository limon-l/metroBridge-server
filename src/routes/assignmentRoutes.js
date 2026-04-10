const express = require("express");
const { body, param } = require("express-validator");

const {
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");
const {
  upsertMySubmission,
  getMySubmission,
  withdrawMySubmission,
  listAssignmentSubmissions,
} = require("../controllers/submissionController");
const { auth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  uploadClassroomMaterial,
  uploadAssignmentSubmission,
} = require("../middleware/upload");

const router = express.Router();

router.use(auth);

router.get(
  "/:assignmentId",
  [param("assignmentId").isMongoId()],
  validate,
  getAssignmentById,
);

router.patch(
  "/:assignmentId",
  uploadClassroomMaterial.single("file"),
  [
    param("assignmentId").isMongoId(),
    body("title").optional().trim().isLength({ min: 1, max: 200 }),
    body("description").optional().trim().isLength({ max: 5000 }),
    body("dueDate").optional().isISO8601(),
    body("maxPoints").optional().isInt({ min: 1 }),
  ],
  validate,
  updateAssignment,
);

router.delete(
  "/:assignmentId",
  [param("assignmentId").isMongoId()],
  validate,
  deleteAssignment,
);

router.post(
  "/:assignmentId/submission",
  uploadAssignmentSubmission.single("file"),
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

router.delete(
  "/:assignmentId/submission/me",
  [param("assignmentId").isMongoId()],
  validate,
  withdrawMySubmission,
);

router.get(
  "/:assignmentId/submissions",
  [param("assignmentId").isMongoId()],
  validate,
  listAssignmentSubmissions,
);

module.exports = router;
