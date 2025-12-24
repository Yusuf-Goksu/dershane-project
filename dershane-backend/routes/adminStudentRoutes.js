const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminStudentController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// 🔹 Listele
router.get(
  "/students",
  authenticateToken,
  authorizeRoles("admin"),
  controller.getAllStudents
);

// 🔹 Tekli öğrenci ekle
router.post(
  "/students",
  authenticateToken,
  authorizeRoles("admin"),
  controller.createStudent
);

// 🔹 Öğrenci sil
router.delete(
  "/students/:studentId",
  authenticateToken,
  authorizeRoles("admin"),
  controller.deleteStudent
);

module.exports = router;
