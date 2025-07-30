const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Question = require('../models/Question');

// @route   GET /api/results
// @desc    Get exam results with filtering
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    examId,
    studentId,
    status = 'completed',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = { status };
  
  if (examId) query.examId = examId;
  if (studentId) query.userId = studentId;
  
  // Admin can see all results, students can only see their own
  if (req.user.role === 'student') {
    query.userId = req.user.id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const attempts = await ExamAttempt.find(query)
    .populate('examId', 'title examCode totalMarks passingScore')
    .populate('userId', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ExamAttempt.countDocuments(query);

  res.json({
    results: attempts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// @route   GET /api/results/:attemptId
// @desc    Get detailed result for a specific attempt
// @access  Private
router.get('/:attemptId', authenticateToken, asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  const attempt = await ExamAttempt.findById(attemptId)
    .populate('examId', 'title examCode totalMarks passingScore sections')
    .populate('userId', 'firstName lastName email');

  if (!attempt) {
    return res.status(404).json({ message: 'Result not found' });
  }

  // Check if user has access to this result
  if (req.user.role === 'student' && attempt.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Calculate detailed analytics
  const analytics = {
    totalQuestions: attempt.answers.length,
    correctAnswers: attempt.answers.filter(a => a.isCorrect).length,
    incorrectAnswers: attempt.answers.filter(a => !a.isCorrect && a.isAnswered).length,
    unansweredQuestions: attempt.answers.filter(a => !a.isAnswered).length,
    accuracy: ((attempt.answers.filter(a => a.isCorrect).length / attempt.answers.length) * 100).toFixed(2),
    timeSpent: attempt.duration,
    averageTimePerQuestion: attempt.duration / attempt.answers.length,
    sectionPerformance: []
  };

  // Calculate section-wise performance
  if (attempt.examId.sections) {
    attempt.examId.sections.forEach((section, index) => {
      const sectionAnswers = attempt.answers.filter(a => a.sectionIndex === index);
      const correctInSection = sectionAnswers.filter(a => a.isCorrect).length;
      
      analytics.sectionPerformance.push({
        sectionName: section.name,
        totalQuestions: sectionAnswers.length,
        correctAnswers: correctInSection,
        accuracy: sectionAnswers.length > 0 ? ((correctInSection / sectionAnswers.length) * 100).toFixed(2) : 0,
        timeSpent: sectionAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
      });
    });
  }

  res.json({
    result: attempt,
    analytics
  });
}));

// @route   POST /api/results
// @desc    Submit exam result
// @access  Private
router.post('/', [
  authenticateToken,
  body('examId').isMongoId().withMessage('Valid exam ID is required'),
  body('answers').isArray().withMessage('Answers array is required'),
  body('duration').isInt({ min: 0 }).withMessage('Valid duration is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { examId, answers, duration, proctoringData } = req.body;
  const userId = req.user.id;

  // Check if user has already attempted this exam
  const existingAttempt = await ExamAttempt.findOne({ examId, userId });
  if (existingAttempt) {
    return res.status(400).json({ message: 'You have already attempted this exam' });
  }

  // Get exam details
  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json({ message: 'Exam not found' });
  }

  // Calculate results
  let totalScore = 0;
  let correctAnswers = 0;
  let totalMarks = 0;

  answers.forEach(answer => {
    if (answer.isCorrect) {
      correctAnswers++;
      totalScore += answer.marks || 0;
    }
    totalMarks += answer.marks || 0;
  });

  const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  const isPassed = percentage >= exam.passingScore;

  // Create exam attempt
  const examAttempt = new ExamAttempt({
    examId,
    userId,
    answers,
    duration,
    totalScore,
    totalMarks,
    percentage,
    isPassed,
    status: 'completed',
    submittedAt: new Date(),
    proctoring: proctoringData || {}
  });

  await examAttempt.save();

  res.status(201).json({
    message: 'Exam result submitted successfully',
    result: examAttempt
  });
}));

// @route   GET /api/results/analytics/:examId
// @desc    Get analytics for a specific exam
// @access  Private (Admin/Instructor)
router.get('/analytics/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;

  // Check if user is admin or instructor
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const attempts = await ExamAttempt.find({ examId, status: 'completed' })
    .populate('userId', 'firstName lastName email');

  if (attempts.length === 0) {
    return res.json({
      examId,
      totalAttempts: 0,
      averageScore: 0,
      passRate: 0,
      scoreDistribution: {},
      timeAnalysis: {},
      questionAnalysis: []
    });
  }

  // Calculate analytics
  const totalAttempts = attempts.length;
  const averageScore = attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts;
  const passRate = (attempts.filter(a => a.isPassed).length / totalAttempts) * 100;

  // Score distribution
  const scoreDistribution = {
    '0-20': attempts.filter(a => a.percentage <= 20).length,
    '21-40': attempts.filter(a => a.percentage > 20 && a.percentage <= 40).length,
    '41-60': attempts.filter(a => a.percentage > 40 && a.percentage <= 60).length,
    '61-80': attempts.filter(a => a.percentage > 60 && a.percentage <= 80).length,
    '81-100': attempts.filter(a => a.percentage > 80).length
  };

  // Time analysis
  const completionTimes = attempts.map(a => a.duration);
  const averageTime = completionTimes.reduce((sum, time) => sum + time, 0) / totalAttempts;

  // Question analysis
  const questionAnalysis = [];
  if (attempts.length > 0) {
    const firstAttempt = attempts[0];
    firstAttempt.answers.forEach((answer, index) => {
      const correctCount = attempts.filter(a => a.answers[index]?.isCorrect).length;
      const difficulty = (correctCount / totalAttempts) * 100;
      
      questionAnalysis.push({
        questionIndex: index,
        correctCount,
        difficulty: difficulty.toFixed(2),
        averageTime: attempts.reduce((sum, a) => sum + (a.answers[index]?.timeSpent || 0), 0) / totalAttempts
      });
    });
  }

  res.json({
    examId,
    totalAttempts,
    averageScore: averageScore.toFixed(2),
    passRate: passRate.toFixed(2),
    scoreDistribution,
    timeAnalysis: {
      averageTime: Math.round(averageTime),
      fastestCompletion: Math.min(...completionTimes),
      slowestCompletion: Math.max(...completionTimes)
    },
    questionAnalysis
  });
}));

