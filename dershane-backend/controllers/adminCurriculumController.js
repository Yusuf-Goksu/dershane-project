exports.bulkUpload = asyncHandler(async (req, res) => {
  const result = await adminCurriculumService.bulkUpload(
    req.file.buffer
  );
  res.json({
    message: "Müfredat başarıyla yüklendi",
    ...result,
  });
});
