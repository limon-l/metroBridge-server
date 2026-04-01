const express = require("express");
const { param } = require("express-validator");

const {
  listMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");
const { auth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.use(auth);

router.get("/", listMyNotifications);

router.patch(
  "/:notificationId/read",
  [param("notificationId").isMongoId()],
  validate,
  markNotificationAsRead,
);

router.patch("/read-all", markAllNotificationsAsRead);

module.exports = router;
