const Appointment = require("../models/Appointment");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Document = require("../models/Document");
const User = require("../models/User");
const { asyncHandler } = require("../utils/helpers");

const getOverviewStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const [
    totalUsers,
    totalMentors,
    totalPosts,
    totalComments,
    totalMessages,
    totalDocuments,
    upcomingSessions,
    pendingSessions,
    confirmedSessions,
    totalConversations,
    pendingApprovals,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: "mentor", isActive: true }),
    Post.countDocuments(),
    Comment.countDocuments(),
    Message.countDocuments(),
    Document.countDocuments(),
    Appointment.countDocuments({ scheduledAt: { $gte: now } }),
    Appointment.countDocuments({
      status: "pending",
      scheduledAt: { $gte: now },
    }),
    Appointment.countDocuments({
      status: "confirmed",
      scheduledAt: { $gte: now },
    }),
    Conversation.countDocuments(),
    User.countDocuments({
      approvalStatus: "pending",
      role: { $in: ["student", "mentor"] },
    }),
  ]);

  return res.status(200).json({
    data: {
      users: totalUsers,
      mentors: totalMentors,
      posts: totalPosts,
      comments: totalComments,
      messages: totalMessages,
      documents: totalDocuments,
      conversations: totalConversations,
      sessions: {
        upcoming: upcomingSessions,
        pending: pendingSessions,
        confirmed: confirmedSessions,
      },
      approvals: {
        pending: pendingApprovals,
      },
    },
  });
});

module.exports = {
  getOverviewStats,
};
