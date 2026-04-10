const Assignment = require("../models/Assignment");
const Classroom = require("../models/Classroom");
const Submission = require("../models/Submission");
const { asyncHandler } = require("../utils/helpers");
const { isStudentEnrolled } = require("../utils/classroomAccess");

const listMyClassroomSubmissions = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ message: "Only students can view this resource" });
  }

  const classroom = await Classroom.findById(req.params.classroomId).select(
    "_id",
  );
  if (!classroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  const enrolled = await isStudentEnrolled({
    classroomId: classroom._id,
    studentId: req.user._id,
  });

  if (!enrolled) {
    return res
      .status(403)
      .json({ message: "You are not enrolled in this classroom" });
  }

  const submissions = await Submission.find({
    classroom: classroom._id,
    student: req.user._id,
  })
    .populate("assignment", "title dueDate maxPoints")
    .sort({ updatedAt: -1 });

  return res.status(200).json({ data: submissions });
});

const upsertMySubmission = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ message: "Only students can submit assignments" });
  }

  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  const enrolled = await isStudentEnrolled({
    classroomId: assignment.classroom,
    studentId: req.user._id,
  });

  if (!enrolled) {
    return res
      .status(403)
      .json({ message: "You are not enrolled in this classroom" });
  }

  const textSubmission = String(req.body.textSubmission || "").trim();
  const fileUrl = String(req.body.fileUrl || "").trim();
  let submissionFileUrl = fileUrl;
  let fileName = null;
  let fileType = null;
  let fileSize = null;

  // Handle file upload
  if (req.file) {
    const protocol = req.protocol;
    const host = req.get("host");
    const filePath = req.file.filename;
    submissionFileUrl = `${protocol}://${host}/uploads/submissions/${filePath}`;
    fileName = req.file.originalname;
    fileType = req.file.mimetype;
    fileSize = req.file.size;
  }

  if (!textSubmission && !submissionFileUrl) {
    return res.status(400).json({
      message: "Either textSubmission or a file upload is required",
    });
  }

  const existingSubmission = await Submission.findOne({
    assignment: assignment._id,
    student: req.user._id,
  });

  if (existingSubmission) {
    return res.status(409).json({
      message: "You have already submitted this assignment",
      data: existingSubmission,
    });
  }

  const submission = await Submission.create({
    assignment: assignment._id,
    classroom: assignment.classroom,
    student: req.user._id,
    textSubmission,
    fileUrl: submissionFileUrl,
    fileName,
    fileType,
    fileSize,
    submittedAt: new Date(),
    status: "submitted",
  });

  await submission
    .populate("student", "fullName email role department")
    .populate("assignment", "title dueDate maxPoints");

  return res.status(201).json({ data: submission });
});

const getMySubmission = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ message: "Only students can view this resource" });
  }

  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  const enrolled = await isStudentEnrolled({
    classroomId: assignment.classroom,
    studentId: req.user._id,
  });

  if (!enrolled) {
    return res
      .status(403)
      .json({ message: "You are not enrolled in this classroom" });
  }

  const submission = await Submission.findOne({
    assignment: assignment._id,
    student: req.user._id,
  });

  return res.status(200).json({ data: submission });
});

const withdrawMySubmission = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ message: "Only students can withdraw submission" });
  }

  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  const enrolled = await isStudentEnrolled({
    classroomId: assignment.classroom,
    studentId: req.user._id,
  });

  if (!enrolled) {
    return res
      .status(403)
      .json({ message: "You are not enrolled in this classroom" });
  }

  if (new Date() > new Date(assignment.dueDate)) {
    return res
      .status(400)
      .json({ message: "Deadline passed. You cannot withdraw now." });
  }

  const submission = await Submission.findOne({
    assignment: assignment._id,
    student: req.user._id,
  });

  if (!submission) {
    return res.status(404).json({ message: "Submission not found" });
  }

  await submission.deleteOne();

  return res.status(200).json({
    message: "Submission withdrawn successfully",
    data: { assignmentId: assignment._id.toString() },
  });
});

const listAssignmentSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  const isOwner = assignment.teacher.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const submissions = await Submission.find({ assignment: assignment._id })
    .populate("student", "fullName email role department")
    .sort({ submittedAt: -1 });

  return res.status(200).json({ data: submissions });
});

const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId)
    .populate("assignment")
    .populate("student", "fullName email role department")
    .populate("gradedBy", "fullName email role");

  if (!submission) {
    return res.status(404).json({ message: "Submission not found" });
  }

  const isOwner =
    submission.assignment.teacher.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  submission.grade = Number(req.body.grade);
  submission.feedback = req.body.feedback || "";
  submission.status = "graded";
  submission.gradedBy = req.user._id;
  submission.gradedAt = new Date();

  await submission.save();

  await submission.populate("gradedBy", "fullName email role");

  return res.status(200).json({ data: submission });
});

module.exports = {
  listMyClassroomSubmissions,
  upsertMySubmission,
  getMySubmission,
  withdrawMySubmission,
  listAssignmentSubmissions,
  gradeSubmission,
};
