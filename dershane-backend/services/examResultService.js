const XLSX = require("xlsx");
const mongoose = require("mongoose");

const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const Student = require("../models/Student");
const User = require("../models/User"); 
const Subject = require("../models/Subject");
const AppError = require("../utils/AppError");

class ExamResultService {

  /**
   * ⭐ Bir öğrencinin bir denemedeki sonucunu kaydeder
   * - İlk sonuç girilince Exam otomatik RESULT_ENTRY olur
   * - FINALIZED denemeye sonuç girilemez
   */
  async addExamResult(data) {
    const { examId, studentId, resultsBySubject } = data;

    if (!examId || !studentId || !resultsBySubject?.length) {
      throw new AppError(
        "examId, studentId ve resultsBySubject zorunludur",
        400
      );
    }

    // 1️⃣ Deneme
    const exam = await Exam.findById(examId);
    if (!exam) throw new AppError("Deneme bulunamadı", 404);

    if (exam.status === "FINALIZED") {
      throw new AppError(
        "Deneme finalize edilmiştir. Sonuç eklenemez.",
        400
      );
    }

    // 2️⃣ Öğrenci
    const student = await Student.findById(studentId);
    if (!student) throw new AppError("Öğrenci bulunamadı", 404);

    // 3️⃣ Duplicate kontrol
    const existing = await ExamResult.findOne({ examId, studentId });
    if (existing) {
      throw new AppError(
        "Bu öğrenci için bu deneme sonucu zaten girilmiş",
        400
      );
    }

    // 4️⃣ İlk girişte status
    if (exam.status === "DRAFT") {
      exam.status = "RESULT_ENTRY";
      await exam.save();
    }

    // ============================
    // 🔑 SUBJECT NORMALIZATION
    // ============================
    const subjectIds = resultsBySubject
      .map((s) => s.subjectId)
      .filter(Boolean)
      .map((id) => String(id));

    if (!subjectIds.length) {
      throw new AppError("subjectId zorunludur", 400);
    }

    const subjects = await Subject.find({
      _id: { $in: subjectIds },
    }).select("name");

    const subjectNameMap = {};
    subjects.forEach((s) => {
      subjectNameMap[String(s._id)] = s.name;
    });

    // ============================
    // 📊 NET HESAPLAMA
    // ============================
    let totalNet = 0;

    const normalizedSubjects = resultsBySubject.map((s) => {
      const correct = Number(s.correct || 0);
      const wrong = Number(s.wrong || 0);
      const blank = Number(s.blank || 0);

      const net = correct - wrong * 0.25;
      totalNet += net;

      const subjectName = subjectNameMap[String(s.subjectId)];
      if (!subjectName) {
        throw new AppError(
          `Ders bulunamadı (subjectId: ${s.subjectId})`,
          400
        );
      }

      return {
        subjectId: s.subjectId,
        subject: subjectName, // ✅ artık ASLA null değil
        correct,
        wrong,
        blank,
        net,
      };
    });

    // 5️⃣ Kaydet
    const examResult = await ExamResult.create({
      examId,
      studentId,
      resultsBySubject: normalizedSubjects,
      totalNet,
    });

    return {
      message: "Deneme sonucu kaydedildi",
      examResultId: examResult._id,
    };
  }

  /**
   * ⭐ Excel ile toplu deneme sonucu yükleme
   */
  async bulkUploadResults(examId, buffer) {
    const exam = await Exam.findById(examId).populate("subjects.subjectId");
    if (!exam) {
      throw new AppError("Deneme bulunamadı", 404);
    }

    if (exam.status === "FINALIZED") {
      throw new AppError("Finalize edilmiş denemeye sonuç yüklenemez", 400);
    }

    // 🔎 Denemenin sınıfı
    const classId = exam.classId;

    // 🔎 Denemedeki dersler (map)
    // { "Matematik": ObjectId, ... }
    const subjectMap = {};
    for (const s of exam.subjects) {
      subjectMap[s.subjectId.name] = s.subjectId._id;
    }

    // 📄 Excel oku
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      throw new AppError("Excel dosyası boş", 400);
    }

