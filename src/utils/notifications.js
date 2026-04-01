const Notification = require("../models/Notification");

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

  return Notification.create({
    recipient,
    actor,
    type,
    title,
    message,
    entityType,
    entityId,
  });
};

const createNotificationsBulk = async (items = []) => {
  const safeItems = items.filter((item) => item && item.recipient);
  if (!safeItems.length) return [];
  return Notification.insertMany(safeItems);
};

module.exports = {
  createNotification,
  createNotificationsBulk,
};
