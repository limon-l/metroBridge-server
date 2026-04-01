const express = require("express");
const { body, param } = require("express-validator");

const {
  listAppointments,
  createAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { auth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

router.use(auth);

router.get("/", listAppointments);

router.post(
  "/",
  [
    body("mentorId").isMongoId(),
    body("topic").trim().isLength({ min: 2, max: 300 }),
    body("scheduledAt").isISO8601(),
    body("durationMinutes").optional().isInt({ min: 15, max: 240 }),
    body("meetingLink").optional().isURL(),
  ],
  validate,
  createAppointment,
);

router.patch(
  "/:appointmentId/status",
  [
    param("appointmentId").isMongoId(),
    body("status").isIn(["pending", "confirmed", "completed", "cancelled"]),
    body("durationMinutes").optional().isInt({ min: 15, max: 240 }),
    body("meetingLink").optional().isURL(),
  ],
  validate,
  updateAppointmentStatus,
);

module.exports = router;
