// services/aiService.js
const axios = require('axios');
const AIReport = require('../models/aiReportModel');
const Student = require('../models/Student');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function generateAIReportForExam(studentId, examId, classStats = []) {
  try {
    // 1) Öğrenciyi bul
    const student = await Student.findById(studentId); // <<<<< .lean() KALKTI
    if (!student) {
      console.warn('AI servis: Öğrenci bulunamadı', studentId);
      return null;
    }

    // 2) Exam’ı student.exams içinden bul
    const currentExam = student.exams.id(examId);  // artık ÇALIŞIR
    if (!currentExam) {
      console.warn('AI servis: Exam bulunamadı', examId);
      return null;
    }


    // 2) Sadece kendinden ÖNCEKİ sınavlar
    const previousExams = [...student.exams]
      .filter(ex => 
        ex._id.toString() !== examId.toString() &&
        new Date(ex.date) < new Date(currentExam.date)
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-5);


    console.log("▶ AI Payload previousExams:", previousExams);

    // 5) FastAPI’ya gönderilecek payload
    const payload = {
      studentId: String(studentId),
      examId: String(examId),
      currentExam: {
        date: currentExam.date,
        difficulty: currentExam.difficulty,
        subjects: currentExam.subjects,
        totalNet: currentExam.totalNet,
      },
      previousExams: previousExams.map(ex => ({
        date: ex.date,
        difficulty: ex.difficulty,
        subjects: ex.subjects,
        totalNet: ex.totalNet,
      })),
      classStats,
    };
    

    // 6) FastAPI servisine gönder
    const { data } = await axios.post(
      `${AI_SERVICE_URL}/analyze-exam`,
      payload,
      { timeout: 7000 }
    );

    // 7) DB’ye kaydet / upsert (varsa güncelle)
    const report = await AIReport.findOneAndUpdate(
      { studentId, examId },
      {
        studentId,
        examId,
        analysis: data.analysis,
      },
      { upsert: true, new: true }
    );

    console.log('✅ AI raporu üretildi:', examId.toString());
    return report;

  } catch (err) {
    console.error('❌ AI raporu üretim hatası:', err.message);
    return null;
  }
}

module.exports = {
  generateAIReportForExam,
};
