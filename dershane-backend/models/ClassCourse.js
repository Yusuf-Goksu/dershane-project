const mongoose = require("mongoose");

const classCourseSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherProfile", required: true },
    weeklyHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

classCourseSchema.index({ classId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model("ClassCourse", classCourseSchema);
