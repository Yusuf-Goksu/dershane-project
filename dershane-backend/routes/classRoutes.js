// routes/classRoutes.js
const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  classController.createClass
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  classController.getClasses
);

// ❌ Sınıf sil (ADMIN)
router.delete(
  "/:classId",
  authenticateToken,
  authorizeRoles("admin"),
  classController.deleteClass
);

module.exports = router;
