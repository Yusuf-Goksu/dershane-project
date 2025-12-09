const Student = require('../models/Student');
const AppError = require('../utils/AppError');
const notificationManager = require('./notification/notificationManager');
const { generateAIReportForExam } = require('./aiService');


// ⭐ SINIF ORTALAMASI HESAPLAMA
async function calculateClassStats(student, examData) {
  const className = student.className;
  if (!className) return [];

  const classmates = await Student.find({
    className,
    _id: { $ne: student._id }   // KENDİSİNİ HARİÇ TUT
}).lean();
  if (!classmates.length) return [];

  // Başlıkları normalize edelim
  const normalize = str =>
    String(str).trim().toLowerCase().replace(/\s+/g, " ");

  const targetTitle = normalize(examData.title);

  let subjectTotals = {};
  let subjectCounts = {};

  classmates.forEach(cls => {
    cls.exams.forEach(ex => {
      // ⭐ SADECE başlığa göre eşleşiyoruz
      if (normalize(ex.title) === targetTitle) {
        ex.subjects.forEach(sub => {
          const norm = (sub.correct - sub.wrong / 4) / 40;

          if (!subjectTotals[sub.subjectName]) {
            subjectTotals[sub.subjectName] = 0;
            subjectCounts[sub.subjectName] = 0;
          }

          subjectTotals[sub.subjectName] += norm;
          subjectCounts[sub.subjectName] += 1;
        });
      }
    });
  });

  let results = [];
  Object.keys(subjectTotals).forEach(subject => {
    results.push({
      subjectName: subject,
      classNormalizedScore: subjectTotals[subject] / subjectCounts[subject]
    });
  });

console.log("🎯 calculateClassStats çağrıldı");
console.log("📌 Sınıf:", className);
console.log("📚 Toplam öğrenci:", classmates.length);
console.log("📘 Eşleşen Sınav Başlığı:", examData.title);
console.log("📅 Eşleşen Sınav Tarihi:", examData.date);

return results;
}



class TeacherService {

  // ⭐ SINAV EKLEME
  async addExamResult(studentUserId, examData, currentUser) {
    const { title, date, difficulty, subjects } = examData;

    const student = await Student.findOne({ user: studentUserId }).populate('user', 'name email');
    if (!student) {
      throw new AppError("Öğrenci bulunamadı", 404);
    }

    // 🔹 Öğretmen sadece kendi sınıfındaki öğrenciye işlem yapabilir
    if (currentUser.role === "teacher" && student.className !== currentUser.className) {
      throw new AppError("Bu öğrenci sizin sınıfınızda değil.", 403);
    }

    // 🔹 NET HESABI (correct - wrong / 4)
    let totalNet = 0;

    if (Array.isArray(subjects)) {
      subjects.forEach(sub => {
        const correct = sub.correct || 0;
        const wrong = sub.wrong || 0;

        const net = correct - wrong / 4;
        sub.net = parseFloat(net.toFixed(2));

        totalNet += net;
      });
    }

    totalNet = parseFloat(totalNet.toFixed(2));

    // 🔹 Öğrenciye deneme ekle
    student.exams.push({
      title,
      date: date ? new Date(date) : new Date(),
      difficulty,
      subjects,
      totalNet
    });

        // Yeni eklenen sınavın ID'si:
    const newlyAddedExam = student.exams[student.exams.length - 1];
    const examId = newlyAddedExam._id;  // ⭐ Embedded Exam ID


    await student.save();

    // 🔹 Bildirim gönder
    await notificationManager.sendExamResult(
      student.user._id,
      title,
      totalNet
    );


    const classStats = [];
    // --------------------------------------------------------------------------------------
    // ⭐ AI RAPORU OLUŞTUR (arka planda çalıştır → kullanıcıyı bekletmesin)
    // --------------------------------------------------------------------------------------
    /* ⭐ Sınıf ortalamasını hesapla
    const classStats = await calculateClassStats(student, {
      title,
      date,
      subjects
    });
    */
    // ⭐ AI raporu oluştur (classStats dahil!)
    generateAIReportForExam(student._id, examId, classStats)
      .catch(err => console.error("AI raporu oluşturulamadı:", err.message));
    // Not: student._id = Student tablosundaki öğrenci ID'si
    //       examId      = öğrenci dokümanındaki sınavın ObjectId'si
    // --------------------------------------------------------------------------------------


    return {
      message: "Deneme sonucu eklendi",
      exams: student.exams
    };
  }

  // ⭐ SINAV LİSTELEME
  async getStudentExams(studentUserId, currentUser) {
    const student = await Student.findOne({ user: studentUserId }).populate('user');

    if (!student) {
      throw new AppError("Öğrenci bulunamadı", 404);
    }

    // 🔹 Öğretmen yalnızca kendi sınıfındaki öğrenciyi görebilir
    if (currentUser.role === "teacher" && student.className !== currentUser.className) {
      throw new AppError("Bu öğrenci sizin sınıfınızda değil.", 403);
    }

    return { exams: student.exams };
  }

  // ⭐ SINIF SIRALAMASI
  async getClassRanking(className, currentUser) {
    // 🔹 Öğretmen kendi sınıfı dışındaki sıralamayı göremez
    if (currentUser.role === "teacher" && currentUser.className !== className) {
      throw new AppError("Bu sınıf sizin sorumluluğunuzda değil.", 403);
    }

    const students = await Student.find({ className }).populate('user', 'name email');

    if (!students.length) {
      throw new AppError("Bu sınıfta öğrenci yok.", 404);
    }

    const results = students.map(s => {
      const lastExam = s.exams?.length ? s.exams[s.exams.length - 1] : null;

      return {
        studentId: s.user._id,
        name: s.user.name,
        className: s.className,
        totalNet: lastExam?.totalNet ?? 0,
      };
    });

    // Net’e göre sıralama
    results.sort((a, b) => b.totalNet - a.totalNet);

    // Rank numarası ekleme
    results.forEach((r, i) => (r.rankInClass = i + 1));

    return results;
  }

}

module.exports = new TeacherService();
