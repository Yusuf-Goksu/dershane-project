const mongoose = require("mongoose");

const teacherProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    branches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }], // öğretmenin branş(ları)
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeacherProfile", teacherProfileSchema);
