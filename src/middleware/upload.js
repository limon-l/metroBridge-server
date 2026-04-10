const fs = require("fs");
const path = require("path");
const multer = require("multer");

const MATERIAL_UPLOAD_DIR = path.join(
  __dirname,
  "..",
  "..",
  "uploads",
  "classroom-materials",
);

const SUBMISSION_UPLOAD_DIR = path.join(
  __dirname,
  "..",
  "..",
  "uploads",
  "submissions",
);

const MATERIAL_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MATERIAL_ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

// More permissive for student submissions
const SUBMISSION_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "audio/mpeg",
]);

const SUBMISSION_ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".csv",
  ".zip",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".mp3",
]);

function ensureUploadDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Material upload configuration
const materialStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    ensureUploadDirectory(MATERIAL_UPLOAD_DIR);
    callback(null, MATERIAL_UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeBaseName = path
      .basename(file.originalname || "material", extension)
      .replace(/[^a-z0-9-_]/gi, "-")
      .slice(0, 80);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${safeBaseName || "material"}-${uniqueSuffix}${extension}`);
  },
});

// Submission upload configuration
const submissionStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    ensureUploadDirectory(SUBMISSION_UPLOAD_DIR);
    callback(null, SUBMISSION_UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeBaseName = path
      .basename(file.originalname || "submission", extension)
      .replace(/[^a-z0-9-_]/gi, "-")
      .slice(0, 80);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(
      null,
      `${safeBaseName || "submission"}-${uniqueSuffix}${extension}`,
    );
  },
});

function materialFileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const mimeTypeAllowed = MATERIAL_ALLOWED_MIME_TYPES.has(file.mimetype);
  const extensionAllowed = MATERIAL_ALLOWED_EXTENSIONS.has(extension);

  if (!mimeTypeAllowed || !extensionAllowed) {
    const error = new Error(
      "Unsupported file type. Upload PDF, DOC, DOCX, JPG, PNG, WEBP, or GIF.",
    );
    error.statusCode = 400;
    callback(error);
    return;
  }

  callback(null, true);
}

function submissionFileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const mimeTypeAllowed = SUBMISSION_ALLOWED_MIME_TYPES.has(file.mimetype);
  const extensionAllowed = SUBMISSION_ALLOWED_EXTENSIONS.has(extension);

  if (!mimeTypeAllowed || !extensionAllowed) {
    const error = new Error(
      "Unsupported file type. Allowed: Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX), Presentations (PPT, PPTX), Archives (ZIP), Images (JPG, PNG, GIF, WEBP), Videos (MP4), Audio (MP3), Plain Text (TXT, CSV).",
    );
    error.statusCode = 400;
    callback(error);
    return;
  }

  callback(null, true);
}

const uploadClassroomMaterial = multer({
  storage: materialStorage,
  fileFilter: materialFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

const uploadAssignmentSubmission = multer({
  storage: submissionStorage,
  fileFilter: submissionFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for submissions
  },
});

module.exports = {
  uploadClassroomMaterial,
  uploadAssignmentSubmission,
};
