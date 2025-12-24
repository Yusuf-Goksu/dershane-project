const asyncHandler = require("../middleware/asyncHandler");
const classCourseService = require("../services/classCourseService");

exports.list = asyncHandler(async (req, res) => {
  const data = await classCourseService.list(req.query);
  res.json(data);
});

exports.upsert = asyncHandler(async (req, res) => {
  const data = await classCourseService.upsert(req.body);
  res.status(200).json({ message: "Atama kaydedildi", data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await classCourseService.update(req.params.id, req.body);
  res.json({ message: "Atama güncellendi", data });
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await classCourseService.remove(req.params.id);
  res.json(result);
});

