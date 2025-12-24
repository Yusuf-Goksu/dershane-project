const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },        // "11-A"
    gradeLevel: { type: Number, required: true },  // 11
    year: { type: String, required: true },        // "2025-2026"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

classSchema.index({ year: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);
