const studentService = require("../services/studentService");
const asyncHandler = require("../middleware/asyncHandler");
const Student = require("../models/Student");
const User = require("../models/User");

// ⭐ Öğrenci profilini getir
exports.getStudentProfile = asyncHandler(async (req, res) => {
  const result = await studentService.getStudentProfile(req.params.id, req.user);
  res.json(result);
});

exports.getMyProfile = async (req, res, next) => {
  const userId = req.user._id;

  const student = await Student.findOne({ user: userId })
    .populate("classId", "name")
    .lean();

  if (!student) {
    return res.status(404).json({
      message: "Bu kullanıcıya ait öğrenci profili bulunamadı"
    });
  }

  res.json(student);
};

// ⭐ Devamsızlık ekle
exports.addAttendance = asyncHandler(async (req, res) => {
  const result = await studentService.addAttendance(req.params.id, req.body);
  res.json(result);
});

// ⭐ Deneme özeti
exports.getExamSummary = asyncHandler(async (req, res) => {
  const result = await studentService.getExamSummary(req.params.id);
  res.json(result);
});

// ⭐ Sınıf atama
exports.assignClass = asyncHandler(async (req, res) => {
  const result = await studentService.assignClass(
    req.params.id,
    req.body.classId
  );
  res.json(result);
});

// ⭐ Sınıf sıralaması
exports.getClassRanking = asyncHandler(async (req, res) => {
  const result = await studentService.getClassRanking(req.params.classId);
  res.json(result);
  
});

// ⭐ Tüm öğrenciler (ADMIN)
exports.getAllStudents = asyncHandler(async (req, res) => {
  const students = await studentService.getAllStudents();
  res.json(students);
});

exports.getStudentsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const students = await Student.find({ classId })
    .populate("user", "name email");

  const result = students.map((s) => ({
    _id: s._id,
    name: s.user.name,
    email: s.user.email,
  }));

  res.json(result);
});