const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const AIReport = require("../models/aiReportModel"); // sende bu isimde model var
const AppError = require("../utils/AppError");

class AdminExamService {
  /**
   * ✅ Denemeyi siler:
   * - Exam
   * - ExamResult (examId)
   * - AIReport (examId)
   * Transaction ile (yarım kalmasın)
   */
  async deleteExamCascade(examId) {
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      throw new AppError("Geçersiz examId", 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const exam = await Exam.findById(examId).session(session);
      if (!exam) {
        throw new AppError("Deneme bulunamadı", 404);
      }

      // 1) Denemeye bağlı sonuçlar
      const deletedResults = await ExamResult.deleteMany({ examId }).session(
        session
      );

      // 2) Denemeye bağlı AI raporları
      const deletedAi = await AIReport.deleteMany({ examId }).session(session);

      // 3) Denemeyi sil
      await Exam.deleteOne({ _id: examId }).session(session);

      await session.commitTransaction();
      session.endSession();

      return {
        message: "Deneme ve bağlı kayıtlar silindi",
        deletedExamId: examId,
        deletedExamResults: deletedResults.deletedCount || 0,
        deletedAiReports: deletedAi.deletedCount || 0,
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}

module.exports = new AdminExamService();
