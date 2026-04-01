const express = require("express");
const { body, param } = require("express-validator");

const {
  listConversations,
  createConversation,
  listMessages,
  sendMessage,
} = require("../controllers/conversationController");
const { auth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.use(auth);

router.get("/", listConversations);

router.post(
  "/",
  [body("participantId").isMongoId()],
  validate,
  createConversation,
);

router.get(
  "/:conversationId/messages",
  [param("conversationId").isMongoId()],
  validate,
  listMessages,
);

router.post(
  "/:conversationId/messages",
  [
    param("conversationId").isMongoId(),
    body("content").trim().isLength({ min: 1, max: 2000 }),
  ],
  validate,
  sendMessage,
);

module.exports = router;
