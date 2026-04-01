const Notification = require("../models/Notification");
const { asyncHandler, pickPagination } = require("../utils/helpers");

const listMyNotifications = asyncHandler(async (req, res) => {
  const { limit, skip, page } = pickPagination(req.query);

  const filter = { recipient: req.user._id };
  if (req.query.unread === "true") {
    filter.isRead = false;
  }

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate("actor", "fullName role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  return res.status(200).json({
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount,
    },
  });
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.notificationId,
    recipient: req.user._id,
  });

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return res.status(200).json({ data: notification });
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() },
  );

  return res.status(200).json({ message: "All notifications marked as read" });
});

module.exports = {
  listMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
