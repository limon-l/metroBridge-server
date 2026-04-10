const Enrollment = require("../models/Enrollment");

function isTeacherRole(role) {
  return ["mentor", "teacher", "admin"].includes(role);
}

async function isStudentEnrolled({ classroomId, studentId }) {
  const enrollment = await Enrollment.findOne({
    classroom: classroomId,
    student: studentId,
  }).select("_id");

  return Boolean(enrollment);
}

async function canAccessClassroom({ classroom, user }) {
  if (!classroom || !user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (
    isTeacherRole(user.role) &&
    classroom.teacher.toString() === user._id.toString()
  ) {
    return true;
  }

  if (user.role === "student") {
    return isStudentEnrolled({
      classroomId: classroom._id,
      studentId: user._id,
    });
  }

  return false;
}

module.exports = {
  isTeacherRole,
  isStudentEnrolled,
  canAccessClassroom,
};
