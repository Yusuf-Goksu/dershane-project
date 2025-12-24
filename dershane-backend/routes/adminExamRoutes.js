const express = require("express");
const router = express.Router();

const adminExamController = require("../controllers/adminExamController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// ✅ Deneme sil (Exam + ExamResult + AIReport)
router.delete(
  "/:examId",
  authenticateToken,
  authorizeRoles("admin"),
  adminExamController.deleteExam
);

module.exports = router;