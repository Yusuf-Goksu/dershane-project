const asyncHandler = require("../middleware/asyncHandler");
const adminTeacherService = require("../services/adminTeacherService");

exports.getAllTeachers = asyncHandler(async (req, res) => {
  const data = await adminTeacherService.getAllTeachers();
  res.json(data);
});

exports.createTeacher = asyncHandler(async (req, res) => {
  const result = await adminTeacherService.createTeacher(req.body);
  res.status(201).json(result);
});

// DELETE /api/admin/teachers/:teacherId
exports.deleteTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const result = await adminTeacherService.deleteTeacherCascade(teacherId);

  res.json(result);
});