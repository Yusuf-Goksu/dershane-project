// models/Topic.js
const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    name: { type: String, required: true },
    gradeLevel: {
      type: Number,
      required: true,
      enum: [9, 10, 11, 12],   //Daha sonra diğer seviyeleride dahil edilecek!!!
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Aynı sıra – aynı ders + seviye
topicSchema.index(
  { subjectId: 1, gradeLevel: 1, order: 1 },
  { unique: true }
);

// Aynı konu adı – aynı ders + seviye
// Aynı derste + aynı sınıfta aynı konu bir kez olabilir
topicSchema.index(
  { subjectId: 1, gradeLevel: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Topic", topicSchema);
