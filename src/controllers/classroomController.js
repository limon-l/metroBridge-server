const Classroom = require("../models/Classroom");
const Assignment = require("../models/Assignment");
const ClassroomMaterial = require("../models/ClassroomMaterial");
const ClassroomNotice = require("../models/ClassroomNotice");
const Enrollment = require("../models/Enrollment");
const { asyncHandler } = require("../utils/helpers");
const {
  isTeacherRole,
  canAccessClassroom,
} = require("../utils/classroomAccess");

const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateJoinCode(length = 6) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * JOIN_CODE_CHARS.length);
    code += JOIN_CODE_CHARS.charAt(randomIndex);
  }
  return code;
}

function sanitizeClassroomForRole(classroom, role) {
  const data = classroom.toObject ? classroom.toObject() : { ...classroom };
  if (role !== "mentor") {
    delete data.joinCode;
  }
  return data;
}

function ensureClassroomOwnerOrAdmin(classroom, user) {
  const isOwner = classroom.teacher.toString() === user._id.toString();
  const isAdmin = user.role === "admin";
  return isOwner || isAdmin;
}

const createClassroom = asyncHandler(async (req, res) => {
  if (!isTeacherRole(req.user.role) || req.user.role === "student") {
    return res
      .status(403)
      .json({ message: "Only teachers can create classrooms" });
  }

  const payload = {
    name: req.body.name,
    description: req.body.description || "",
    teacher: req.user._id,
  };

  let classroom = null;
  let attempt = 0;

  while (attempt < 5 && !classroom) {
    attempt += 1;
    try {
      classroom = await Classroom.create({
        ...payload,
        joinCode: generateJoinCode(6),
      });
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.joinCode) {
        continue;
      }
      throw error;
    }
  }

  if (!classroom) {
    return res
      .status(500)
      .json({ message: "Failed to generate a unique classroom join code" });
  }

  await classroom.populate("teacher", "fullName email role department");
  return res
    .status(201)
    .json({ data: sanitizeClassroomForRole(classroom, req.user.role) });
});

const listMyClassrooms = asyncHandler(async (req, res) => {
  if (isTeacherRole(req.user.role) && req.user.role !== "student") {
    const classrooms = await Classroom.find({ teacher: req.user._id })
      .populate("teacher", "fullName email role department")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      data: classrooms.map((item) =>
        sanitizeClassroomForRole(item, req.user.role),
      ),
    });
  }

  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate({
      path: "classroom",
      populate: { path: "teacher", select: "fullName email role department" },
    })
    .sort({ joinedAt: -1 });

  const classrooms = enrollments
    .map((enrollment) => enrollment.classroom)
    .filter(Boolean);

  return res.status(200).json({
    data: classrooms.map((item) =>
      sanitizeClassroomForRole(item, req.user.role),
    ),
  });
});

const getClassroomById = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId).populate(
    "teacher",
    "fullName email role department",
  );

  if (!classroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  const canAccess = await canAccessClassroom({ classroom, user: req.user });
  if (!canAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res
    .status(200)
    .json({ data: sanitizeClassroomForRole(classroom, req.user.role) });
});

const joinClassroomByCode = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ message: "Only students can join classrooms" });
  }

  const joinCode = String(req.body.joinCode || "")
    .toUpperCase()
    .trim();
  const classroom = await Classroom.findOne({ joinCode }).populate(
    "teacher",
    "fullName email role department",
  );

  if (!classroom) {
    return res
      .status(404)
      .json({ message: "Classroom not found for this join code" });
  }

  if (classroom.isArchived) {
    return res.status(400).json({ message: "This classroom is archived" });
  }

  try {
    await Enrollment.create({
      classroom: classroom._id,
      student: req.user._id,
    });
  } catch (error) {
    if (!(error?.code === 11000)) {
      throw error;
    }
  }

  return res
    .status(200)
    .json({ data: sanitizeClassroomForRole(classroom, req.user.role) });
});

const listClassroomStudents = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId);
  if (!classroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  const isOwner = classroom.teacher.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const enrollments = await Enrollment.find({ classroom: classroom._id })
    .populate("student", "fullName email role department")
    .sort({ createdAt: -1 });

  const students = enrollments
    .map((enrollment) => enrollment.student)
    .filter(Boolean);

  return res.status(200).json({ data: students });
});

