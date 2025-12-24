const axios = require("axios");
const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const Student = require("../models/Student");
const AIReport = require("../models/aiReportModel");
const AppError = require('../utils/AppError');

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://localhost:8000";

// 🔧 Zorluk katsayıları
const DIFFICULTY_COEFFICIENTS = {
  easy: 0.9,
  medium: 1.0,
  hard: 1.1,
};

async function generateAIReportForExam(studentId, examId) {
  // 1️⃣ Exam & Result
  const exam = await Exam.findById(examId).lean();
  const examResult = await ExamResult.findOne({
    studentId,
    examId,
  }).lean();

  if (!exam || !examResult) return null;

  // 2️⃣ Öğrenci
  const student = await Student.findById(studentId)
    .populate("classId")
    .lean();

  if (!student) return null;

  // 3️⃣ Önceki denemeler (max 5)
  const previousResults = await ExamResult.find({
    studentId,
    createdAt: { $lt: examResult.createdAt },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("examId", "date difficulty")
    .lean();

  // 4️⃣ Aynı denemenin sınıf sonuçları
  const classResults = await ExamResult.find({
    examId,
  }).lean();

  const studentCount = classResults.length;

  // 🔹 Sıralama
  const sorted = [...classResults].sort(
    (a, b) => b.totalNet - a.totalNet
  );

  const rank =
    sorted.findIndex(
      r => String(r.studentId) === String(studentId)
    ) + 1;

  const percentile =
    studentCount > 0
      ? Math.round(
          ((studentCount - rank) / studentCount) * 100
        )
      : 0;

  // 🔹 Sınıf ortalama totalNet
  const classAvgTotalNet =
    studentCount > 0
      ? classResults.reduce(
          (sum, r) => sum + r.totalNet,
          0
        ) / studentCount
      : 0;

  // 5️⃣ Ders bazlı sınıf ortalamaları (ID bazlı)
  const subjectMap = {}; // subjectId -> { sum, count }

  classResults.forEach(r => {
    r.resultsBySubject.forEach(s => {
      if (!s.subjectId) return;

      const key = String(s.subjectId);
      if (!subjectMap[key]) {
        subjectMap[key] = { sum: 0, count: 0 };
      }
      subjectMap[key].sum += s.net;
      subjectMap[key].count += 1;
    });
  });

  const classAvgMap = {};
  Object.keys(subjectMap).forEach(key => {
    classAvgMap[key] =
      subjectMap[key].sum / subjectMap[key].count;
  });

  // 6️⃣ Öğrenci – sınıf ders karşılaştırması (KRİTİK KISIM)
  const subjectComparisons =
    examResult.resultsBySubject.map(s => {
      const classAvg =
        classAvgMap[String(s.subjectId)] || 0;

      return {
        subjectId: s.subjectId,
        subject: s.subject || "Bilinmeyen Ders",
        studentNet: s.net,
        classAvgNet: classAvg,
        delta: Number((s.net - classAvg).toFixed(2)),
      };
    });

  // 7️⃣ AI payload
  const payload = {
    studentId: String(studentId),
    examId: String(examId),

    currentExam: {
      date: exam.date,
      difficulty: exam.difficulty,
      totalNet: examResult.totalNet,
      subjects: examResult.resultsBySubject.map(s => ({
        subjectId: s.subjectId,
        subject: s.subject,
        net: s.net,
      })),
    },

    previousExams: previousResults.map(r => ({
      date: r.examId?.date,
      difficulty: r.examId?.difficulty,
      totalNet: r.totalNet,
    })),

    difficultyConfig: DIFFICULTY_COEFFICIENTS,

    classContext: {
      classAvgTotalNet,
      studentRank: rank,
      studentCount,
      percentile,
      subjects: subjectComparisons,
    },
  };

  // 8️⃣ FastAPI çağrısı
  const { data } = await axios.post(
    `${AI_SERVICE_URL}/analyze-exam`,
    payload,
    { timeout: 10000 }
  );

  // 9️⃣ AIReport kaydet
  const report = await AIReport.findOneAndUpdate(
    { studentId, examId },
    {
      studentId,
      examId,
      classId: student.classId,
      summary: data.summary,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      recommendations: data.recommendations,
      metrics: data.metrics,
    },
    { upsert: true, new: true }
  );

  return report;
}

async function getReportByExamAndStudent(examId, studentId) {
  const report = await AIReport.findOne({
    examId,
    studentId,
  }).sort({ createdAt: -1 });

  if (!report) {
    throw new AppError(
      "Bu deneme için AI raporu bulunamadı",
      404
    );
  }

  return report;
}


module.exports = {
  generateAIReportForExam,
  getReportByExamAndStudent,
};
