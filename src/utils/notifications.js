const Notification = require("../models/Notification");
const { getSocketServer } = require("../realtime/socket");

const buildNotificationPayload = (notification) => ({
  id: notification._id.toString(),
  recipient: notification.recipient?.toString?.() || notification.recipient,
  actor: notification.actor
    ? {
        id:
          notification.actor._id?.toString?.() || notification.actor.toString(),
        fullName: notification.actor.fullName || "Unknown",
        role: notification.actor.role || "student",
      }
    : null,
  type: notification.type,
  title: notification.title,
  message: notification.message || "",
  entityType: notification.entityType || null,
  entityId: notification.entityId?.toString?.() || null,
  isRead: Boolean(notification.isRead),
  readAt: notification.readAt || null,
  createdAt: notification.createdAt,
});

const emitNotification = (notification) => {
  const io = getSocketServer();
  if (!io || !notification?.recipient) return;

  const payload = buildNotificationPayload(notification);
  io.to(`user:${payload.recipient}`).emit("notification:new", payload);
};

const createNotification = async ({
  recipient,
  actor,
  type,
  title,
  message,
  entityType,
  entityId,
}) => {
  if (!recipient) return null;

  const notification = await Notification.create({
    recipient,
    actor,
    type,
    title,
    message,
    entityType,
    entityId,
  });

  await notification.populate("actor", "fullName role");
  emitNotification(notification);

  return notification;
};

const createNotificationsBulk = async (items = []) => {
  const safeItems = items.filter((item) => item && item.recipient);
  if (!safeItems.length) return [];

  const notifications = await Notification.insertMany(safeItems);
  await Notification.populate(notifications, {
    path: "actor",
    select: "fullName role",
  });

  notifications.forEach(emitNotification);
  return notifications;
};

module.exports = {
  createNotification,
  createNotificationsBulk,
};