    // 🧪 Transaction (tam güvenlik)
    const session = await mongoose.startSession();
    session.startTransaction();

    let createdCount = 0;

    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        if (!row.student_email) {
          throw new AppError(
            `Satır ${i + 2}: student_email zorunludur`,
            400
          );
        }

        // 👤 Öğrenci bul
        const user = await User.findOne({
          email: row.student_email,
          role: "student",
        }).session(session);

        if (!user) {
          throw new AppError(
            `Satır ${i + 2}: Öğrenci bulunamadı (email: ${row.student_email})`,
            400
          );
        }

        const student = await Student.findOne({
          user: user._id,
          classId,
        }).session(session);

        if (!student) {
          throw new AppError(
            `Satır ${i + 2}: Öğrenci bu sınıfa ait değil (${row.student_email})`,
            400
          );
        }

        // 🧠 Ders sonuçlarını topla
        const resultsBySubject = [];

        for (const subjectName of Object.keys(subjectMap)) {
          const correct = Number(row[`${subjectName}_correct`] || 0);
          const wrong = Number(row[`${subjectName}_wrong`] || 0);
          const blank = Number(row[`${subjectName}_blank`] || 0);

          if (correct + wrong + blank === 0) {
            continue; // bu ders girilmemiş olabilir
          }

          resultsBySubject.push({
            subjectId: subjectMap[subjectName],
            correct,
            wrong,
            blank,
          });
        }

        if (!resultsBySubject.length) {
          throw new AppError(
            `Satır ${i + 2}: Hiçbir ders sonucu bulunamadı`,
            400
          );
        }

        // 🔥 Tekil sonuç ekleme (lifecycle dahil)
        await this.addExamResult(
          {
            examId,
            studentId: student._id,
            resultsBySubject,
          },
          session
        );

        createdCount++;
      }

      await session.commitTransaction();
      session.endSession();

      return {
        message: "Deneme sonuçları başarıyla yüklendi",
        createdCount,
      };

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async getResultsByExam(examId) {
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new AppError("Deneme bulunamadı", 404);
  }

  const results = await ExamResult.find({ examId })
    .populate({
      path: "studentId",
      populate: {
        path: "user",
        select: "name email",
      },
    })
    .sort({ totalNet: -1 });

  return results.map((r) => ({
    id: r._id,
    studentId: r.studentId._id,
    studentName: r.studentId.user.name,
    studentEmail: r.studentId.user.email,
    totalNet: r.totalNet,
    subjects: r.resultsBySubject.map((s) => ({
      subjectId: s.subjectId,
      subject: s.subject,
      net: s.net,
      correct: s.correct,
      wrong: s.wrong,
      blank: s.blank,
    })),
    createdAt: r.createdAt,
  }));
}

async deleteExamResult(resultId) {
  const result = await ExamResult.findById(resultId);
  if (!result) {
    throw new AppError("Sonuç bulunamadı", 404);
  }

  const exam = await Exam.findById(result.examId);
  if (!exam) {
    throw new AppError("Deneme bulunamadı", 404);
  }

  if (exam.status === "FINALIZED") {
    throw new AppError(
      "Finalize edilmiş denemede sonuç silinemez",
      400
    );
  }

  await result.deleteOne();

  return { message: "Sonuç silindi" };
}

async addManualResult(data) {
  const { examId, studentId } = data;

  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new AppError("Deneme bulunamadı", 404);
  }

  if (exam.status === "FINALIZED") {
    throw new AppError(
      "Finalize edilmiş denemeye sonuç eklenemez",
      400
    );
  }

  // reuse
  return await this.addExamResult(data);
}


}

module.exports = new ExamResultService();

