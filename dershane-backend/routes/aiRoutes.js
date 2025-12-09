const express = require('express');
const router = express.Router();

const aiController = require('../controllers/aiController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { recalcAllReportsForStudent } = require('../controllers/aiController');

// Öğrencinin kendi raporları
router.get(
  '/my-reports',
  authenticateToken,
  authorizeRoles('student'),
  aiController.getMyReports
);

// Öğrencinin belirli sınav raporu
router.get(
  '/my-reports/:examId',
  authenticateToken,
  authorizeRoles('student'),
  aiController.getMyReportForExam
);

// Admin / Öğretmen / Veli → Öğrencinin raporlarını görüntüleme
router.get(
  '/student/:studentId',
  authenticateToken,
  authorizeRoles('admin', 'teacher', 'parent'),
  aiController.getReportsByStudentId
);

router.post(
  '/recalculate/:studentId',
  authenticateToken,
  authorizeRoles('admin', 'teacher'),
  recalcAllReportsForStudent
);

module.exports = router;
