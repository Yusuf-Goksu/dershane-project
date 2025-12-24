// routes/topicRoutes.js
const express = require("express");
const router = express.Router();

const topicController = require("../controllers/topicController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Listele (ders + seviye filtreli)
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  topicController.getTopics
);

// Oluştur
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  topicController.createTopic
);


// ❌ Konu sil (ADMIN)
router.delete(
  "/:topicId",
  authenticateToken,
  authorizeRoles("admin"),
  topicController.deleteTopic
);

module.exports = router;


module.exports = router;
