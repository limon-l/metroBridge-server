const express = require("express");
const { body, param } = require("express-validator");

const {
  createClassroom,
  listMyClassrooms,
  getClassroomById,
  joinClassroomByCode,
  listClassroomStudents,
  listClassroomMaterials,
  createClassroomMaterial,
  deleteClassroomMaterial,
  listClassroomNotices,
  createClassroomNotice,
  cloneClassroom,
} = require("../controllers/classroomController");
const {
  createAssignment,
  listClassroomAssignments,
} = require("../controllers/assignmentController");
const {
  listMyClassroomSubmissions,
} = require("../controllers/submissionController");
const { auth } = require("../middleware/auth");
const { uploadClassroomMaterial } = require("../middleware/upload");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.use(auth);

router.get("/my", listMyClassrooms);

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 2, max: 120 }),
    body("description").optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  createClassroom,
);

router.post(
  "/join",
  [body("joinCode").trim().isLength({ min: 6, max: 6 })],
  validate,
  joinClassroomByCode,
);

router.post(
  "/:classroomId/clone",
  [param("classroomId").isMongoId()],
  validate,
  cloneClassroom,
);

router.get(
  "/:classroomId",
  [param("classroomId").isMongoId()],
  validate,
  getClassroomById,
);

router.get(
  "/:classroomId/students",
  [param("classroomId").isMongoId()],
  validate,
  listClassroomStudents,
);

router.get(
  "/:classroomId/assignments",
  [param("classroomId").isMongoId()],
  validate,
  listClassroomAssignments,
);

router.get(
  "/:classroomId/submissions/me",
  [param("classroomId").isMongoId()],
  validate,
  listMyClassroomSubmissions,
);

router.post(
  "/:classroomId/assignments",
  uploadClassroomMaterial.single("file"),
  [
    param("classroomId").isMongoId(),
    body("title").trim().isLength({ min: 2, max: 200 }),
    body("description").optional().trim().isLength({ max: 5000 }),
    body("dueDate").isISO8601(),
    body("maxPoints").optional().isInt({ min: 1, max: 1000 }),
  ],
  validate,
  createAssignment,
);

router.get(
  "/:classroomId/materials",
  [param("classroomId").isMongoId()],
  validate,
  listClassroomMaterials,
);

router.post(
  "/:classroomId/materials",
  uploadClassroomMaterial.single("file"),
  [
    param("classroomId").isMongoId(),
    body("title").trim().isLength({ min: 2, max: 200 }),
    body("description").optional().trim().isLength({ max: 2000 }),
    body("fileUrl").optional().trim().isLength({ min: 5, max: 2048 }),
  ],
  validate,
  createClassroomMaterial,
);

router.delete(
  "/:classroomId/materials/:materialId",
  [param("classroomId").isMongoId(), param("materialId").isMongoId()],
  validate,
  deleteClassroomMaterial,
);

router.get(
  "/:classroomId/notices",
  [param("classroomId").isMongoId()],
  validate,
  listClassroomNotices,
);

router.post(
  "/:classroomId/notices",
  [
    param("classroomId").isMongoId(),
    body("title").trim().isLength({ min: 2, max: 200 }),
    body("content").trim().isLength({ min: 2, max: 5000 }),
  ],
  validate,
  createClassroomNotice,
);

module.exports = router;
