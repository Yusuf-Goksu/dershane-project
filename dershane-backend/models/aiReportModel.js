const mongoose = require("mongoose");

const aiReportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    summary: {
      type: String,
      required: true,
    },

    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendations: [{ type: String }],

    // AI’nin kullandığı sayısal referanslar (debug + şeffaflık)
    metrics: {
      studentTotalNet: Number,
      classAvgTotalNet: Number,

      subjectComparisons: [
        {
          subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: false,   // 🔓 şimdilik opsiyonel
          },

          subject: {
            type: String,
            required: true,    // 🔥 ANA KAYNAK
          },

          studentNet: Number,
          classAvgNet: Number,
          delta: Number,       // ✅ EKLENDİ
        },
      ],
    },
  },
  { timestamps: true }
);

/**
 * 🔐 Bir öğrenci + bir deneme = tek AI raporu
 * Ama aynı deneme için başka öğrenciler rapor alabilir
 */
aiReportSchema.index({ studentId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model("AIReport", aiReportSchema);
