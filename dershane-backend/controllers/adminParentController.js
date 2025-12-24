const asyncHandler = require("../middleware/asyncHandler");
const adminParentService = require("../services/adminParentService");

// ⭐ Liste
exports.getAllParents = asyncHandler(async (req, res) => {
  const parents = await adminParentService.getAllParents();
  res.json(parents);
});

// ⭐ Oluştur
exports.createParent = asyncHandler(async (req, res) => {
  const result = await adminParentService.createParent(req.body);
  res.status(201).json(result);
});

// ⭐ Sil
exports.deleteParent = asyncHandler(async (req, res) => {
  const result = await adminParentService.deleteParent(
    req.params.parentId
  );
  res.json(result);
});
