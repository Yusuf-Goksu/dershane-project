const adminService = require("../services/adminService");
const asyncHandler = require("../middleware/asyncHandler");
const upload = require("../middleware/uploadMiddleware");

// ⚠️ Multer’ı controller seviyesinde kullanıyoruz
exports.bulkCreateUsers = [
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Excel dosyası gerekli" });
    }

    const result = await adminService.bulkCreateUsers(req.file.buffer);

    res.json({
      success: true,
      message: "Toplu kayıt başarıyla tamamlandı",
      ...result,
    });
  }),
];
