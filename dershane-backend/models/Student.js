const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    date: Date,
    present: { type: Boolean, default: true },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },

    parentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Parent" }],

    attendance: [attendanceSchema],
  },
  { timestamps: true }
);

studentSchema.index({ classId: 1 });

module.exports = mongoose.model("Student", studentSchema);
