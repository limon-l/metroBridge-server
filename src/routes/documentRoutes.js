const express = require("express");
const { body, param } = require("express-validator");

const {
  listDocuments,
  createDocument,
  incrementDownload,
  deleteDocument,
} = require("../controllers/documentController");
const { auth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.get("/", listDocuments);

router.post(
  "/",
  auth,
  [
    body("title").trim().isLength({ min: 2, max: 200 }),
    body("fileUrl")
      .trim()
      .custom(
        (value) =>
          /^data:[^\s]+;base64,/.test(value) || /^https?:\/\//i.test(value),
      ),
    body("subject").trim().isLength({ min: 2, max: 120 }),
    body("department").trim().isLength({ min: 2, max: 100 }),
    body("category")
      .optional()
      .isIn([
        "resources",
        "assignments",
        "lecture-notes",
        "practice",
        "reference",
      ]),
  ],
  validate,
  createDocument,
);

router.patch(
  "/:documentId/download",
  [param("documentId").isMongoId()],
  validate,
  incrementDownload,
);

router.delete(
  "/:documentId",
  auth,
  [param("documentId").isMongoId()],
  validate,
  deleteDocument,
);

module.exports = router;
