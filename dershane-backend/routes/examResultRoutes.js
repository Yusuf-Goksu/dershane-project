const express = require("express");
const router = express.Router();
const multer = require("multer");

const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const examResultController = require("../controllers/examResultController");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/:examId/bulk",
  authenticateToken,
  authorizeRoles("admin"),
  upload.single("file"),
  examResultController.bulkUploadResults
);

router.get(
  "/exam/:examId",
  authenticateToken,
  authorizeRoles("admin"),
  examResultController.getResultsByExam
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  examResultController.deleteExamResult
);

router.post(
  "/manual",
  authenticateToken,
  authorizeRoles("admin"),
  examResultController.addManualResult
);

// ⭐ Öğrencinin son deneme sonucu
router.get(
  "/my-latest",
  authenticateToken,
  authorizeRoles("student"),
  examResultController.getMyLatestResult
);

module.exports = router;