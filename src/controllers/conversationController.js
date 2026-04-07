const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { asyncHandler } = require("../utils/helpers");
const { createNotificationsBulk } = require("../utils/notifications");
const { emitMessageCreated } = require("../realtime/socket");

const listConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate("participants", "fullName role")
    .sort({ updatedAt: -1 });

  return res.status(200).json({ data: conversations });
});

const createConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.body;

  const existing = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId], $size: 2 },
  });

  if (existing) {
    return res.status(200).json({ data: existing });
  }

  const conversation = await Conversation.create({
    participants: [req.user._id, participantId],
  });

  await conversation.populate("participants", "fullName role");

  return res.status(201).json({ data: conversation });
});

const listMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.conversationId,
    participants: req.user._id,
  });

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const messages = await Message.find({ conversation: conversation._id })
    .populate("sender", "fullName role")
    .sort({ createdAt: 1 });

  return res.status(200).json({ data: messages });
});

const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.conversationId,
    participants: req.user._id,
  });

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const { content = "", mediaUrl = "", mediaType = "" } = req.body;
  if (!content.trim() && !mediaUrl) {
    return res
      .status(400)
      .json({ message: "Message content or media is required." });
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    content: content.trim() || (mediaUrl ? "Photo" : ""),
    mediaUrl,
    mediaType,
  });

  conversation.lastMessage = content.trim() || (mediaUrl ? "Photo" : "Media");
  conversation.lastMessageAt = new Date();
  await conversation.save();

  await message.populate("sender", "fullName role");

  const recipientIds = conversation.participants
    .map((participantId) => participantId.toString())
    .filter((participantId) => participantId !== req.user._id.toString());

  await createNotificationsBulk(
    recipientIds.map((recipient) => ({
      recipient,
      actor: req.user._id,
      type: "message",
      title: "New message",
      message: `${req.user.fullName}: ${String(content || mediaType || "Photo").slice(0, 80)}`,
      entityType: "conversation",
      entityId: conversation._id,
    })),
  );

  emitMessageCreated({
    conversationId: conversation._id,
    recipientIds,
    message: {
      ...message.toObject(),
      id: message._id.toString(),
      senderId: req.user._id.toString(),
      senderName: req.user.fullName,
      text: message.content,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      timestamp: message.createdAt,
    },
  });

  return res.status(201).json({ data: message });
});

module.exports = {
  listConversations,
  createConversation,
  listMessages,
  sendMessage,
};
