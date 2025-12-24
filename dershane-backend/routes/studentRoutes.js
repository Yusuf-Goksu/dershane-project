const express = require('express');
const router = express.Router();

const studentController = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Devamsızlık ekle
router.post('/:id/attendance',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  studentController.addAttendance
);

// Deneme özeti
router.get('/:id/exam-summary', authenticateToken, studentController.getExamSummary);

// Öğrenciye sınıf ata
router.put('/:id/assign-class',
  authenticateToken,
  authorizeRoles('admin'),
  studentController.assignClass
);

// Sınıf sıralaması
router.get(
  '/class/:classId/ranking',
  authenticateToken,
  studentController.getClassRanking
);

// ⭐ Giriş yapan öğrencinin kendi profili
router.get(
  "/me",
  authenticateToken,
  studentController.getMyProfile
);

// Öğrenci profilini getir
router.get(
  '/:id',
  authenticateToken,
  studentController.getStudentProfile
);

// ⭐ Tüm öğrencileri listele (ADMIN)
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  studentController.getAllStudents
);

router.get(
  "/class/:classId",
  authenticateToken,
  authorizeRoles("admin"),
  studentController.getStudentsByClass
);


module.exports = router;