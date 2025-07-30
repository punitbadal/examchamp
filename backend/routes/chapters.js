const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');

// GET /api/chapters - Get all chapters with filtering and pagination
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    subjectId,
    difficulty,
    isActive,
    search,
    sortBy = 'chapterNumber',
    sortOrder = 'asc'
  } = req.query;

  const query = {};

  // Apply filters
  if (subjectId) query.subjectId = subjectId;
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
        path: 'createdBy',
        select: 'firstName lastName email'
      }
    ]
  };

  const chapters = await Chapter.paginate(query, options);

  res.json({
    success: true,
    data: chapters
  });
}));

// GET /api/chapters/:id - Get a specific chapter with details
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.id)
    .populate('subjectId', 'name code category')
    .populate('createdBy', 'firstName lastName email')
    .populate('lastModifiedBy', 'firstName lastName email');

  if (!chapter) {
    return res.status(404).json({
      success: false,
      message: 'Chapter not found'
    });
  }

  // Get topics for this chapter
  const topics = await Topic.find({ chapterId: chapter._id, isActive: true })
    .select('name code description topicNumber difficulty stats')
    .sort('topicNumber');

  res.json({
    success: true,
    data: {
      chapter,
      topics
    }
  });
}));

// POST /api/chapters - Create a new chapter
router.post('/', [
  authenticateToken,
  authorize('admin', 'super_admin'),
  body('name').notEmpty().withMessage('Chapter name is required'),
  body('code').notEmpty().withMessage('Chapter code is required'),
  body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
  body('chapterNumber').isInt({ min: 1 }).withMessage('Valid chapter number is required'),
  body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  body('description').optional().isString(),
  body('weightage').optional().isFloat({ min: 0, max: 100 }),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('order').optional().isInt({ min: 0 }),
  body('syllabus').optional().isString(),
  body('learningObjectives').optional().isArray(),
  body('prerequisites').optional().isArray(),
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
    chapterNumber,
    description,
    difficulty = 'Medium',
    weightage = 0,
    estimatedHours = 0,
    order = 0,
    syllabus,
    learningObjectives = [],
    prerequisites = [],
    tags = []
  } = req.body;

  // Verify subject exists
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    return res.status(400).json({
      success: false,
      message: 'Subject not found'
    });
  }

  // Check if chapter with same code or number already exists in this subject
  const existingChapter = await Chapter.findOne({
    subjectId,
    $or: [{ code: code.toUpperCase() }, { chapterNumber }]
  });

  if (existingChapter) {
    return res.status(400).json({
      success: false,
      message: 'Chapter with this code or number already exists in this subject'
    });
  }

  const chapter = new Chapter({
    name,
    code: code.toUpperCase(),
    description,
    subjectId,
    subjectName: subject.name,
    chapterNumber,
    difficulty,
    weightage,
    estimatedHours,
    order,
    syllabus,
    learningObjectives,
    prerequisites,
    tags,
    createdBy: req.user.id
  });

  await chapter.save();

  res.status(201).json({
    success: true,
    message: 'Chapter created successfully',
    data: chapter
  });
}));

// PUT /api/chapters/:id - Update a chapter
router.put('/:id', [
  authenticateToken,
  authorize('admin', 'super_admin'),
  body('name').optional().notEmpty().withMessage('Chapter name cannot be empty'),
  body('code').optional().notEmpty().withMessage('Chapter code cannot be empty'),
  body('chapterNumber').optional().isInt({ min: 1 }),
  body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  body('description').optional().isString(),
  body('weightage').optional().isFloat({ min: 0, max: 100 }),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  body('syllabus').optional().isString(),
  body('learningObjectives').optional().isArray(),
  body('prerequisites').optional().isArray(),
  body('tags').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const chapter = await Chapter.findById(req.params.id);
  if (!chapter) {
    return res.status(404).json({
      success: false,
      message: 'Chapter not found'
    });
  }

  const updateData = { ...req.body };
  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase();
  }
  updateData.lastModifiedBy = req.user.id;

  // Check for conflicts if code or chapterNumber is being updated
  if (updateData.code || updateData.chapterNumber) {
    const conflictQuery = {
      _id: { $ne: req.params.id },
      subjectId: chapter.subjectId,
      $or: []
    };

    if (updateData.code) {
      conflictQuery.$or.push({ code: updateData.code });
    }
    if (updateData.chapterNumber) {
      conflictQuery.$or.push({ chapterNumber: updateData.chapterNumber });
    }

    const existingChapter = await Chapter.findOne(conflictQuery);
    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: 'Chapter with this code or number already exists in this subject'
      });
    }
  }

  const updatedChapter = await Chapter.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Chapter updated successfully',
    data: updatedChapter
  });
}));

// DELETE /api/chapters/:id - Delete a chapter
router.delete('/:id', [
  authenticateToken,
  authorize('admin', 'super_admin')
], asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.id);
  if (!chapter) {
    return res.status(404).json({
      success: false,
      message: 'Chapter not found'
    });
  }

  // Check if chapter has topics
  const topicCount = await Topic.countDocuments({ chapterId: chapter._id });
  if (topicCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete chapter with existing topics'
    });
  }

  await Chapter.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Chapter deleted successfully'
  });
}));

// GET /api/chapters/:id/topics - Get topics for a chapter
router.get('/:id/topics', authenticateToken, asyncHandler(async (req, res) => {
  const topics = await Topic.find({ 
    chapterId: req.params.id, 
    isActive: true 
  })
  .select('name code description topicNumber difficulty stats order')
  .sort('topicNumber');

  res.json({
    success: true,
    data: topics
  });
}));

// GET /api/chapters/:id/stats - Get detailed statistics for a chapter
router.get('/:id/stats', authenticateToken, asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.id);
  if (!chapter) {
    return res.status(404).json({
      success: false,
      message: 'Chapter not found'
    });
  }

  // Get detailed statistics
  const [topicStats, questionStats] = await Promise.all([
    Topic.aggregate([
      { $match: { chapterId: chapter._id, isActive: true } },
      {
        $group: {
          _id: null,
          totalTopics: { $sum: 1 },
          avgDifficulty: { $avg: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 2, 3] }] } }
        }
      }
    ]),
    Topic.aggregate([
      { $match: { chapterId: chapter._id, isActive: true } },
      {
        $lookup: {
          from: 'questions',
          localField: 'name',
          foreignField: 'topic',
          as: 'questions'
        }
      },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: { $size: '$questions' } }
        }
      }
    ])
  ]);

  const stats = {
    chapter: chapter.stats,
    topics: topicStats[0] || { totalTopics: 0, avgDifficulty: 0 },
    questions: questionStats[0] || { totalQuestions: 0 }
  };

  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router; 