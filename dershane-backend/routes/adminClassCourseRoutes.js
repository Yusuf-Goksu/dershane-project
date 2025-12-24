const express = require("express");
const router = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/classCourseController");

router.use(authenticateToken, authorizeRoles("admin"));

router.get("/", ctrl.list);
router.post("/", ctrl.upsert);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
