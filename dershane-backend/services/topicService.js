const Topic = require("../models/Topic");
const Subject = require("../models/Subject");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");
const TopicCoverage = require("../models/TopicCoverage");


class TopicService {
  // 🔹 Listeleme
  async getTopics({ subjectId, gradeLevel }) {
    const filter = {};
    if (subjectId) filter.subjectId = subjectId;
    if (gradeLevel) filter.gradeLevel = Number(gradeLevel);

    return await Topic.find(filter)
      .populate("subjectId", "name")
      .sort({ order: 1, name: 1 });
  }

  // 🔹 Oluşturma
  async createTopic(data) {
    const { subjectId, name, gradeLevel, order } = data;

    if (!subjectId || !name || !gradeLevel || !order) {
      throw new AppError(
        "Ders, konu adı, sınıf seviyesi ve sıra zorunludur",
        400
      );
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      throw new AppError("Ders bulunamadı", 404);
    }

    try {
      return await Topic.create({
        subjectId,
        name: name.trim(),
        gradeLevel: Number(gradeLevel),
        order: Number(order),
      });
    } catch (err) {
      // 🔥 Duplicate key (unique index) yakalama
      if (err.code === 11000) {
        if (err.keyPattern?.order) {
          throw new AppError(
            "Bu ders ve sınıf seviyesi için bu sıra zaten kullanılıyor",
            400
          );
        }

        if (err.keyPattern?.name) {
          throw new AppError(
            "Bu ders ve sınıf seviyesi için bu konu zaten mevcut",
            400
          );
        }

        throw new AppError(
          "Bu ders ve sınıf seviyesi için konu bilgisi çakışıyor",
          400
        );
      }

      throw err;
    }
  }


  /**
   * ❌ Konu sil:
   * - Topic
   * - TopicCoverage (topicId)
   */
  async deleteTopicCascade(topicId) {
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      throw new AppError("Geçersiz topicId", 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const topic = await Topic.findById(topicId).session(session);
      if (!topic) {
        throw new AppError("Konu bulunamadı", 404);
      }

      // 1️⃣ TopicCoverage sil
      const deletedCoverages = await TopicCoverage.deleteMany({
        topicId,
      }).session(session);

      // 2️⃣ Topic sil
      await Topic.deleteOne({ _id: topicId }).session(session);

      await session.commitTransaction();
      session.endSession();

      return {
        message: "Konu ve bağlı ilerleme kayıtları silindi",
        deletedTopicId: topicId,
        deletedTopicCoverages: deletedCoverages.deletedCount || 0,
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }


}

module.exports = new TopicService();
