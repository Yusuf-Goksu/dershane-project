const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminStatsController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

// GET /api/admin/dashboard-stats
router.get(
  "/dashboard-stats",
  authenticateToken,
  authorizeRoles("admin"),
  controller.getDashboardStats
);

module.exports = router;
