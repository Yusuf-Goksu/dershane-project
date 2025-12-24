const Student = require("../models/Student");
const Parent = require("../models/Parent");
const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const Class = require("../models/Class");
const AppError = require("../utils/AppError");
const notificationManager = require("./notification/notificationManager");

class StudentService {

  // ⭐ Öğrenci profilini getir (studentId ile)
  async getStudentProfile(studentId) {
    const student = await Student.findById(studentId)
      .populate("user", "name email")
      .populate("classId", "name gradeLevel year")
      .populate("parentIds");

    if (!student) {
      throw new AppError("Öğrenci bulunamadı", 404);
    }

    return student;
  }

  // ⭐ Devamsızlık ekle
  async addAttendance(studentId, data) {
    const { date, present } = data;

    const student = await Student.findById(studentId).populate("user", "name");
    if (!student) {
      throw new AppError("Öğrenci bulunamadı", 404);
    }

    const attendanceDate = date ? new Date(date) : new Date();

    student.attendance.push({
      date: attendanceDate,
      present: present !== undefined ? present : true,
    });

    await student.save();

    // ❗ GELMEMİŞSE → VELİYE BİLDİRİM
    if (present === false) {
      const parents = await Parent.find({ students: student._id }).populate(
        "user",
        "name"
      );

      const studentName = student.user.name;
      const formattedDate = attendanceDate.toLocaleDateString("tr-TR");

      for (const parent of parents) {
        await notificationManager.sendAttendanceWarning(
          parent.user._id,
          studentName,
          formattedDate
        );
      }
    }

    return { message: "Devamsızlık kaydedildi" };
  }

  // ⭐ Öğrencinin deneme özeti (ExamResult üzerinden)
  async getExamSummary(studentId) {
    const results = await ExamResult.find({ studentId })
      .sort({ createdAt: -1 })
      .populate("examId", "name date difficulty")
      .lean();

    const totalExams = results.length;

    const avgNet =
      totalExams > 0
        ? (
            results.reduce((sum, r) => sum + (r.totalNet || 0), 0) / totalExams
          ).toFixed(2)
        : "0.00";

    const recentExams = results.slice(0, 5).map(r => ({
      examId: r.examId?._id,
      name: r.examId?.name,
      date: r.examId?.date,
      difficulty: r.examId?.difficulty,
      totalNet: r.totalNet,
    }));

    return {
      studentId,
      totalExams,
      avgNet,
      recentExams,
    };
  }

  // ⭐ Öğrenciye sınıf atama
  async assignClass(studentId, classId) {
    if (!classId) {
      throw new AppError("classId zorunludur", 400);
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new AppError("Sınıf bulunamadı", 404);
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError("Öğrenci bulunamadı", 404);
    }

    student.classId = classId;
    await student.save();

    return { message: "Sınıf atandı" };
  }

  // ⭐ Sınıf sıralaması (son denemeye göre)
  async getClassRanking(classId) {
    const lastExam = await Exam.findOne({ classId })
      .sort({ date: -1 })
      .lean();

    if (!lastExam) {
      throw new AppError("Bu sınıf için henüz deneme yok", 404);
    }

    const results = await ExamResult.find({ examId: lastExam._id })
      .sort({ totalNet: -1 })
      .populate({
        path: "studentId",
        populate: { path: "user", select: "name" },
      })
      .lean();

    return {
      exam: {
        id: lastExam._id,
        name: lastExam.name,
        date: lastExam.date,
      },
      ranking: results.map((r, i) => ({
        rank: i + 1,
        studentId: r.studentId._id,
        studentName: r.studentId.user?.name,
        totalNet: r.totalNet,
      })),
    };
  }

  // ⭐ Tüm öğrencileri getir (ADMIN)
  async getAllStudents() {
    return await Student.find()
      .populate("user", "name email")
      .populate("classId", "name gradeLevel")
      .lean();
  }

}

module.exports = new StudentService();
