const Exam = require("../models/Exam");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const examService = require("../services/examService");
const asyncHandler = require("../middleware/asyncHandler");

/**
 * 🔹 DENEME OLUŞTUR
 * POST /api/exams
 */
exports.createExam = async (req, res) => {
  try {
    const { title, classId, date, difficulty, subjects } = req.body;

    // 1️⃣ Validasyon
    if (!classId || !title || !date) {
      return res.status(400).json({
        success: false,
        message: "classId, title ve date zorunludur",
      });
    }

    // 2️⃣ Sınıf var mı?
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: "Sınıf bulunamadı",
      });
    }

    // 3️⃣ Dersler geçerli mi?
    if (subjects && subjects.length > 0) {
      const subjectIds = subjects.map(s => s.subjectId);
      const count = await Subject.countDocuments({ _id: { $in: subjectIds } });

      if (count !== subjectIds.length) {
        return res.status(400).json({
          success: false,
          message: "Geçersiz subjectId bulundu",
        });
      }
    }

    // 4️⃣ Denemeyi oluştur
    const exam = await Exam.create({
      title,
      classId,
      date,
      difficulty,
      subjects,
      status: "DRAFT"
    });

    return res.status(201).json(exam);

  } catch (error) {
    console.error("createExam error:", error);
    return res.status(500).json({
      success: false,
      message: "Deneme oluşturulamadı",
    });
  }
};

/**
 * 🔹 SINIFIN DENEMELERİNİ LİSTELE
 * GET /api/exams/class/:classId
 */
exports.getExamsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const exams = await Exam.find({ classId })
      .sort({ date: -1 })
      .populate("classId", "name gradeLevel year")
      .populate("subjects.subjectId", "name");

    return res.status(200).json(exams); // 🔥 sadeleştirildi
  } catch (error) {
    console.error("getExamsByClass error:", error);
    return res.status(500).json({
      message: "Denemeler getirilemedi",
    });
  }
};


/**
 * 🔹 TÜM DENEMELERİ LİSTELE (ADMIN)
 * GET /api/exams?classId=&status=
 */
exports.getExams = async (req, res) => {
  try {
    const { classId, status } = req.query;

    const filter = {};
    if (classId) filter.classId = classId;
    if (status) filter.status = status;

    const exams = await Exam.find(filter)
      .sort({ date: -1 })
      .populate("classId", "name gradeLevel year")
      .populate("subjects.subjectId", "name");

    return res.status(200).json(exams); // 🔥 frontend uyumlu
  } catch (error) {
    console.error("getExams error:", error);
    return res.status(500).json({
      message: "Denemeler getirilemedi",
    });
  }
};

exports.getExamById = asyncHandler(async (req, res) => {
  const exam = await examService.getExamById(req.params.id);
  res.json(exam);
});




// ⭐ Denemeyi finalize et (ADMIN)
exports.finalizeExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const result = await examService.finalizeExam(
    examId,
    req.user?._id // ✅ finalize eden admin
  );

  res.json({
    message: "Deneme finalize edildi, AI raporları üretildi.",
    ...result,
  });
});

exports.getExams = asyncHandler(async (req, res) => {
  const { classId, status } = req.query;

  const filter = {};
  if (classId) filter.classId = classId;
  if (status) filter.status = status;

  const exams = await Exam.find(filter)
    .populate("classId", "name gradeLevel year")
    .sort({ date: -1 });

  res.json(exams);
});

// ✅ GET /api/exams/:id/detail
exports.getExamDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await examService.getExamDetail(id);
  res.json(data);
});

