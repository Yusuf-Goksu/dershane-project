const AppError = require("../utils/AppError");
const ClassCourse = require("../models/ClassCourse");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const TeacherProfile = require("../models/TeacherProfile");

class ClassCourseService {
  async list(query = {}) {
    const filter = {};
    if (query.classId) filter.classId = query.classId;
    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.teacherId) filter.teacherId = query.teacherId;

    return await ClassCourse.find(filter)
      .populate("classId", "name gradeLevel year")
      .populate("subjectId", "name")
      .populate({
        path: "teacherId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  // Upsert mantığı: aynı classId+subjectId varsa teacher/weeklyHours update et
  async upsert(data) {
    const { classId, subjectId, teacherId, weeklyHours = 0 } = data;

    if (!classId || !subjectId || !teacherId) {
      throw new AppError("classId, subjectId ve teacherId zorunludur", 400);
    }

    const [classDoc, subjectDoc, teacherProfile] = await Promise.all([
      Class.findById(classId),
      Subject.findById(subjectId),
      TeacherProfile.findById(teacherId),
    ]);

    if (!classDoc) throw new AppError("Sınıf bulunamadı", 404);
    if (!subjectDoc) throw new AppError("Ders bulunamadı", 404);
    if (!teacherProfile) throw new AppError("Öğretmen profili bulunamadı", 404);

    const doc = await ClassCourse.findOneAndUpdate(
      { classId, subjectId }, // unique ikili
      { teacherId, weeklyHours },
      { upsert: true, new: true }
    );

    return doc;
  }

  async update(id, data) {
    const doc = await ClassCourse.findById(id);
    if (!doc) throw new AppError("Atama bulunamadı", 404);

    if (data.teacherId) {
      const teacherProfile = await TeacherProfile.findById(data.teacherId);
      if (!teacherProfile) throw new AppError("Öğretmen profili bulunamadı", 404);
      doc.teacherId = data.teacherId;
    }

    if (data.weeklyHours !== undefined) {
      doc.weeklyHours = Number(data.weeklyHours) || 0;
    }

    await doc.save();
    return doc;
  }

  async remove(id) {
    const doc = await ClassCourse.findByIdAndDelete(id);
    if (!doc) throw new AppError("Atama bulunamadı", 404);
    return { message: "Atama silindi" };
  }
}

module.exports = new ClassCourseService();
