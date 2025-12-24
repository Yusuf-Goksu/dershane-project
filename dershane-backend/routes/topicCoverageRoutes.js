const express = require("express");
const router = express.Router();

const topicCoverageController = require("../controllers/topicCoverageController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

// 👨‍🏫 Öğretmen: konu durumunu güncelle (planned / in_progress / completed)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("teacher", "admin"),
  topicCoverageController.upsertTopicCoverage
);

// 👩‍🎓 Öğrenci: sınıfa ait konu durumlarını gör
router.get(
  "/class/:classId/subject/:subjectId",
  authenticateToken,
  topicCoverageController.getClassTopicCoverage
);

router.get(
  "/student/:classId",
  authenticateToken,
  topicCoverageController.getForStudent);



// ✅ Öğrenci: sınıfın gradeLevel'ına göre ders listesini getir
router.get(
  "/class/:classId/subjects",
  authenticateToken,
  topicCoverageController.getSubjectsForClass
);



module.exports = router;