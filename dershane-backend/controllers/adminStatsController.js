const asyncHandler = require("../middleware/asyncHandler");
const adminStatsService = require("../services/adminStatsService");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const data = await adminStatsService.getDashboardStats();
  res.json(data);
});