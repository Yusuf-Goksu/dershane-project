// controllers/aiController.js
const AIReport = require('../models/aiReportModel');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const Student = require('../models/Student');
const { generateAIReportForExam } = require('../services/aiService');

// ------------------------------
// Öğrencinin kendi raporları
// ------------------------------
exports.getMyReports = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Öğrencinin Student kaydını bul
  const student = await Student.findOne({ user: userId }).lean();
  if (!student) {
    return next(new AppError('Öğrenci kaydı bulunamadı', 404));
  }

  const limit = Number(req.query.limit || 10);

  const reports = await AIReport.find({ studentId: student._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  
  res.json(reports);
});

// ------------------------------
// Öğrenci kendi sınavının raporunu isterse
// ------------------------------
exports.getMyReportForExam = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { examId } = req.params;

  const student = await Student.findOne({ user: userId });
  if (!student) {
    return next(new AppError('Öğrenci bulunamadı', 404));
  }

  const report = await AIReport.findOne({
    studentId: student._id,
    examId
  }).lean();

  if (!report) {
    return next(new AppError('Bu sınava ait AI raporu bulunamadı', 404));
  }

  res.json(report);
});

// ------------------------------
// Admin / Veli: Öğrenci ID ile rapor çekme
// ------------------------------
exports.getReportsByStudentId = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  const limit = Number(req.query.limit || 10);

  const reports = await AIReport.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean(); // populate KALKTI

  res.json(reports);
});


exports.recalcAllReportsForStudent = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  // 1) Öğrenciyi bul
  const student = await Student.findById(studentId).lean();
  if (!student) {
    return next(new AppError("Öğrenci bulunamadı", 404));
  }

  if (!student.exams || student.exams.length === 0) {
    return next(new AppError("Öğrencinin sınav kaydı yok.", 400));
  }

  const results = [];

  // 2) Tüm sınavları tarih sırasına göre sırala
  const sortedExams = [...student.exams].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // 3) Her sınav için AI raporunu yeniden hesapla
  for (const exam of sortedExams) {
    const report = await generateAIReportForExam(student._id, exam._id);
    results.push({
      examId: exam._id,
      updated: !!report
    });
  }

  res.json({
    message: "AI raporları başarıyla yeniden hesaplandı.",
    results
  });
});