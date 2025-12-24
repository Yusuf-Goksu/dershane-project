const TopicCoverage = require("../models/TopicCoverage");
const Topic = require("../models/Topic");
const Class = require("../models/Class");
const AppError = require("../utils/AppError");
const Subject = require('../models/Subject');

class TopicCoverageService {
  /**
   * ⭐ Konu durumunu oluştur / güncelle (UPSERT)
   */
  async upsertTopicCoverage(data, user) {
  const { classId, subjectId, topicId, status, note } = data;

  if (!classId || !subjectId || !topicId) {
    throw new AppError("classId, subjectId ve topicId zorunludur", 400);
  }

  const allowedStatus = ["planned", "in_progress", "completed"];
  if (status && !allowedStatus.includes(status)) {
    throw new AppError("Geçersiz status değeri", 400);
  }

  // 🔎 Topic kontrolü
  const topic = await Topic.findById(topicId);
  if (!topic) throw new AppError("Konu bulunamadı", 404);

  // ✅ subjectId karşılaştırması güvenli
  if (String(topic.subjectId) !== String(subjectId)) {
    throw new AppError("Konu seçilen derse ait değil", 400);
  }

  // 🔥 SINIF – SEVİYE UYUMU
  const classDoc = await Class.findById(classId);
  if (!classDoc) throw new AppError("Sınıf bulunamadı", 404);

  if (Number(classDoc.gradeLevel) !== Number(topic.gradeLevel)) {
    throw new AppError("Bu konu sınıfın seviyesine ait değil", 400);
  }

  // 🔥 Eğer öğretmense yetki kontrolü
  if (user.role === "teacher") {
    const teacherProfile = await TeacherProfile.findOne({ userId: user._id });
    if (!teacherProfile) {
      throw new AppError("Öğretmen profili bulunamadı", 403);
    }

    const assignment = await ClassCourse.findOne({
      teacherId: teacherProfile._id,
      classId,
      subjectId: topic.subjectId, // ✅ daha temiz
    });

    if (!assignment) {
      throw new AppError("Bu ders için bu sınıfta yetkiniz yok", 403);
    }
  }

  // ✅ status/note sadece geldiyse güncelle
  const updateDoc = {
    subjectId: topic.subjectId,  // ✅ tek doğruluk kaynağı
    updatedBy: user._id,
  };

  if (status) updateDoc.status = status;
  if (note !== undefined) updateDoc.note = note;

  try {
    const coverage = await TopicCoverage.findOneAndUpdate(
      { classId, topicId },
      updateDoc,
      { upsert: true, new: true }
    );
    return coverage;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError("Bu konu bu sınıf için zaten kayıtlı", 400);
    }
    throw err;
  }
}


  /**
   * ⭐ Öğretmen / öğrenci için:
   * Sınıfa ait ders + konu + status listesini getirir
   */
  async getClassTopicCoverage(classId, subjectId) {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new AppError("Sınıf bulunamadı", 404);
    }

    // 🔹 O sınıfa ait tüm konular
    const topics = await Topic.find({
      subjectId,
      gradeLevel: classDoc.gradeLevel,
    }).sort({ order: 1 });

    // 🔹 İşlenmiş olanlar
    const coverages = await TopicCoverage.find({
      classId,
      subjectId,
    })
    .populate({
      path: "updatedBy",
      select: "name email role",
    })
    .lean();

    const coverageMap = {};
    coverages.forEach((c) => {
      coverageMap[c.topicId.toString()] = c;
    });

    // 🔥 FULL LIST (konu + status)
    return topics.map((topic) => {
      const coverage = coverageMap[topic._id.toString()];
      return {
        topicId: topic._id,
        topicName: topic.name,
        order: topic.order,
        status: coverage?.status || "planned",
        note: coverage?.note || "",
        updatedAt: coverage?.updatedAt || null,
        updatedBy: coverage?.updatedBy
          ? {
              name: coverage.updatedBy.name,
              email: coverage.updatedBy.email,
            }
          : null,
      };
    });
  }


  async getSubjectsForClass(classId) {
  const classDoc = await Class.findById(classId);
  if (!classDoc) throw new AppError("Sınıf bulunamadı", 404);

  // o sınıf seviyesinde hangi derslerin konusu var?
  const subjects = await Topic.aggregate([
    { $match: { gradeLevel: Number(classDoc.gradeLevel) } },
    { $group: { _id: "$subjectId" } },
  ]);

  const subjectIds = subjects.map(s => s._id);

  const subjectDocs = await Subject.find({ _id: { $in: subjectIds } })
    .select("name")
    .sort({ name: 1 })
    .lean();

  return subjectDocs.map(s => ({ subjectId: s._id, subjectName: s.name }));
}
}

module.exports = new TopicCoverageService();
