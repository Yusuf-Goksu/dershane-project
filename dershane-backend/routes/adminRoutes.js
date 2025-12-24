const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

// 🔥 Toplu öğrenci + veli kayıt
router.post(
  "/bulk-users",
  authenticateToken,
  authorizeRoles("admin"),
  adminController.bulkCreateUsers
);

module.exports = router;
