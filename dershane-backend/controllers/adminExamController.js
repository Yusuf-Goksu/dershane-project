const asyncHandler = require("../middleware/asyncHandler");
const adminExamService = require("../services/adminExamService");

// ✅ DELETE /api/admin/exams/:examId
exports.deleteExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const result = await adminExamService.deleteExamCascade(examId);

  res.json(result);
});