// @route   GET /api/results/student/:studentId
// @desc    Get all results for a specific student
// @access  Private (Admin/Instructor or own results)
router.get('/student/:studentId', authenticateToken, asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Check access permissions
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const attempts = await ExamAttempt.find({ userId: studentId, status: 'completed' })
    .populate('examId', 'title examCode totalMarks')
    .sort({ createdAt: -1 });

  const analytics = {
    totalAttempts: attempts.length,
    averageScore: attempts.length > 0 ? 
      attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length : 0,
    passRate: attempts.length > 0 ? 
      (attempts.filter(a => a.isPassed).length / attempts.length) * 100 : 0,
    totalTimeSpent: attempts.reduce((sum, a) => sum + a.duration, 0),
    recentPerformance: attempts.slice(0, 5).map(a => ({
      examTitle: a.examId.title,
      score: a.percentage,
      date: a.submittedAt
    }))
  };

  res.json({
    results: attempts,
    analytics
  });
}));

// @route   DELETE /api/results/:attemptId
// @desc    Delete a result (Admin only)
// @access  Private (Admin)
router.delete('/:attemptId', authenticateToken, asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const attempt = await ExamAttempt.findByIdAndDelete(attemptId);
  
  if (!attempt) {
    return res.status(404).json({ message: 'Result not found' });
  }

  res.json({ message: 'Result deleted successfully' });
}));

module.exports = router; 