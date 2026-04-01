const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { asyncHandler } = require("../utils/helpers");
const { createNotificationsBulk } = require("../utils/notifications");

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

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    content: req.body.content,
  });

  conversation.lastMessage = req.body.content;
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
      message: `${req.user.fullName}: ${req.body.content.slice(0, 80)}`,
      entityType: "conversation",
      entityId: conversation._id,
    })),
  );

  return res.status(201).json({ data: message });
});

module.exports = {
  listConversations,
  createConversation,
  listMessages,
  sendMessage,
};
