// models/NotificationSetting.js
const mongoose = require("mongoose");

const notificationSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true, 
      // "attendance", "examResult", "announcement", "schedule"
    },
    mode: {
      type: String,
      enum: ["push", "both", "none"],
      required: true,
      default: "push",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "NotificationSetting",
  notificationSettingSchema
);
