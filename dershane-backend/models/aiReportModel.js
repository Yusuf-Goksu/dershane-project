// models/aiReportModel.js
const mongoose = require('mongoose');

const subjectStatSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true },
    normalizedScore: { type: Number, required: true }, // 0–1
    trend: { type: String }, // 'rising' | 'falling' | 'stable'
    classPosition: { type: String }, // 'above' | 'average' | 'below' | 'unknown'
    comment: { type: String },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    overallTrend: { type: String }, // 'rising' | 'falling' | 'stable'
    difficultyAdjustedScore: { type: Number }, // 0–100 arası bir skor

    subjectStats: [subjectStatSchema],
    aiComments: [{ type: String }],
  },
  { _id: false }
);

const aiReportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      unique: true, // her sınav için 1 rapor
    },
    analysis: analysisSchema,
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

module.exports = mongoose.model('AIReport', aiReportSchema);
