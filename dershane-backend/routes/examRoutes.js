const express = require("express");
const router = express.Router();

const examController = require("../controllers/examController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

// ⭐ Deneme oluştur (ADMIN)
router.post("/exams", authenticateToken, authorizeRoles("admin"), examController.createExam);

// ⭐ Sınıfın denemelerini listele (ADMIN / TEACHER)
router.get(
  "/exams/class/:classId",
  authenticateToken,
  examController.getExamsByClass
);
//admin için
router.get("/exams", authenticateToken, authorizeRoles("admin"), examController.getExams);

router.get(
  "/exams/:id",
  authenticateToken,
  authorizeRoles("admin"),
  examController.getExamById
);

// 🔥 YENİ: frontend uyumu için alias
router.post(
  "/exams/:examId/finalize",
  authenticateToken,
  authorizeRoles("admin"),
  examController.finalizeExam
);

// ✅ Deneme detay (analytics + resultCount dahil)
router.get(
  "/exams/:id/detail",
  authenticateToken,
  authorizeRoles("admin"),
  examController.getExamDetail
);




module.exports = router;
