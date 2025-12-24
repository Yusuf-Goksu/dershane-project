const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },

    subjects: [
      {
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
        questionCount: { type: Number, default: 0 },
      },
    ],

    // ✅ lifecycle
    status: {
      type: String,
      enum: ["DRAFT", "RESULT_ENTRY", "FINALIZED"],
      default: "DRAFT",
      index: true,
    },

    finalizedAt: { type: Date, default: null },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // (varsa sende mevcut analytics alanını koru)
    analytics: { type: Object, default: {} },
  },
  { timestamps: true }
);

examSchema.index({ classId: 1, date: -1 });

module.exports = mongoose.model("Exam", examSchema);
