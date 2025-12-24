const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const Student = require("../models/Student");
const AppError = require("../utils/AppError");
const { generateAIReportForExam } = require("./aiService");

class ExamService {

  async finalizeExam(examId) {
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new AppError("Deneme bulunamadı", 404);
  }

  if (exam.status === "FINALIZED") {
    throw new AppError("Deneme zaten finalize edilmiş", 400);
  }

  if (exam.status !== "RESULT_ENTRY") {
    throw new AppError(
      "Finalize için deneme RESULT_ENTRY olmalıdır",
      400
    );
  }

  const results = await ExamResult.find({ examId });
  if (!results.length) {
    throw new AppError("Bu deneme için sonuç bulunamadı", 400);
  }

  // -------------------------
  // 📊 CLASS ANALYTICS
  // -------------------------
  const studentCount = results.length;

  const totalNetSum = results.reduce(
    (sum, r) => sum + r.totalNet,
    0
  );
  const classAvgTotalNet = totalNetSum / studentCount;

  const subjectMap = {}; // subjectId -> { sum, count }

  results.forEach((r) => {
    r.resultsBySubject.forEach((s) => {
      const key = String(s.subjectId);
      if (!subjectMap[key]) {
        subjectMap[key] = {
          subjectId: s.subjectId,
          sum: 0,
          count: 0,
        };
      }
      subjectMap[key].sum += s.net;
      subjectMap[key].count += 1;
    });
  });

  const subjectAverages = Object.values(subjectMap).map(
    (s) => ({
      subjectId: s.subjectId,
      avgNet: s.sum / s.count,
    })
  );

  exam.analytics = {
    studentCount,
    classAvgTotalNet,
    subjectAverages,
  };

  exam.status = "FINALIZED";
  await exam.save();

  // -------------------------
  // 🤖 AI REPORTS
  // -------------------------
  let aiOkCount = 0;
  let aiFailedCount = 0;
  const aiFailures = [];

  for (const r of results) {
    try {
      await generateAIReportForExam(
        r.studentId,
        examId
      );
      aiOkCount++;
    } catch (err) {
      aiFailedCount++;
      aiFailures.push({
        studentId: r.studentId,
        error: err.message,
      });
    }
  }

  return {
    message: "Deneme finalize edildi",
    studentCount,
    aiOkCount,
    aiFailedCount,
    aiFailures: aiFailures.slice(0, 10), // UI için yeterli
  };
}


  async getExamById(examId) {
  const exam = await Exam.findById(examId)
    .populate("classId", "name")
    .populate("subjects.subjectId", "name");

  if (!exam) {
    throw new AppError("Deneme bulunamadı", 404);
  }

  return exam;
}

async getExamDetail(examId) {
    const exam = await Exam.findById(examId)
      .populate("classId", "name")
      .populate("subjects.subjectId", "name");

    if (!exam) {
      throw new AppError("Deneme bulunamadı", 404);
    }

    const resultCount = await ExamResult.countDocuments({ examId });

    return {
      ...exam.toObject(),
      resultCount,
    };
  }

  
  
}

module.exports = new ExamService();