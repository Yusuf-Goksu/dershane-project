const router = require("express").Router();
const controller = require("../controllers/notificationSettingsController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

router.get(
  "/notification-settings",
  authenticateToken,
  authorizeRoles("admin"),
  controller.getAll
);

router.put(
  "/notification-settings/:key",
  authenticateToken,
  authorizeRoles("admin"),
  controller.update
);

module.exports = router;