const listClassroomMaterials = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId);
  if (!classroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  const canAccess = await canAccessClassroom({ classroom, user: req.user });
  if (!canAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const materials = await ClassroomMaterial.find({ classroom: classroom._id })
    .populate("uploader", "fullName role department")
    .sort({ createdAt: -1 });

  return res.status(200).json({ data: materials });
});

const createClassroomMaterial = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId);
  if (!classroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  if (!ensureClassroomOwnerOrAdmin(classroom, req.user)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  let fileUrl = String(req.body.fileUrl || "").trim();
  if (req.file) {
    fileUrl = `${req.protocol}://${req.get("host")}/uploads/classroom-materials/${req.file.filename}`;
  }

  if (!fileUrl) {
    return res
      .status(400)
      .json({ message: "Upload a file or provide a valid fileUrl" });
  }

  const material = await ClassroomMaterial.create({
    classroom: classroom._id,
    uploader: req.user._id,
    title: req.body.title,
    description: req.body.description || "",
    fileUrl,
    fileName: req.file?.originalname || undefined,
    fileType: req.file?.mimetype || undefined,
    fileSize: req.file?.size || undefined,
  });

  await material.populate("uploader", "fullName role department");
  return res.status(201).json({ data: material });
});

const deleteClassroomMaterial = asyncHandler(async (req, res) => {
  const material = await ClassroomMaterial.findById(req.params.materialId);
  if (!material) {
    return res.status(404).json({ message: "Material not found" });
  }

  const classroom = await Classroom.findById(material.classroom);
  if (!classroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  if (!ensureClassroomOwnerOrAdmin(classroom, req.user)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await ClassroomMaterial.findByIdAndDelete(req.params.materialId);
  return res.status(200).json({ message: "Material deleted successfully" });
});

const listClassroomNotices = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId);
  if (!classroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  const canAccess = await canAccessClassroom({ classroom, user: req.user });
  if (!canAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const notices = await ClassroomNotice.find({ classroom: classroom._id })
    .populate("author", "fullName role department")
    .sort({ createdAt: -1 });

  return res.status(200).json({ data: notices });
});

const createClassroomNotice = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.classroomId);
  if (!classroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  if (!ensureClassroomOwnerOrAdmin(classroom, req.user)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const notice = await ClassroomNotice.create({
    classroom: classroom._id,
    author: req.user._id,
    title: req.body.title,
    content: req.body.content,
  });

  await notice.populate("author", "fullName role department");
  return res.status(201).json({ data: notice });
});

const cloneClassroom = asyncHandler(async (req, res) => {
  const sourceClassroom = await Classroom.findById(req.params.classroomId);
  if (!sourceClassroom) {
    return res.status(404).json({ message: "Classroom not found" });
  }

  if (!ensureClassroomOwnerOrAdmin(sourceClassroom, req.user)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const clonedClassroom = await Classroom.create({
    name: `${sourceClassroom.name} (Clone)`,
    description: sourceClassroom.description || "",
    teacher: sourceClassroom.teacher,
  });

  const [assignments, materials, notices] = await Promise.all([
    Assignment.find({ classroom: sourceClassroom._id }),
    ClassroomMaterial.find({ classroom: sourceClassroom._id }),
    ClassroomNotice.find({ classroom: sourceClassroom._id }),
  ]);

  if (assignments.length) {
    await Assignment.insertMany(
      assignments.map((item) => ({
        classroom: clonedClassroom._id,
        teacher: item.teacher,
        title: item.title,
        description: item.description,
        dueDate: item.dueDate,
        maxPoints: item.maxPoints,
      })),
    );
  }

  if (materials.length) {
    await ClassroomMaterial.insertMany(
      materials.map((item) => ({
        classroom: clonedClassroom._id,
        uploader: item.uploader,
        title: item.title,
        description: item.description,
        fileUrl: item.fileUrl,
      })),
    );
  }

  if (notices.length) {
    await ClassroomNotice.insertMany(
      notices.map((item) => ({
        classroom: clonedClassroom._id,
        author: item.author,
        title: item.title,
        content: item.content,
      })),
    );
  }

  await clonedClassroom.populate("teacher", "fullName email role department");

  return res.status(201).json({
    data: sanitizeClassroomForRole(clonedClassroom, req.user.role),
  });
});

module.exports = {
  createClassroom,
  listMyClassrooms,
  getClassroomById,
  joinClassroomByCode,
  listClassroomStudents,
  listClassroomMaterials,
  createClassroomMaterial,
  deleteClassroomMaterial,
  listClassroomNotices,
  createClassroomNotice,
  cloneClassroom,
};
