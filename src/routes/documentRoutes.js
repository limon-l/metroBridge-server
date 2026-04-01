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
    body("fileUrl").trim().isURL(),
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
