const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const multer = require("multer");

const adminCurriculumService = require("../services/adminCurriculumService");

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/admin/curriculum/bulk
router.post(
  "/curriculum/bulk",
  authenticateToken,
  authorizeRoles("admin"),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file?.buffer) {
      throw new (require("../utils/AppError"))("Dosya bulunamadı", 400);
    }

    const result = await adminCurriculumService.bulkUpload(req.file.buffer);

    res.json({
      message: "Müfredat başarıyla yüklendi",
      ...result,
    });
  })
);

module.exports = router;
