const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');
const Topic = require('../models/Topic');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');

// GET /api/topics - Get all topics with filtering and pagination
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    subjectId,
    chapterId,
    difficulty,
    isActive,
    search,
    sortBy = 'topicNumber',
    sortOrder = 'asc'
  } = req.query;

  const query = {};

  // Apply filters
  if (subjectId) query.subjectId = subjectId;
  if (chapterId) query.chapterId = chapterId;
  if (difficulty) query.difficulty = difficulty;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      {
        path: 'subjectId',
        select: 'name code category'
      },
      {
        path: 'chapterId',
        select: 'name code chapterNumber'
      },
      {
        path: 'createdBy',
        select: 'firstName lastName email'
      }
    ]
  };

  const topics = await Topic.paginate(query, options);

  res.json({
    success: true,
    data: topics
  });
}));

// GET /api/topics/:id - Get a specific topic with details
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const topic = await Topic.findById(req.params.id)
    .populate('subjectId', 'name code category')
    .populate('chapterId', 'name code chapterNumber')
    .populate('createdBy', 'firstName lastName email')
    .populate('lastModifiedBy', 'firstName lastName email');

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: 'Topic not found'
    });
  }

  res.json({
    success: true,
    data: topic
  });
}));

// POST /api/topics - Create a new topic
router.post('/', [
  authenticateToken,
  authorize('admin', 'super_admin'),
  body('name').notEmpty().withMessage('Topic name is required'),
  body('code').notEmpty().withMessage('Topic code is required'),
  body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
  body('chapterId').isMongoId().withMessage('Valid chapter ID is required'),
  body('topicNumber').isInt({ min: 1 }).withMessage('Valid topic number is required'),
  body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  body('description').optional().isString(),
  body('weightage').optional().isFloat({ min: 0, max: 100 }),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('order').optional().isInt({ min: 0 }),
  body('content').optional().isString(),
  body('learningObjectives').optional().isArray(),
  body('keyConcepts').optional().isArray(),
  body('formulas').optional().isArray(),
  body('examples').optional().isArray(),
  body('tags').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    name,
    code,
    subjectId,
    chapterId,
    topicNumber,
    description,
    difficulty = 'Medium',
    weightage = 0,
    estimatedHours = 0,
    order = 0,
    content,
    learningObjectives = [],
    keyConcepts = [],
    formulas = [],
    examples = [],
    tags = []
  } = req.body;

  // Verify subject and chapter exist
  const [subject, chapter] = await Promise.all([
    Subject.findById(subjectId),
    Chapter.findById(chapterId)
  ]);

  if (!subject) {
    return res.status(400).json({
      success: false,
      message: 'Subject not found'
    });
  }

  if (!chapter) {
    return res.status(400).json({
      success: false,
      message: 'Chapter not found'
    });
  }

  // Verify chapter belongs to the subject
  if (chapter.subjectId.toString() !== subjectId) {
    return res.status(400).json({
      success: false,
      message: 'Chapter does not belong to the specified subject'
    });
  }

  // Check if topic with same code or number already exists in this chapter
  const existingTopic = await Topic.findOne({
    chapterId,
    $or: [{ code: code.toUpperCase() }, { topicNumber }]
  });

  if (existingTopic) {
    return res.status(400).json({
      success: false,
      message: 'Topic with this code or number already exists in this chapter'
    });
  }

  const topic = new Topic({
    name,
    code: code.toUpperCase(),
    description,
    subjectId,
    subjectName: subject.name,
    chapterId,
    chapterName: chapter.name,
    topicNumber,
    difficulty,
    weightage,
    estimatedHours,
    order,
    content,
    learningObjectives,
    keyConcepts,
    formulas,
    examples,
    tags,
    createdBy: req.user.id
  });

  await topic.save();

  res.status(201).json({
    success: true,
    message: 'Topic created successfully',
    data: topic
  });
}));

// PUT /api/topics/:id - Update a topic
router.put('/:id', [
  authenticateToken,
  authorize('admin', 'super_admin'),
  body('name').optional().notEmpty().withMessage('Topic name cannot be empty'),
  body('code').optional().notEmpty().withMessage('Topic code cannot be empty'),
  body('topicNumber').optional().isInt({ min: 1 }),
  body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  body('description').optional().isString(),
  body('weightage').optional().isFloat({ min: 0, max: 100 }),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  body('content').optional().isString(),
  body('learningObjectives').optional().isArray(),
  body('keyConcepts').optional().isArray(),
  body('formulas').optional().isArray(),
  body('examples').optional().isArray(),
  body('tags').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const topic = await Topic.findById(req.params.id);
  if (!topic) {
    return res.status(404).json({
      success: false,
      message: 'Topic not found'
    });
  }

  const updateData = { ...req.body };
  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase();
  }
  updateData.lastModifiedBy = req.user.id;

  // Check for conflicts if code or topicNumber is being updated
  if (updateData.code || updateData.topicNumber) {
    const conflictQuery = {
      _id: { $ne: req.params.id },
      chapterId: topic.chapterId,
      $or: []
    };

    if (updateData.code) {
      conflictQuery.$or.push({ code: updateData.code });
    }
    if (updateData.topicNumber) {
      conflictQuery.$or.push({ topicNumber: updateData.topicNumber });
    }

    const existingTopic = await Topic.findOne(conflictQuery);
    if (existingTopic) {
      return res.status(400).json({
        success: false,
        message: 'Topic with this code or number already exists in this chapter'
      });
    }
  }

  const updatedTopic = await Topic.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Topic updated successfully',
    data: updatedTopic
  });
}));

// DELETE /api/topics/:id - Delete a topic
router.delete('/:id', [
  authenticateToken,
  authorize('admin', 'super_admin')
], asyncHandler(async (req, res) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) {
    return res.status(404).json({
      success: false,
      message: 'Topic not found'
    });
  }

  // Check if topic has questions
  const Question = require('../models/Question');
  const questionCount = await Question.countDocuments({ 
    subject: topic.subjectName,
    chapter: topic.chapterName,
    topic: topic.name
  });

  if (questionCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete topic with existing questions'
    });
  }

  await Topic.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Topic deleted successfully'
  });
}));

// GET /api/topics/:id/stats - Get detailed statistics for a topic
router.get('/:id/stats', authenticateToken, asyncHandler(async (req, res) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) {
    return res.status(404).json({
      success: false,
      message: 'Topic not found'
    });
  }

  // Get detailed statistics
  const Question = require('../models/Question');
  const questionStats = await Question.aggregate([
    {
      $match: {
        subject: topic.subjectName,
        chapter: topic.chapterName,
        topic: topic.name,
        isActive: true
      }
    },
    {
      $group: {
        _id: '$difficulty',
        count: { $sum: 1 }
      }
    }
  ]);

  const distribution = {
    easy: 0,
    medium: 0,
    hard: 0
  };

  questionStats.forEach(item => {
    distribution[item._id.toLowerCase()] = item.count;
  });

  const totalQuestions = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  const stats = {
    topic: topic.stats,
    questions: {
      total: totalQuestions,
      distribution
    }
  };

  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router; 