const Subject = require("../models/Subject");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");
const Topic = require("../models/Topic");
const TopicCoverage = require("../models/TopicCoverage");

class SubjectService {
  async getAllSubjects() {
    return await Subject.find().sort({ name: 1 });
  }

  async createSubject(data) {
    const { name } = data;

    if (!name || !name.trim()) {
      throw new AppError("Ders adı zorunludur", 400);
    }

    const existing = await Subject.findOne({ name: name.trim() });
    if (existing) {
      throw new AppError("Bu ders zaten mevcut", 400);
    }

    return await Subject.create({ name: name.trim() });
  }

  /**
   * ❌ Ders sil (cascade):
   * - Subject
   * - Topic
   * - TopicCoverage
   */
  async deleteSubjectCascade(subjectId) {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      throw new AppError("Geçersiz subjectId", 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Ders var mı?
      const subject = await Subject.findById(subjectId).session(session);
      if (!subject) {
        throw new AppError("Ders bulunamadı", 404);
      }

      // 2️⃣ Bu derse ait konular
      const topics = await Topic.find({
        subjectId,
      }).session(session);

      const topicIds = topics.map((t) => t._id);

      // 3️⃣ TopicCoverage sil
      const deletedCoverages = await TopicCoverage.deleteMany({
        subjectId,
      }).session(session);

      // 4️⃣ Topic sil
      const deletedTopics = await Topic.deleteMany({
        subjectId,
      }).session(session);

      // 5️⃣ Subject sil
      await Subject.deleteOne({ _id: subjectId }).session(session);

      await session.commitTransaction();
      session.endSession();

      return {
        message: "Ders ve bağlı tüm veriler silindi",
        deletedSubjectId: subjectId,
        deletedTopics: deletedTopics.deletedCount || 0,
        deletedTopicCoverages: deletedCoverages.deletedCount || 0,
      };

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}

module.exports = new SubjectService();
