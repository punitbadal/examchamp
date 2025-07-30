const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');

// GET /api/subjects - Get all subjects with filtering and pagination
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    difficulty,
    isActive,
    search,
    sortBy = 'order',
    sortOrder = 'asc'
  } = req.query;

  const query = {};

  // Apply filters
  if (category) query.category = category;
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
    populate: {
      path: 'createdBy',
      select: 'firstName lastName email'
    }
  };

  const subjects = await Subject.paginate(query, options);

  res.json({
    success: true,
    data: subjects
  });
}));

// GET /api/subjects/:id - Get a specific subject with details
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('lastModifiedBy', 'firstName lastName email');

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  // Get chapters for this subject
  const chapters = await Chapter.find({ subjectId: subject._id, isActive: true })
    .select('name code description chapterNumber difficulty stats')
    .sort('chapterNumber');

  res.json({
    success: true,
    data: {
      subject,
      chapters
    }
  });
}));

// POST /api/subjects - Create a new subject
router.post('/', [
  authenticateToken,
  authorize('admin', 'super_admin'),
  body('name').notEmpty().withMessage('Subject name is required'),
  body('code').notEmpty().withMessage('Subject code is required'),
  body('category').isIn(['Science', 'Mathematics', 'Engineering', 'Medical', 'Commerce', 'Arts', 'General'])
    .withMessage('Valid category is required'),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
  body('description').optional().isString(),
  body('icon').optional().isString(),
  body('color').optional().isString(),
  body('order').optional().isInt({ min: 0 }),
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
    description,
    category,
    difficulty = 'Intermediate',
    icon,
    color = '#3B82F6',
    order = 0,
    tags = []
  } = req.body;

  // Check if subject with same name or code already exists
  const existingSubject = await Subject.findOne({
    $or: [{ name }, { code: code.toUpperCase() }]
  });

  if (existingSubject) {
    return res.status(400).json({
      success: false,
      message: 'Subject with this name or code already exists'
    });
  }

  const subject = new Subject({
    name,
    code: code.toUpperCase(),
    description,
    category,
    difficulty,
    icon,
    color,
    order,
    tags,
    createdBy: req.user.id
  });

  await subject.save();

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: subject
  });
}));

// PUT /api/subjects/:id - Update a subject
router.put('/:id', [
  authenticateToken,
  authorize('admin', 'super_admin'),
  body('name').optional().notEmpty().withMessage('Subject name cannot be empty'),
  body('code').optional().notEmpty().withMessage('Subject code cannot be empty'),
  body('category').optional().isIn(['Science', 'Mathematics', 'Engineering', 'Medical', 'Commerce', 'Arts', 'General']),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
  body('description').optional().isString(),
  body('icon').optional().isString(),
  body('color').optional().isString(),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  body('tags').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  const updateData = { ...req.body };
  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase();
  }
  updateData.lastModifiedBy = req.user.id;

  // Check for conflicts if name or code is being updated
  if (updateData.name || updateData.code) {
    const conflictQuery = {
      _id: { $ne: req.params.id },
      $or: []
    };

    if (updateData.name) {
      conflictQuery.$or.push({ name: updateData.name });
    }
    if (updateData.code) {
      conflictQuery.$or.push({ code: updateData.code });
    }

    const existingSubject = await Subject.findOne(conflictQuery);
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this name or code already exists'
      });
    }
  }

  const updatedSubject = await Subject.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Subject updated successfully',
    data: updatedSubject
  });
}));

// DELETE /api/subjects/:id - Delete a subject
router.delete('/:id', [
  authenticateToken,
  authorize('admin', 'super_admin')
], asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  // Check if subject has chapters
  const chapterCount = await Chapter.countDocuments({ subjectId: subject._id });
  if (chapterCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete subject with existing chapters'
    });
  }

  await Subject.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Subject deleted successfully'
  });
}));

// GET /api/subjects/:id/chapters - Get chapters for a subject
router.get('/:id/chapters', authenticateToken, asyncHandler(async (req, res) => {
  const chapters = await Chapter.find({ 
    subjectId: req.params.id, 
    isActive: true 
  })
  .select('name code description chapterNumber difficulty stats order')
  .sort('chapterNumber');

  res.json({
    success: true,
    data: chapters
  });
}));

// GET /api/subjects/:id/stats - Get detailed statistics for a subject
router.get('/:id/stats', authenticateToken, asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  // Get detailed statistics
  const [chapterStats, topicStats, questionStats] = await Promise.all([
    Chapter.aggregate([
      { $match: { subjectId: subject._id, isActive: true } },
      {
        $group: {
          _id: null,
          totalChapters: { $sum: 1 },
          avgDifficulty: { $avg: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 2, 3] }] } }
        }
      }
    ]),
    Topic.aggregate([
      { $match: { subjectId: subject._id, isActive: true } },
      {
        $group: {
          _id: null,
          totalTopics: { $sum: 1 },
          avgDifficulty: { $avg: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 2, 3] }] } }
        }
      }
    ]),
    Chapter.aggregate([
      { $match: { subjectId: subject._id, isActive: true } },
      {
        $lookup: {
          from: 'topics',
          localField: '_id',
          foreignField: 'chapterId',
          as: 'topics'
        }
      },
      {
        $group: {
          _id: null,
          totalTopics: { $sum: { $size: '$topics' } }
        }
      }
    ])
  ]);

  const stats = {
    subject: subject.stats,
    chapters: chapterStats[0] || { totalChapters: 0, avgDifficulty: 0 },
    topics: topicStats[0] || { totalTopics: 0, avgDifficulty: 0 },
    questions: questionStats[0] || { totalTopics: 0 }
  };

  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router; 