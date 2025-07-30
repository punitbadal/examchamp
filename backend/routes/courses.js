const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Question = require('../models/Question');

const router = express.Router();

// @route   GET /api/courses/subjects
// @desc    Get all subjects with material and test counts
// @access  Public
router.get('/subjects', asyncHandler(async (req, res) => {
  try {
    // Get unique subjects from questions and study materials
    const subjects = await Question.aggregate([
      {
        $group: {
          _id: '$subject',
          materialCount: { $sum: 1 },
          testCount: { $sum: { $cond: [{ $eq: ['$questionType', 'mcq'] }, 1, 0] } }
        }
      },
      {
        $project: {
          name: '$_id',
          materialCount: 1,
          testCount: 1,
          _id: 0
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    // Add IDs to each subject
    const subjectsWithIds = subjects.map((subject, index) => ({
      id: (index + 1).toString(),
      ...subject
    }));

    res.json({ subjects: subjectsWithIds });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
}));

// @route   GET /api/courses
// @desc    Get all courses with filtering
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    category,
    level,
    status = 'published',
    search,
    page = 1,
    limit = 12,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = { isActive: true, status };
  
  if (category) query.category = category;
  if (level) query.level = level;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const courses = await Course.find(query)
    .populate('createdBy', 'name email')
    .select('-chapters.topics.studyMaterials')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Course.countDocuments(query);

  res.json({
    courses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// @route   GET /api/courses/:id
// @desc    Get course details
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('instructors', 'name email');

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Get user enrollment if authenticated
  let userEnrollment = null;
  if (req.user) {
    userEnrollment = await course.getUserProgress(req.user.id);
  }

  res.json({
    course,
    userEnrollment
  });
}));

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Admin/Instructor)
router.post('/', [
  authenticateToken,
  authorize(['admin', 'instructor']),
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('code').trim().notEmpty().withMessage('Course code is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').optional().trim(),
  body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  body('duration').optional().isFloat({ min: 0 }),
  body('settings.isPaid').optional().isBoolean(),
  body('settings.price').optional().isFloat({ min: 0 }),
  body('targetAudience').optional().isArray(),
  body('prerequisites').optional().isArray(),
  body('learningOutcomes').optional().isArray(),
  body('tags').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const courseData = {
    ...req.body,
    createdBy: req.user.id
  };

  const course = new Course(courseData);
  await course.save();

  res.status(201).json({
    message: 'Course created successfully',
    course
  });
}));

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Admin/Instructor)
router.put('/:id', [
  authenticateToken,
  authorize(['admin', 'instructor']),
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  body('duration').optional().isFloat({ min: 0 }),
  body('settings.isPaid').optional().isBoolean(),
  body('settings.price').optional().isFloat({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Check if user has permission to edit this course
  if (course.createdBy.toString() !== req.user.id && !req.user.role === 'admin') {
    return res.status(403).json({ error: 'Not authorized to edit this course' });
  }

  Object.assign(course, req.body);
  await course.save();

  res.json({
    message: 'Course updated successfully',
    course
  });
}));

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/:id/enroll', [
  authenticateToken,
  authorize(['student'])
], asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  if (!course.settings.allowEnrollment) {
    return res.status(400).json({ error: 'Course enrollment is not allowed' });
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    userId: req.user.id,
    courseId: course._id
  });

  if (existingEnrollment) {
    return res.status(400).json({ error: 'Already enrolled in this course' });
  }

  // Check enrollment limit
  const currentEnrollments = await Enrollment.countDocuments({ courseId: course._id });
  if (currentEnrollments >= course.settings.maxEnrollments) {
    return res.status(400).json({ error: 'Course enrollment limit reached' });
  }

  // Create enrollment
  const enrollment = new Enrollment({
    userId: req.user.id,
    courseId: course._id,
    totalChapters: course.chapters.length,
    totalTopics: course.totalTopics
  });

  // Initialize chapter progress
  enrollment.chapterProgress = course.chapters.map(chapter => ({
    chapterId: chapter._id,
    totalTopics: chapter.topics.length
  }));

  await enrollment.save();

  // Update course stats
  await course.updateStats();

  res.status(201).json({
    message: 'Successfully enrolled in course',
    enrollment
  });
}));

