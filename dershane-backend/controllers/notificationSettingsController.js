const NotificationSetting = require("../models/NotificationSetting");
const asyncHandler = require("../middleware/asyncHandler");

exports.getAll = asyncHandler(async (req, res) => {
  const settings = await NotificationSetting.find();
  res.json(settings);
});

exports.update = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { mode } = req.body;

  const setting = await NotificationSetting.findOneAndUpdate(
    { key },
    { mode },
    { upsert: true, new: true }
  );

  res.json(setting);
});