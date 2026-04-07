const Comment = require("../models/Comment");
const Post = require("../models/Post");
const { asyncHandler } = require("../utils/helpers");
const {
  createNotification,
  createNotificationsBulk,
} = require("../utils/notifications");
const {
  extractMentionTokens,
  findMentionRecipients,
} = require("../utils/mentions");

const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const comment = await Comment.create({
    post: postId,
    author: req.user._id,
    content,
  });

  post.commentsCount += 1;
  await post.save();

  if (post.author.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: post.author,
      actor: req.user._id,
      type: "post_comment",
      title: "New comment on your post",
      message: `${req.user.fullName} commented: ${content.slice(0, 80)}`,
      entityType: "post",
      entityId: post._id,
    });
  }

  const mentionTokens = extractMentionTokens(content);
  const mentionRecipients = await findMentionRecipients({
    tokens: mentionTokens,
    actorId: req.user._id,
  });

  const postAuthorId = post.author.toString();
  const filteredMentionRecipients = mentionRecipients.filter(
    (recipientId) => recipientId !== postAuthorId,
  );

  if (filteredMentionRecipients.length) {
    await createNotificationsBulk(
      filteredMentionRecipients.map((recipient) => ({
        recipient,
        actor: req.user._id,
        type: "mention",
        title: "You were mentioned in a comment",
        message: `${req.user.fullName} mentioned you in a comment.`,
        entityType: "comment",
        entityId: comment._id,
      })),
    );
  }

  await comment.populate("author", "fullName role");

  return res.status(201).json({ data: comment });
});

const listCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const comments = await Comment.find({ post: postId })
    .populate("author", "fullName role")
    .sort({ createdAt: 1 });

  return res.status(200).json({ data: comments });
});

module.exports = {
  addComment,
  listCommentsByPost,
};
