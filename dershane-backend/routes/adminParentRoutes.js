const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminParentController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// 🔹 Listele
router.get(
  "/parents",
  authenticateToken,
  authorizeRoles("admin"),
  controller.getAllParents
);

// 🔹 Tekli ekle
router.post(
  "/parents",
  authenticateToken,
  authorizeRoles("admin"),
  controller.createParent
);

// 🔹 Sil
router.delete(
  "/parents/:parentId",
  authenticateToken,
  authorizeRoles("admin"),
  controller.deleteParent
);

module.exports = router;
