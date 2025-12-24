const express = require("express");
const router = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

const ClassCourse = require("../models/ClassCourse");
const TeacherProfile = require("../models/TeacherProfile");

// 👨‍🏫 Teacher: kendi atamalarımı getir
router.get(
  "/my",
  authenticateToken,
  authorizeRoles("teacher", "admin"),
  asyncHandler(async (req, res) => {
    // teacher ise TeacherProfile bul
    if (req.user.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user._id });
      if (!tp) return res.status(404).json({ message: "Öğretmen profili bulunamadı" });

      const data = await ClassCourse.find({ teacherId: tp._id })
        .populate("classId", "name gradeLevel year")
        .populate("subjectId", "name")
        .sort({ createdAt: -1 })
        .lean();

      return res.json(data);
    }

    // admin ise hepsini görmek isteyebilir (opsiyonel)
    const data = await ClassCourse.find({})
      .populate("classId", "name gradeLevel year")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(data);
  })
);

module.exports = router;
