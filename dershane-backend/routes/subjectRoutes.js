const express = require("express");
const router = express.Router();

const subjectController = require("../controllers/subjectController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// 🔹 Listele
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  subjectController.getAllSubjects
);

// 🔹 Oluştur
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  subjectController.createSubject
);


// ❌ Ders sil (ADMIN)
router.delete(
  "/:subjectId",
  authenticateToken,
  authorizeRoles("admin"),
  subjectController.deleteSubject
);


module.exports = router;
