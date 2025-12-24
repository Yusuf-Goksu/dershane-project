const classService = require("../services/classService");
const asyncHandler = require("../middleware/asyncHandler");

exports.createClass = asyncHandler(async (req, res) => {
  const newClass = await classService.createClass(req.body);
  res.status(201).json(newClass);
});

exports.getClasses = asyncHandler(async (req, res) => {
  const classes = await classService.getClasses();
  res.json(classes);
});

;
// DELETE /api/classes/:classId
exports.deleteClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const result = await classService.deleteClassCascade(classId);

  res.json(result);
});