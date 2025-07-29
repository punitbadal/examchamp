const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');
const PracticeTest = require('../models/PracticeTest');
const PracticeTestAttempt = require('../models/PracticeTestAttempt');
const Question = require('../models/Question');
const Enrollment = require('../models/Enrollment');

const router = express.Router();

// @route   GET /api/practice-tests
// @desc    Get all practice tests with filtering
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    type,
    level,
    courseId,
    chapterId,
    topicId,
    status = 'published',
    search,
    page = 1,
    limit = 12,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = { isActive: true, status };
  
  if (type) query.type = type;
  if (level) query.level = level;
  if (courseId) query.courseId = courseId;
  if (chapterId) query.chapterId = chapterId;
  if (topicId) query.topicId = topicId;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const practiceTests = await PracticeTest.find(query)
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await PracticeTest.countDocuments(query);

  res.json({
    practiceTests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// @route   GET /api/practice-tests/:id
// @desc    Get practice test details
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const practiceTest = await PracticeTest.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!practiceTest) {
    return res.status(404).json({ error: 'Practice test not found' });
  }

  // Get user's attempt history if authenticated
  let userAttempts = null;
  if (req.user) {
    userAttempts = await PracticeTestAttempt.find({
      userId: req.user.id,
      practiceTestId: practiceTest._id
    }).sort({ startedAt: -1 });
  }

  res.json({
    practiceTest,
    userAttempts
  });
}));

// @route   POST /api/practice-tests
// @desc    Create a new practice test
// @access  Private (Admin/Instructor)
router.post('/', [
  authenticateToken,
  authorize(['admin', 'instructor']),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('type').isIn(['topic_quiz', 'chapter_test', 'subject_test', 'mock_exam', 'custom']),
  body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  body('settings.questionCount').isInt({ min: 1, max: 200 }),
  body('settings.timeLimit').isInt({ min: 5, max: 480 }),
  body('settings.passingScore').optional().isFloat({ min: 0, max: 100 }),
  body('settings.maxAttempts').optional().isInt({ min: 1 }),
  body('access.isPaid').optional().isBoolean(),
  body('access.price').optional().isFloat({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const practiceTestData = {
    ...req.body,
    createdBy: req.user.id
  };

  const practiceTest = new PracticeTest(practiceTestData);
  await practiceTest.save();

  res.status(201).json({
    message: 'Practice test created successfully',
    practiceTest
  });
}));

// @route   POST /api/practice-tests/:id/start
// @desc    Start a practice test
// @access  Private
router.post('/:id/start', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const practiceTest = await PracticeTest.findById(req.params.id);
  if (!practiceTest) {
    return res.status(404).json({ error: 'Practice test not found' });
  }

  // Check if user can attempt the test
  const canAttempt = await practiceTest.canUserAttempt(req.user.id);
  if (!canAttempt.canAttempt) {
    return res.status(400).json({ error: canAttempt.reason });
  }

  // Check enrollment requirement
  if (practiceTest.access.enrollmentRequired && practiceTest.courseId) {
    const enrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId: practiceTest.courseId
    });
    
    if (!enrollment) {
      return res.status(400).json({ error: 'Course enrollment required to attempt this test' });
    }
  }

  // Get user's attempt number
  const attemptCount = await PracticeTestAttempt.countDocuments({
    userId: req.user.id,
    practiceTestId: practiceTest._id
  });

  const attemptNumber = attemptCount + 1;

  // Generate questions for the test
  const questions = await practiceTest.generateQuestions();
  
  if (questions.length < practiceTest.settings.questionCount) {
    return res.status(400).json({ 
      error: `Not enough questions available. Required: ${practiceTest.settings.questionCount}, Available: ${questions.length}` 
    });
  }

  // Create test attempt
  const attempt = new PracticeTestAttempt({
    userId: req.user.id,
    practiceTestId: practiceTest._id,
    attemptNumber,
    timeLimit: practiceTest.settings.timeLimit,
    totalMarks: practiceTest.totalMarks,
    questions: questions.map(q => q._id),
    responses: questions.map(q => ({
      questionId: q._id
    }))
  });

  await attempt.save();

  // Update test statistics
  await practiceTest.updateStats();

  res.status(201).json({
    message: 'Practice test started successfully',
    attempt: {
      _id: attempt._id,
      attemptNumber: attempt.attemptNumber,
      timeLimit: attempt.timeLimit,
      totalMarks: attempt.totalMarks,
      questions: questions.map(q => ({
        _id: q._id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        marksPerQuestion: q.marksPerQuestion,
        imageUrl: q.imageUrl
      }))
    }
  });
}));

// @route   GET /api/practice-tests/:id/attempt/:attemptId
// @desc    Get practice test attempt details
// @access  Private
router.get('/:id/attempt/:attemptId', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const attempt = await PracticeTestAttempt.findById(req.params.attemptId)
    .populate('questions')
    .populate('practiceTestId', 'title settings');

  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.userId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to view this attempt' });
  }

  res.json({
    attempt: {
      _id: attempt._id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      timeLimit: attempt.timeLimit,
      timeTaken: attempt.timeTaken,
      timeRemaining: attempt.timeRemaining,
      currentQuestionIndex: attempt.currentQuestionIndex,
      questions: attempt.questions.map(q => ({
        _id: q._id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        marksPerQuestion: q.marksPerQuestion,
        imageUrl: q.imageUrl
      })),
      responses: attempt.responses.map(r => ({
        questionId: r.questionId,
        userAnswer: r.userAnswer,
        isAnswered: r.isAnswered,
        isMarkedForReview: r.isMarkedForReview,
        timeSpent: r.timeSpent
      }))
    }
  });
}));

