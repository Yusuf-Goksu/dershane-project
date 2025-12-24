const topicCoverageService = require("../services/topicCoverageService");
const asyncHandler = require("../middleware/asyncHandler");
const TopicCoverage = require('../models/TopicCoverage');

// ⭐ Konu durumunu oluştur / güncelle
exports.upsertTopicCoverage = asyncHandler(async (req, res) => {
  const result = await topicCoverageService.upsertTopicCoverage(
    req.body,
    req.user
  );

  res.status(200).json({
    message: "Konu durumu güncellendi",
    data: result,
  });
});

// ⭐ Sınıfa ait konu durumlarını getir
exports.getClassTopicCoverage = asyncHandler(async (req, res) => {
  const { classId, subjectId } = req.params;

  const result =
    await topicCoverageService.getClassTopicCoverage(
      classId,
      subjectId
    );

  res.json(result);
});



exports.getForStudent = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const data = await TopicCoverage.find({ classId })
    .populate("subjectId", "name")
    .populate("topicId", "name")
    .sort({ subjectId: 1, createdAt: 1 });

  res.json(
    data.map((t) => ({
      id: t._id,
      subjectName: t.subjectId.name,
      topicName: t.topicId.name,
      status: t.status,
      note: t.note,
    }))
  );
});

exports.getSubjectsForClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const data = await topicCoverageService.getSubjectsForClass(classId);
  res.json(data);
});