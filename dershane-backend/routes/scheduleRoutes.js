const express = require('express');
const router = express.Router();

const scheduleController = require('../controllers/scheduleController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Yaklaşan etkinlikler
router.get(
  '/upcoming/:classId',
  authenticateToken,
  scheduleController.getUpcomingEvents
);

// En yakın etkinlik
router.get(
  '/next/:classId',
  authenticateToken,
  scheduleController.getNextEvent
);

// Yeni etkinlik oluşturma
//  Oluştur (ADMIN)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  scheduleController.create
);

// 📌 Sil (ADMIN)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  scheduleController.remove
);

// 📌 Listele (filtreli)
router.get(
  "/",
  authenticateToken,
  scheduleController.getAll
);

module.exports = router;
