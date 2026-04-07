const Post = require("../models/Post");
const { asyncHandler, pickPagination } = require("../utils/helpers");
const {
  createNotification,
  createNotificationsBulk,
} = require("../utils/notifications");
const {
  extractMentionTokens,
  findMentionRecipients,
} = require("../utils/mentions");

const listPosts = asyncHandler(async (req, res) => {
  const { limit, skip, page } = pickPagination(req.query);

  const [items, total] = await Promise.all([
    Post.find()
      .populate("author", "fullName role department")
      .populate({
        path: "sharedPostId",
        populate: { path: "author", select: "fullName role department" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(),
  ]);

  // Add userReaction for authenticated users
  const userId = req.user?._id?.toString();
  const itemsWithUserReaction = items.map((post) => {
    const postObj = post.toObject();
    if (userId) {
      const userReaction = postObj.reactions.find(
        (r) => r.user.toString() === userId,
      );
      postObj.userReaction = userReaction?.type || null;
    } else {
      postObj.userReaction = null;
    }
    return postObj;
  });

  return res.status(200).json({
    data: itemsWithUserReaction,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

const createPost = asyncHandler(async (req, res) => {
  const {
    content = "",
    mediaUrl = "",
    mediaName = "",
    mediaType = "",
    sharedPostId = null,
  } = req.body;

  if (!content.trim() && !mediaUrl && !sharedPostId) {
    return res
      .status(400)
      .json({ message: "Post content, photo, or shared post is required." });
  }

  if (sharedPostId) {
    const sharedPost = await Post.findById(sharedPostId);
    if (!sharedPost) {
      return res.status(404).json({ message: "Shared post not found" });
    }
  }

  const post = await Post.create({
    author: req.user._id,
    content: content.trim() || (mediaUrl ? "Photo post" : ""),
    mediaUrl,
    mediaName,
    mediaType,
    sharedPostId: sharedPostId || null,
  });

  const populatedPost = await Post.findById(post._id)
    .populate("author", "fullName role department")
    .populate({
      path: "sharedPostId",
      populate: { path: "author", select: "fullName role department" },
    });

  const mentionTokens = extractMentionTokens(content);
  const mentionRecipients = await findMentionRecipients({
    tokens: mentionTokens,
    actorId: req.user._id,
  });

  if (mentionRecipients.length) {
    await createNotificationsBulk(
      mentionRecipients.map((recipient) => ({
        recipient,
        actor: req.user._id,
        type: "mention",
        title: "You were mentioned in a post",
        message: `${req.user.fullName} mentioned you in a community post.`,
        entityType: "post",
        entityId: post._id,
      })),
    );
  }

  if (sharedPostId) {
    await createNotification({
      recipient: populatedPost.sharedPostId.author,
      actor: req.user._id,
      type: "post_reaction",
      title: "Your post was shared",
      message: `${req.user.fullName} shared your post`,
      entityType: "post",
      entityId: populatedPost.sharedPostId._id,
    });
  }

  return res.status(201).json({ data: populatedPost });
});

const reactToPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { type } = req.body;

  const post = await Post.findById(postId)
    .populate("author", "fullName role department")
    .populate({
      path: "sharedPostId",
      populate: { path: "author", select: "fullName role department" },
    });

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const userId = req.user._id.toString();
  const existingReaction = post.reactions.find(
    (reaction) => reaction.user.toString() === userId,
  );

  if (existingReaction) {
    post.reactionCounts[existingReaction.type] = Math.max(
      0,
      (post.reactionCounts[existingReaction.type] || 0) - 1,
    );
    existingReaction.type = type;
  } else {
    post.reactions.push({ user: req.user._id, type });
  }

  post.reactionCounts[type] = (post.reactionCounts[type] || 0) + 1;
  await post.save();

  if (post.author.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: post.author,
      actor: req.user._id,
      type: "post_reaction",
      title: "New reaction on your post",
      message: `${req.user.fullName} reacted with ${type}`,
      entityType: "post",
      entityId: post._id,
    });
  }

  // Return full post data with userReaction
  const postObj = post.toObject();
  postObj.userReaction = type;

  return res.status(200).json({ data: postObj });
});

const removeReaction = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId)
    .populate("author", "fullName role department")
    .populate({
      path: "sharedPostId",
      populate: { path: "author", select: "fullName role department" },
    });

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const userId = req.user._id.toString();
  const index = post.reactions.findIndex(
    (reaction) => reaction.user.toString() === userId,
  );

  if (index !== -1) {
    const reactionType = post.reactions[index].type;
    post.reactionCounts[reactionType] = Math.max(
      0,
      (post.reactionCounts[reactionType] || 0) - 1,
    );
    post.reactions.splice(index, 1);
    await post.save();
  }

  // Return full post data with userReaction set to null
  const postObj = post.toObject();
  postObj.userReaction = null;

  return res.status(200).json({ data: postObj });
});

const listPostReactions = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId).populate(
    "reactions.user",
    "fullName role department",
  );

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const items = post.reactions
    .filter((reaction) => reaction.user)
    .map((reaction) => ({
      type: reaction.type,
      user: {
        id: reaction.user._id,
        fullName: reaction.user.fullName,
        role: reaction.user.role,
        department: reaction.user.department || "",
      },
    }));

  return res.status(200).json({
    data: {
      postId: post._id,
      counts: post.reactionCounts,
      total: items.length,
      items,
    },
  });
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const isOwner = post.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await post.deleteOne();
  return res.status(200).json({ message: "Post deleted" });
});

module.exports = {
  listPosts,
  createPost,
  reactToPost,
  removeReaction,
  listPostReactions,
  deletePost,
};
