const Assignment = require("../models/Assignment");
const Classroom = require("../models/Classroom");
const { asyncHandler } = require("../utils/helpers");
const { canAccessClassroom } = require("../utils/classroomAccess");

const createAssignment = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId);
  if (!classroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  const isOwner = classroom.teacher.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  let attachmentUrl = null;
  let attachmentName = null;
  let attachmentType = null;
  let attachmentSize = null;

  if (req.file) {
    attachmentUrl = `${req.protocol}://${req.get("host")}/uploads/classroom-materials/${req.file.filename}`;
    attachmentName = req.file.originalname;
    attachmentType = req.file.mimetype;
    attachmentSize = req.file.size;
  }

  const assignment = await Assignment.create({
    classroom: classroom._id,
    teacher: req.user._id,
    title: req.body.title,
    description: req.body.description || "",
    dueDate: req.body.dueDate,
    maxPoints: req.body.maxPoints || 100,
    attachmentUrl,
    attachmentName,
    attachmentType,
    attachmentSize,
  });

  await assignment.populate("teacher", "fullName email role department");

  return res.status(201).json({ data: assignment });
});

const listClassroomAssignments = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId);
  if (!classroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  const canAccess = await canAccessClassroom({ classroom, user: req.user });
  if (!canAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const assignments = await Assignment.find({ classroom: classroom._id })
    .populate("teacher", "fullName email role department")
    .sort({ dueDate: 1, createdAt: -1 });

  return res.status(200).json({ data: assignments });
});

const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId)
    .populate("teacher", "fullName email role department")
    .populate("classroom", "name description teacher joinCode");

  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  const canAccess = await canAccessClassroom({
    classroom: assignment.classroom,
    user: req.user,
  });

  if (!canAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.status(200).json({ data: assignment });
});

const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  const classroom = await Classroom.findById(assignment.classroom);
  const isOwner = classroom.teacher.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.body.title !== undefined) {
    assignment.title = req.body.title.trim();
  }
  if (req.body.description !== undefined) {
    assignment.description = req.body.description.trim();
  }
  if (req.body.dueDate !== undefined) {
    assignment.dueDate = req.body.dueDate;
  }
  if (req.body.maxPoints !== undefined) {
    assignment.maxPoints = req.body.maxPoints;
  }

  if (req.file) {
    assignment.attachmentUrl = `${req.protocol}://${req.get("host")}/uploads/classroom-materials/${req.file.filename}`;
    assignment.attachmentName = req.file.originalname;
    assignment.attachmentType = req.file.mimetype;
    assignment.attachmentSize = req.file.size;
  }

  await assignment.save();
  await assignment.populate("teacher", "fullName email role department");

  return res.status(200).json({ data: assignment });
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  const classroom = await Classroom.findById(assignment.classroom);
  const isOwner = classroom.teacher.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  await Assignment.findByIdAndDelete(req.params.assignmentId);
  return res.status(200).json({ message: "Assignment deleted successfully" });
});

module.exports = {
  createAssignment,
  listClassroomAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};
