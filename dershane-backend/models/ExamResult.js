const mongoose = require("mongoose");

const examResultSchema = new mongoose.Schema(
  {
    examId: {type: mongoose.Schema.Types.ObjectId,ref: "Exam",required: true},
    studentId: {type: mongoose.Schema.Types.ObjectId,ref: "Student",required: true},

    resultsBySubject: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: false   // 🔓 şimdilik opsiyonel
        },

        subject: {
          type: String,
          required: true    // 🔥 ŞU AN ANA KAYNAK
        },

        correct: { type: Number, default: 0 },
        wrong: { type: Number, default: 0 },
        blank: { type: Number, default: 0 },
        net: { type: Number, default: 0 },
      },
    ],

    totalNet: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔐 Bir öğrencinin bir denemede tek sonucu olur
examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

// ⚡ AI geçmiş deneme sorguları için
examResultSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model("ExamResult", examResultSchema);