// @route   PUT /api/practice-tests/:id/attempt/:attemptId/answer
// @desc    Submit answer for a question
// @access  Private
router.put('/:id/attempt/:attemptId/answer', [
  authenticateToken,
  body('questionIndex').isInt({ min: 0 }),
  body('answer').notEmpty(),
  body('timeSpent').optional().isFloat({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { questionIndex, answer, timeSpent = 0 } = req.body;

  const attempt = await PracticeTestAttempt.findById(req.params.attemptId);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.userId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to modify this attempt' });
  }

  if (attempt.status !== 'in_progress') {
    return res.status(400).json({ error: 'Cannot modify completed attempt' });
  }

  await attempt.submitAnswer(questionIndex, answer, timeSpent);

  res.json({
    message: 'Answer submitted successfully',
    attempt: {
      currentQuestionIndex: attempt.currentQuestionIndex,
      responses: attempt.responses
    }
  });
}));

// @route   PUT /api/practice-tests/:id/attempt/:attemptId/mark-review
// @desc    Mark question for review
// @access  Private
router.put('/:id/attempt/:attemptId/mark-review', [
  authenticateToken,
  body('questionIndex').isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { questionIndex } = req.body;

  const attempt = await PracticeTestAttempt.findById(req.params.attemptId);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.userId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to modify this attempt' });
  }

  await attempt.markForReview(questionIndex);

  res.json({
    message: 'Question marked for review',
    markedForReview: attempt.responses[questionIndex].isMarkedForReview
  });
}));

// @route   POST /api/practice-tests/:id/attempt/:attemptId/complete
// @desc    Complete practice test
// @access  Private
router.post('/:id/attempt/:attemptId/complete', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const attempt = await PracticeTestAttempt.findById(req.params.attemptId)
    .populate('questions')
    .populate('practiceTestId', 'title settings');

  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.userId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to complete this attempt' });
  }

  if (attempt.status !== 'in_progress') {
    return res.status(400).json({ error: 'Attempt is already completed' });
  }

  await attempt.completeTest();

  // Get performance summary
  const performance = attempt.getPerformanceSummary();
  const questionAnalysis = attempt.getQuestionAnalysis();

  res.json({
    message: 'Practice test completed successfully',
    performance,
    questionAnalysis,
    attempt: {
      _id: attempt._id,
      status: attempt.status,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      accuracy: attempt.accuracy,
      timeTaken: attempt.timeTaken
    }
  });
}));

// @route   GET /api/practice-tests/:id/results
// @desc    Get practice test results and analytics
// @access  Private
router.get('/:id/results', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const practiceTest = await PracticeTest.findById(req.params.id);
  if (!practiceTest) {
    return res.status(404).json({ error: 'Practice test not found' });
  }

  // Get user's attempts
  const userAttempts = await PracticeTestAttempt.find({
    userId: req.user.id,
    practiceTestId: practiceTest._id
  }).sort({ startedAt: -1 });

  // Get test statistics
  const testStats = await PracticeTestAttempt.getTestStats(practiceTest._id);

  res.json({
    practiceTest: {
      _id: practiceTest._id,
      title: practiceTest.title,
      type: practiceTest.type,
      level: practiceTest.level,
      settings: practiceTest.settings
    },
    userAttempts,
    testStats
  });
}));

// @route   GET /api/practice-tests/user/history
// @desc    Get user's practice test history
// @access  Private
router.get('/user/history', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const history = await PracticeTestAttempt.getUserHistory(req.user.id, parseInt(limit));

  res.json(history);
}));

// @route   GET /api/practice-tests/recommended
// @desc    Get recommended practice tests for user
// @access  Private
router.get('/recommended', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;

  // Get user's enrolled courses
  const userEnrollments = await Enrollment.find({ userId: req.user.id })
    .populate('courseId', 'category level');

  // Get user's attempted tests
  const userAttempts = await PracticeTestAttempt.find({ userId: req.user.id })
    .populate('practiceTestId', 'type level courseId');

  // Find tests based on user's course enrollments
  const userCourseIds = userEnrollments.map(e => e.courseId._id);
  const attemptedTestIds = userAttempts.map(a => a.practiceTestId._id);

  const query = {
    isActive: true,
    status: 'published',
    _id: { $nin: attemptedTestIds }
  };

  if (userCourseIds.length > 0) {
    query.courseId = { $in: userCourseIds };
  }

  const recommendedTests = await PracticeTest.find(query)
    .sort({ 'stats.averageScore': -1, 'stats.totalAttempts': -1 })
    .limit(parseInt(limit))
    .populate('createdBy', 'name email');

  res.json(recommendedTests);
}));

// @route   POST /api/practice-tests/:id/feedback
// @desc    Submit feedback for practice test
// @access  Private
router.post('/:id/feedback', [
  authenticateToken,
  body('attemptId').isMongoId(),
  body('difficulty').optional().isIn(['too_easy', 'easy', 'just_right', 'hard', 'too_hard']),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comments').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { attemptId, difficulty, rating, comments } = req.body;

  const attempt = await PracticeTestAttempt.findById(attemptId);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.userId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to submit feedback for this attempt' });
  }

  attempt.feedback = {
    difficulty,
    rating,
    comments,
    submittedAt: new Date()
  };

  await attempt.save();

  res.json({
    message: 'Feedback submitted successfully'
  });
}));

module.exports = router; 