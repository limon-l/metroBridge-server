const Post = require("../models/Post");
const { asyncHandler, pickPagination } = require("../utils/helpers");
const { createNotification } = require("../utils/notifications");

const listPosts = asyncHandler(async (req, res) => {
  const { limit, skip, page } = pickPagination(req.query);

  const [items, total] = await Promise.all([
    Post.find()
      .populate("author", "fullName role department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(),
  ]);

  return res.status(200).json({
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

const createPost = asyncHandler(async (req, res) => {
  const { content, mediaUrl } = req.body;

  const post = await Post.create({
    author: req.user._id,
    content,
    mediaUrl,
  });

  await post.populate("author", "fullName role department");

  return res.status(201).json({ data: post });
});

const reactToPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { type } = req.body;

  const post = await Post.findById(postId);
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

  return res.status(200).json({
    data: {
      postId: post._id,
      reactionCounts: post.reactionCounts,
      userReaction: type,
    },
  });
});

const removeReaction = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
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

  return res.status(200).json({
    data: {
      postId: post._id,
      reactionCounts: post.reactionCounts,
      userReaction: null,
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
  deletePost,
};
