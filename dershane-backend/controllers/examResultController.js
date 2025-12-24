const asyncHandler = require("../middleware/asyncHandler");
const examResultService = require("../services/examResultService");
const Student = require("../models/Student");
const ExamResult = require("../models/ExamResult");

exports.bulkUploadResults = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "Excel dosyası yüklenmelidir" });
  }

  const result = await examResultService.bulkUploadResults(
    examId,
    req.file.buffer
  );

  res.json(result);
});

exports.getResultsByExam = asyncHandler(async (req, res) => {
  const results = await examResultService.getResultsByExam(
    req.params.examId
  );
  res.json(results);
});

exports.deleteExamResult = asyncHandler(async (req, res) => {
  const result = await examResultService.deleteExamResult(
    req.params.id
  );
  res.json(result);
});

exports.addManualResult = asyncHandler(async (req, res) => {
  const result = await examResultService.addManualResult(
    req.body
  );
  res.status(201).json(result);
});


exports.getMyLatestResult = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const student = await Student.findOne({ user: userId });
  if (!student) {
    throw new AppError("Öğrenci bulunamadı", 404);
  }

  const result = await ExamResult.findOne({ studentId: student._id })
    .populate("examId", "title date difficulty")
    .sort({ createdAt: -1 });

  if (!result) {
    throw new AppError("Henüz deneme sonucu yok", 404);
  }

  res.json({
    examId: result.examId._id,
    examTitle: result.examId.title,
    examDate: result.examId.date,
    difficulty: result.examId.difficulty,
    totalNet: result.totalNet,
    subjects: result.resultsBySubject,
  });
});

