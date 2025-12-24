// controllers/topicController.js
const topicService = require("../services/topicService");
const asyncHandler = require("../middleware/asyncHandler");

exports.getTopics = asyncHandler(async (req, res) => {
  const topics = await topicService.getTopics(req.query);
  res.json(topics);
});

exports.createTopic = asyncHandler(async (req, res) => {
  const topic = await topicService.createTopic(req.body);
  res.status(201).json(topic);
});


// DELETE /api/topics/:topicId
exports.deleteTopic = asyncHandler(async (req, res) => {
  const { topicId } = req.params;

  const result = await topicService.deleteTopicCascade(topicId);

  res.json(result);
});
