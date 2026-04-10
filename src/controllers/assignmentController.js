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

  const assignment = await Assignment.create({
    classroom: classroom._id,
    teacher: req.user._id,
    title: req.body.title,
    description: req.body.description || "",
    dueDate: req.body.dueDate,
    maxPoints: req.body.maxPoints || 100,
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

module.exports = {
  createAssignment,
  listClassroomAssignments,
  getAssignmentById,
};
