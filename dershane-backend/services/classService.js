const Class = require("../models/Class");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const TopicCoverage = require("../models/TopicCoverage");
const ClassCourse = require("../models/ClassCourse");
const AIReport = require("../models/aiReportModel"); // varsa


class ClassService {
  async createClass(data) {
    try {
      const { name, gradeLevel, year } = data;

      return await Class.create({
        name,
        gradeLevel,
        year,
      });
    } catch (err) {
      // 🔥 Duplicate class (same year + name)
      if (err.code === 11000) {
        throw new AppError(
          "Bu eğitim yılı için aynı sınıf zaten mevcut",
          400
        );
      }
      throw err;
    }
  }

  async getClasses() {
    return await Class.find().sort({ year: -1, gradeLevel: 1, name: 1 });
  }

    /**
   * ❌ Sınıf silme (öğrenci varsa ENGEL)
   */
  async deleteClassCascade(classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new AppError("Geçersiz classId", 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Sınıf var mı?
      const classDoc = await Class.findById(classId).session(session);
      if (!classDoc) {
        throw new AppError("Sınıf bulunamadı", 404);
      }

      // 2️⃣ Öğrenci VAR MI? (KİLİT NOKTA)
      const studentCount = await Student.countDocuments({
        classId,
      }).session(session);

      if (studentCount > 0) {
        throw new AppError(
          "Bu sınıfta kayıtlı öğrenci olduğu için silinemez",
          400
        );
      }

      // 3️⃣ TopicCoverage sil
      await TopicCoverage.deleteMany({
        classId,
      }).session(session);

      // 4️⃣ ExamResult + AI raporları
      const exams = await Exam.find({ classId }).session(session);
      const examIds = exams.map((e) => e._id);

      if (examIds.length) {
        await ExamResult.deleteMany({
          examId: { $in: examIds },
        }).session(session);

        await AIReport.deleteMany({
          examId: { $in: examIds },
        }).session(session);
      }

      // 5️⃣ Exam sil
      await Exam.deleteMany({
        classId,
      }).session(session);

      // 6️⃣ Öğretmen atamaları
      await ClassCourse.deleteMany({
        classId,
      }).session(session);

      // 7️⃣ Sınıf sil
      await Class.deleteOne({
        _id: classId,
      }).session(session);

      await session.commitTransaction();
      session.endSession();

      return {
        message: "Sınıf başarıyla silindi",
        deletedClassId: classId,
        deletedExams: examIds.length,
      };

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }


}

module.exports = new ClassService();
