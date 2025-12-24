// controllers/aiController.js
const AIReport = require('../models/aiReportModel');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const Student = require('../models/Student');
const { generateAIReportForExam } = require('../services/aiService');
const aiService = require("../services/aiService");

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

  // 1️⃣ Öğrenci var mı?
  const student = await Student.findById(studentId).lean();
  if (!student) {
    return next(new AppError("Öğrenci bulunamadı", 404));
  }

  // 2️⃣ Öğrencinin tüm deneme sonuçlarını al
  const examResults = await ExamResult.find({ studentId })
    .select("examId")
    .sort({ createdAt: 1 }) // kronolojik sırayla
    .lean();

  if (!examResults.length) {
    return next(
      new AppError("Öğrencinin henüz deneme sonucu yok.", 400)
    );
  }

  const results = [];

  // 3️⃣ Her deneme için AI raporunu yeniden hesapla
  for (const result of examResults) {
    try {
      const report = await generateAIReportForExam(
        studentId,
        result.examId
      );

      results.push({
        examId: result.examId,
        recalculated: !!report,
      });
    } catch (err) {
      console.error(
        `AI raporu oluşturulamadı (examId=${result.examId}):`,
        err.message
      );

      results.push({
        examId: result.examId,
        recalculated: false,
        error: err.message,
      });
    }
  }

  res.json({
    message: "AI raporları yeniden hesaplandı.",
    totalExams: examResults.length,
    results,
  });
});

// ⭐ Öğrencinin SON denemesinin AI raporu
exports.getMyLatestReport = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // 1️⃣ Bu user bir öğrenci mi?
  const student = await Student.findOne({ user: userId }).lean();
  if (!student) {
    return next(
      new AppError("Bu kullanıcıya ait öğrenci kaydı bulunamadı", 404)
    );
  }

  // 2️⃣ En son AI raporu
  const report = await AIReport.findOne({
    studentId: student._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!report) {
    return next(
      new AppError("Henüz oluşturulmuş bir AI raporu yok", 404)
    );
  }

  res.json(report);
});

exports.getReportByExamAndStudent = asyncHandler(async (req, res) => {
  const { examId, studentId } = req.params;

  const report = await aiService.getReportByExamAndStudent(
    examId,
    studentId
  );

  if (!report) {
    return res.status(404).json({
      message: "Bu deneme için AI raporu bulunamadı",
    });
  }

  res.json(report);
});