// @route   GET /api/courses/:id/progress
// @desc    Get user's course progress
// @access  Private
router.get('/:id/progress', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    userId: req.user.id,
    courseId: req.params.id
  });

  if (!enrollment) {
    return res.status(404).json({ error: 'Not enrolled in this course' });
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Get detailed progress
  const progress = {
    enrollment,
    course: {
      _id: course._id,
      name: course.name,
      chapters: course.chapters.map(chapter => {
        const chapterProgress = enrollment.chapterProgress.find(
          cp => cp.chapterId.toString() === chapter._id.toString()
        );
        
        return {
          _id: chapter._id,
          name: chapter.name,
          description: chapter.description,
          order: chapter.order,
          topics: chapter.topics.map(topic => {
            const topicProgress = enrollment.topicProgress.find(
              tp => tp.topicId.toString() === topic._id.toString()
            );
            
            return {
              _id: topic._id,
              name: topic.name,
              description: topic.description,
              order: topic.order,
              difficulty: topic.difficulty,
              estimatedHours: topic.estimatedHours,
              questionCount: topic.questionCount,
              progress: topicProgress ? topicProgress.progress : 0,
              status: topicProgress ? topicProgress.status : 'not_started',
              timeSpent: topicProgress ? topicProgress.timeSpent : 0,
              lastAccessed: topicProgress ? topicProgress.lastAccessed : null
            };
          }),
          progress: chapterProgress ? chapterProgress.progress : 0,
          status: chapterProgress ? chapterProgress.status : 'not_started',
          completedTopics: chapterProgress ? chapterProgress.completedTopics : 0,
          totalTopics: chapterProgress ? chapterProgress.totalTopics : 0
        };
      })
    }
  };

  res.json(progress);
}));

// @route   PUT /api/courses/:id/progress
// @desc    Update topic progress
// @access  Private
router.put('/:id/progress', [
  authenticateToken,
  body('chapterId').isMongoId(),
  body('topicId').isMongoId(),
  body('progress').isFloat({ min: 0, max: 100 }),
  body('timeSpent').optional().isFloat({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { chapterId, topicId, progress, timeSpent = 0 } = req.body;

  const enrollment = await Enrollment.findOne({
    userId: req.user.id,
    courseId: req.params.id
  });

  if (!enrollment) {
    return res.status(404).json({ error: 'Not enrolled in this course' });
  }

  await enrollment.updateTopicProgress(topicId, chapterId, progress, timeSpent);

  res.json({
    message: 'Progress updated successfully',
    enrollment
  });
}));

// @route   GET /api/courses/:id/study-materials/:topicId
// @desc    Get study materials for a topic
// @access  Private
router.get('/:id/study-materials/:topicId', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Find the topic
  let topic = null;
  for (const chapter of course.chapters) {
    const foundTopic = chapter.topics.find(t => t._id.toString() === req.params.topicId);
    if (foundTopic) {
      topic = foundTopic;
      break;
    }
  }

  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }

  res.json({
    topic,
    studyMaterials: topic.studyMaterials
  });
}));

// @route   GET /api/courses/categories
// @desc    Get all course categories
// @access  Public
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Course.distinct('category');
  res.json(categories);
}));

// @route   GET /api/courses/popular
// @desc    Get popular courses
// @access  Public
router.get('/popular', asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;

  const courses = await Course.find({ 
    isActive: true, 
    status: 'published' 
  })
    .sort({ 'stats.totalEnrollments': -1, 'stats.averageRating': -1 })
    .limit(parseInt(limit))
    .populate('createdBy', 'name email')
    .select('-chapters.topics.studyMaterials');

  res.json(courses);
}));

// @route   GET /api/courses/recommended
// @desc    Get recommended courses for user
// @access  Private
router.get('/recommended', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;

  // Get user's enrolled courses to understand preferences
  const userEnrollments = await Enrollment.find({ userId: req.user.id })
    .populate('courseId', 'category level tags');

  // Extract user preferences
  const userCategories = userEnrollments.map(e => e.courseId.category);
  const userLevels = userEnrollments.map(e => e.courseId.level);
  const userTags = userEnrollments.flatMap(e => e.courseId.tags);

  // Find courses similar to user's preferences
  const query = {
    isActive: true,
    status: 'published',
    _id: { $nin: userEnrollments.map(e => e.courseId._id) }
  };

  if (userCategories.length > 0) {
    query.category = { $in: userCategories };
  }

  const courses = await Course.find(query)
    .sort({ 'stats.averageRating': -1, 'stats.totalEnrollments': -1 })
    .limit(parseInt(limit))
    .populate('createdBy', 'name email')
    .select('-chapters.topics.studyMaterials');

  res.json(courses);
}));

module.exports = router; 