const express = require("express");
const router = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const adminTeacherController = require("../controllers/adminTeacherController");

router.use(authenticateToken, authorizeRoles("admin"));

router.get("/teachers", adminTeacherController.getAllTeachers);
router.post("/teachers", adminTeacherController.createTeacher);

// ⭐ Öğretmen sil (ADMIN)
router.delete(
  "/teachers/:teacherId",
  authenticateToken,
  authorizeRoles("admin"),
  adminTeacherController.deleteTeacher
);


module.exports = router;
