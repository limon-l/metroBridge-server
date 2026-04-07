const express = require("express");
const { body, param } = require("express-validator");

const {
  listPosts,
  createPost,
  reactToPost,
  removeReaction,
  listPostReactions,
  deletePost,
} = require("../controllers/postController");
const {
  addComment,
  listCommentsByPost,
} = require("../controllers/commentController");
const { auth, optionalAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.get("/", optionalAuth, listPosts);

router.post(
  "/",
  auth,
  [
    body("content").optional().trim().isLength({ min: 1, max: 4000 }),
    body("mediaUrl").optional().trim().isLength({ max: 4000 }),
    body("mediaName").optional().trim().isLength({ max: 200 }),
    body("mediaType").optional().trim().isLength({ max: 80 }),
    body("sharedPostId").optional().isMongoId(),
  ],
  validate,
  createPost,
);

router.delete(
  "/:postId",
  auth,
  [param("postId").isMongoId()],
  validate,
  deletePost,
);

router.post(
  "/:postId/reactions",
  auth,
  [
    param("postId").isMongoId(),
    body("type").isIn(["like", "love", "wow", "support"]),
  ],
  validate,
  reactToPost,
);

router.delete(
  "/:postId/reactions",
  auth,
  [param("postId").isMongoId()],
  validate,
  removeReaction,
);

router.get(
  "/:postId/reactions",
  auth,
  [param("postId").isMongoId()],
  validate,
  listPostReactions,
);

router.get(
  "/:postId/comments",
  [param("postId").isMongoId()],
  validate,
  listCommentsByPost,
);

router.post(
  "/:postId/comments",
  auth,
  [
    param("postId").isMongoId(),
    body("content").trim().isLength({ min: 1, max: 1000 }),
  ],
  validate,
  addComment,
);

module.exports = router;
