const asyncHandler = require("../middleware/asyncHandler");
const adminStudentService = require("../services/adminStudentService");

// ⭐ Tüm öğrencileri getir
exports.getAllStudents = asyncHandler(async (req, res) => {
  const students = await adminStudentService.getAllStudents();
  res.json(students);
});

// ⭐ Tekli öğrenci ekle
exports.createStudent = asyncHandler(async (req, res) => {
  const result = await adminStudentService.createStudent(req.body);
  res.status(201).json(result);
});

// ⭐ Öğrenci sil
exports.deleteStudent = asyncHandler(async (req, res) => {
  const result = await adminStudentService.deleteStudent(
    req.params.studentId
  );
  res.json(result);
});
