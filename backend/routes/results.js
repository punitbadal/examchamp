const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const ExamAttempt = require('../models/ExamAttempt');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

const router = express.Router();

// @route   POST /api/results/start-attempt
// @desc    Start a new exam attempt
// @access  Private
router.post('/start-attempt', [
  body('examId').isMongoId(),
  body('userId').isMongoId()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { examId, userId } = req.body;

  // Check if exam exists and is active
  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  const now = new Date();
  if (now < exam.startTime) {
    return res.status(400).json({ error: 'Exam has not started yet' });
  }

  if (now > exam.endTime) {
    return res.status(400).json({ error: 'Exam has ended' });
  }

  // Check if user can access exam
  if (!exam.canUserAccess(userId)) {
    return res.status(403).json({ error: 'Access denied to this exam' });
  }

  // Check existing attempts
  const existingAttempts = await ExamAttempt.find({ userId, examId });
  if (existingAttempts.length >= exam.maxAttempts) {
    return res.status(400).json({ error: 'Maximum attempts reached for this exam' });
  }

  // Check if user has an active attempt
  const activeAttempt = existingAttempts.find(attempt => 
    ['started', 'in_progress'].includes(attempt.status)
  );

  if (activeAttempt) {
    return res.status(400).json({ 
      error: 'You already have an active attempt for this exam',
      attemptId: activeAttempt._id
    });
  }

  // Get questions for the exam
  const questions = await Question.find({ examId }).sort({ questionNumber: 1 });
  if (questions.length === 0) {
    return res.status(400).json({ error: 'No questions found for this exam' });
  }

  // Calculate max score
  const maxScore = questions.reduce((total, question) => total + question.marks, 0);

  // Create new attempt
  const attempt = new ExamAttempt({
    userId,
    examId,
    status: 'started',
    startTime: new Date(),
    maxScore,
    timeRemaining: exam.duration * 60, // Convert to seconds
    answers: questions.map(question => ({
      questionId: question._id,
      answer: null,
      timeSpent: 0,
      isMarkedForReview: false
    })),
    sections: exam.sections.map(section => ({
      sectionId: section.name,
      maxScore: questions
        .filter(q => q.sectionId === section.name)
        .reduce((total, q) => total + q.marks, 0),
      totalQuestions: section.questionCount,
      questionsAnswered: 0,
      timeSpent: 0
    }))
  });

  await attempt.save();

  res.status(201).json({
    message: 'Exam attempt started successfully',
    attempt: {
      id: attempt._id,
      startTime: attempt.startTime,
      timeRemaining: attempt.timeRemaining,
      totalQuestions: questions.length,
      sections: attempt.sections
    }
  });
}));

// @route   PUT /api/results/:attemptId/answer
// @desc    Submit an answer for a question
// @access  Private
router.put('/:attemptId/answer', [
  body('questionId').isMongoId(),
  body('answer').notEmpty(),
  body('timeSpent').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { questionId, answer, timeSpent = 0 } = req.body;
  const attemptId = req.params.attemptId;

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  // Check if attempt is still valid
  if (!attempt.isValid()) {
    return res.status(400).json({ error: 'Attempt is no longer valid' });
  }

  // Get the question to calculate score
  const question = await Question.findById(questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  // Calculate score
  const score = question.calculateScore(answer);
  const isCorrect = question.isCorrect(answer);

  // Update answer
  attempt.updateAnswer(questionId, answer, timeSpent);

  // Update the answer object with calculated values
  const answerObj = attempt.answers.find(a => a.questionId.toString() === questionId.toString());
  if (answerObj) {
    answerObj.score = score;
    answerObj.isCorrect = isCorrect;
  }

  // Update attempt status
  if (attempt.status === 'started') {
    attempt.status = 'in_progress';
  }

  await attempt.save();

  res.json({
    message: 'Answer submitted successfully',
    score,
    isCorrect
  });
}));

// @route   PUT /api/results/:attemptId/mark-review
// @desc    Mark question for review
// @access  Private
router.put('/:attemptId/mark-review', [
  body('questionId').isMongoId(),
  body('isMarked').isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { questionId, isMarked } = req.body;
  const attemptId = req.params.attemptId;

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  attempt.markForReview(questionId, isMarked);
  await attempt.save();

  res.json({ message: 'Question review status updated' });
}));

