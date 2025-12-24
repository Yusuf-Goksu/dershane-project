const scheduleService = require("../services/scheduleService");
const asyncHandler = require("../middleware/asyncHandler");

// ⭐ Yaklaşan etkinlikler
exports.getUpcomingEvents = asyncHandler(async (req, res) => {
  const data = await scheduleService.getUpcomingEvents(req.params.classId);
  res.json(data);
});

// ⭐ En yakın etkinlik
exports.getNextEvent = asyncHandler(async (req, res) => {
  const data = await scheduleService.getNextEvent(req.params.classId);
  res.json(data);
});

exports.getAll = asyncHandler(async (req, res) => {
  const result = await scheduleService.getAll(req.query);
  res.json(result);
});

exports.create = asyncHandler(async (req, res) => {
  const result = await scheduleService.create(req.body);
  res.status(201).json(result);
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await scheduleService.remove(req.params.id);
  res.json(result);
});
