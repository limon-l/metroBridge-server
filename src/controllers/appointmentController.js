const Appointment = require("../models/Appointment");
const { asyncHandler, pickPagination } = require("../utils/helpers");
const { createNotification } = require("../utils/notifications");

const listAppointments = asyncHandler(async (req, res) => {
  const { limit, skip, page } = pickPagination(req.query);

  const filter = {};
  if (req.user.role === "student") {
    filter.student = req.user._id;
  }
  if (req.user.role === "mentor") {
    filter.mentor = req.user._id;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    Appointment.find(filter)
      .populate("mentor", "fullName department")
      .populate("student", "fullName department")
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
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

const createAppointment = asyncHandler(async (req, res) => {
  const { mentorId, topic, scheduledAt, durationMinutes, meetingLink, notes } =
    req.body;

  const appointment = await Appointment.create({
    mentor: mentorId,
    student: req.user._id,
    topic,
    scheduledAt,
    durationMinutes,
    meetingLink,
    notes,
  });

  await appointment.populate("mentor", "fullName department");
  await appointment.populate("student", "fullName department");

  await createNotification({
    recipient: mentorId,
    actor: req.user._id,
    type: "appointment_created",
    title: "New appointment request",
    message: `${req.user.fullName} requested a mentoring session: ${topic}`,
    entityType: "appointment",
    entityId: appointment._id,
  });

  return res.status(201).json({ data: appointment });
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  const isMentor = appointment.mentor.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isMentor && !isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  appointment.status = req.body.status;
  if (typeof req.body.meetingLink === "string") {
    appointment.meetingLink = req.body.meetingLink;
  }
  if (Number.isFinite(Number(req.body.durationMinutes))) {
    appointment.durationMinutes = Number(req.body.durationMinutes);
  }
  if (typeof req.body.notes === "string") {
    appointment.notes = req.body.notes;
  }
  await appointment.save();

  await createNotification({
    recipient: appointment.student,
    actor: req.user._id,
    type: "appointment_status_changed",
    title: "Session status updated",
    message: `Your session has been ${appointment.status}.`,
    entityType: "appointment",
    entityId: appointment._id,
  });

  return res.status(200).json({ data: appointment });
});

module.exports = {
  listAppointments,
  createAppointment,
  updateAppointmentStatus,
};
