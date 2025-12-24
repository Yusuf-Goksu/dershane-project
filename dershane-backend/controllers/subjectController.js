const subjectService = require("../services/subjectService");
const asyncHandler = require("../middleware/asyncHandler");

// ⭐ Tüm dersleri getir
exports.getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await subjectService.getAllSubjects();
  res.json(subjects);
});

// ⭐ Yeni ders oluştur
exports.createSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.createSubject(req.body);
  res.status(201).json(subject);
});

// DELETE /api/subjects/:subjectId
exports.deleteSubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  const result = await subjectService.deleteSubjectCascade(subjectId);

  res.json(result);
});
