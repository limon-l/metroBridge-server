const express = require("express");

const router = express.Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "Use /api/posts/:postId/comments routes for comment operations.",
  });
});

module.exports = router;