// @route   POST /api/results/:attemptId/submit
// @desc    Submit exam attempt
// @access  Private
router.post('/:attemptId/submit', asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.status === 'submitted' || attempt.status === 'completed') {
    return res.status(400).json({ error: 'Attempt already submitted' });
  }

  // Calculate final score
  const questions = await Question.find({ examId: attempt.examId });
  let totalScore = 0;

  for (const answer of attempt.answers) {
    const question = questions.find(q => q._id.toString() === answer.questionId.toString());
    if (question && answer.answer !== null && answer.answer !== undefined) {
      const score = question.calculateScore(answer.answer);
      answer.score = score;
      answer.isCorrect = question.isCorrect(answer.answer);
      totalScore += score;
    }
  }

  // Update attempt
  attempt.totalScore = totalScore;
  attempt.percentage = attempt.maxScore > 0 ? Math.round((totalScore / attempt.maxScore) * 100) : 0;
  attempt.status = 'submitted';
  attempt.submittedAt = new Date();
  attempt.endTime = new Date();

  await attempt.save();

  // Calculate rank and percentile
  const allAttempts = await ExamAttempt.find({
    examId: attempt.examId,
    status: { $in: ['submitted', 'completed'] }
  }).sort({ totalScore: -1, submittedAt: 1 });

  const rank = allAttempts.findIndex(a => a._id.toString() === attemptId.toString()) + 1;
  const percentile = Math.round(((allAttempts.length - rank + 1) / allAttempts.length) * 100);

  attempt.rank = rank;
  attempt.percentile = percentile;
  await attempt.save();

  res.json({
    message: 'Exam submitted successfully',
    result: {
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      rank,
      percentile,
      timeSpent: attempt.timeSpent,
      submittedAt: attempt.submittedAt
    }
  });
}));

// @route   GET /api/results/:attemptId
// @desc    Get attempt details
// @access  Private
router.get('/:attemptId', asyncHandler(async (req, res) => {
  const attempt = await ExamAttempt.findById(req.params.attemptId)
    .populate('userId', 'firstName lastName email studentId')
    .populate('examId', 'title duration totalMarks');

  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  // Get questions with correct answers for completed attempts
  let questions = [];
  if (attempt.status === 'submitted' || attempt.status === 'completed') {
    questions = await Question.find({ examId: attempt.examId })
      .sort({ questionNumber: 1 });
  }

  res.json({
    attempt,
    questions: questions.map(q => q.getPreview()),
    summary: attempt.getSummary()
  });
}));

// @route   GET /api/results/user/:userId
// @desc    Get user's exam attempts
// @access  Private
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { userId: req.params.userId };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const attempts = await ExamAttempt.find(query)
    .populate('examId', 'title examType category')
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ExamAttempt.countDocuments(query);

  res.json({
    attempts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// @route   GET /api/results/analytics/:examId
// @desc    Get exam analytics (Admin only)
// @access  Private (Admin only)
router.get('/analytics/:examId', asyncHandler(async (req, res) => {
  const examId = req.params.examId;

  const attempts = await ExamAttempt.find({
    examId,
    status: { $in: ['submitted', 'completed'] }
  }).populate('userId', 'firstName lastName studentId');

  if (attempts.length === 0) {
    return res.json({
      totalAttempts: 0,
      averageScore: 0,
      averagePercentage: 0,
      highestScore: 0,
      lowestScore: 0,
      scoreDistribution: {},
      timeDistribution: {},
      sectionAnalytics: {}
    });
  }

  const scores = attempts.map(a => a.totalScore);
  const percentages = attempts.map(a => a.percentage);
  const timeSpent = attempts.map(a => a.timeSpent);

  const analytics = {
    totalAttempts: attempts.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    averagePercentage: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    averageTimeSpent: Math.round(timeSpent.reduce((a, b) => a + b, 0) / timeSpent.length),
    scoreDistribution: {
      '90-100%': percentages.filter(p => p >= 90).length,
      '80-89%': percentages.filter(p => p >= 80 && p < 90).length,
      '70-79%': percentages.filter(p => p >= 70 && p < 80).length,
      '60-69%': percentages.filter(p => p >= 60 && p < 70).length,
      '50-59%': percentages.filter(p => p >= 50 && p < 60).length,
      'Below 50%': percentages.filter(p => p < 50).length
    },
    timeDistribution: {
      '0-30 min': timeSpent.filter(t => t <= 1800).length,
      '30-60 min': timeSpent.filter(t => t > 1800 && t <= 3600).length,
      '60-90 min': timeSpent.filter(t => t > 3600 && t <= 5400).length,
      '90+ min': timeSpent.filter(t => t > 5400).length
    }
  };

  res.json(analytics);
}));

module.exports = router; 