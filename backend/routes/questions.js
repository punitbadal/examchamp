const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Question = require('../models/Question');

const router = express.Router();

// @route   GET /api/questions
// @desc    Get questions with filtering
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const {
    examId,
    sectionId,
    questionType,
    difficulty,
    topic,
    subject,
    page = 1,
    limit = 20
  } = req.query;

  const query = {};
  if (examId) query.examId = examId;
  if (sectionId) query.sectionId = sectionId;
  if (questionType) query.questionType = questionType;
  if (difficulty) query.difficulty = difficulty;
  if (topic) query.topic = topic;
  if (subject) query.subject = subject;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const questions = await Question.find(query)
    .select('-correctAnswer') // Don't send correct answers
    .sort({ questionNumber: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Question.countDocuments(query);

  res.json({
    questions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// @route   GET /api/questions/:id
// @desc    Get question by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .select('-correctAnswer'); // Don't send correct answer

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  res.json({ question });
}));

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private (Admin only)
router.post('/', [
  body('examId').isMongoId(),
  body('sectionId').trim().notEmpty(),
  body('questionNumber').isInt({ min: 1 }),
  body('questionText').trim().notEmpty(),
  body('questionType').isIn(['MCQ_Single', 'MCQ_Multiple', 'TrueFalse', 'Integer', 'Numerical']),
  body('correctAnswer').notEmpty(),
  body('marks').isFloat({ min: 0 }),
  body('negativeMarks').optional().isFloat({ min: 0 }),
  body('options').optional().isArray(),
  body('explanation').optional().trim(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('topic').optional().trim(),
  body('subject').optional().trim(),
  body('tags').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const question = new Question(req.body);
  
  // Validate question
  const validationErrors = question.validateQuestion();
  if (validationErrors.length > 0) {
    return res.status(400).json({ 
      error: 'Question validation failed',
      errors: validationErrors 
    });
  }

  await question.save();

  res.status(201).json({
    message: 'Question created successfully',
    question: question.getPreview()
  });
}));

// @route   PUT /api/questions/:id
// @desc    Update question
// @access  Private (Admin only)
router.put('/:id', [
  body('questionText').optional().trim().notEmpty(),
  body('questionType').optional().isIn(['MCQ_Single', 'MCQ_Multiple', 'TrueFalse', 'Integer', 'Numerical']),
  body('correctAnswer').optional().notEmpty(),
  body('marks').optional().isFloat({ min: 0 }),
  body('negativeMarks').optional().isFloat({ min: 0 }),
  body('options').optional().isArray(),
  body('explanation').optional().trim(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('topic').optional().trim(),
  body('subject').optional().trim(),
  body('tags').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const question = await Question.findById(req.params.id);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  // Update question
  Object.assign(question, req.body);
  
  // Validate updated question
  const validationErrors = question.validateQuestion();
  if (validationErrors.length > 0) {
    return res.status(400).json({ 
      error: 'Question validation failed',
      errors: validationErrors 
    });
  }

  await question.save();

  res.json({
    message: 'Question updated successfully',
    question: question.getPreview()
  });
}));

// @route   DELETE /api/questions/:id
// @desc    Delete question
// @access  Private (Admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  await Question.findByIdAndDelete(req.params.id);

  res.json({ message: 'Question deleted successfully' });
}));

// @route   POST /api/questions/bulk
// @desc    Create multiple questions
// @access  Private (Admin only)
router.post('/bulk', [
  body('questions').isArray({ min: 1 }),
  body('questions.*.examId').isMongoId(),
  body('questions.*.sectionId').trim().notEmpty(),
  body('questions.*.questionText').trim().notEmpty(),
  body('questions.*.questionType').isIn(['MCQ_Single', 'MCQ_Multiple', 'TrueFalse', 'Integer', 'Numerical']),
  body('questions.*.correctAnswer').notEmpty(),
  body('questions.*.marks').isFloat({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { questions } = req.body;
  const createdQuestions = [];
  const bulkErrors = [];

  for (let i = 0; i < questions.length; i++) {
    try {
      const questionData = questions[i];
      const question = new Question(questionData);
      
      // Validate question
      const validationErrors = question.validateQuestion();
      if (validationErrors.length > 0) {
        bulkErrors.push(`Question ${i + 1}: ${validationErrors.join(', ')}`);
        continue;
      }

      await question.save();
      createdQuestions.push(question.getPreview());
    } catch (error) {
      bulkErrors.push(`Question ${i + 1}: ${error.message}`);
    }
  }

  res.status(201).json({
    message: 'Bulk question creation completed',
    created: createdQuestions.length,
    errors: bulkErrors.length > 0 ? bulkErrors : undefined,
    questions: createdQuestions
  });
}));

// @route   GET /api/questions/stats
// @desc    Get question statistics
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const { examId } = req.query;
  
  const query = {};
  if (examId) query.examId = examId;

  const stats = await Question.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        totalMarks: { $sum: '$marks' },
        avgDifficulty: { $avg: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, { $cond: [{ $eq: ['$difficulty', 'medium'] }, 2, 3] }] } },
        byType: {
          $push: '$questionType'
        },
        byDifficulty: {
          $push: '$difficulty'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return res.json({
      totalQuestions: 0,
      totalMarks: 0,
      avgDifficulty: 0,
      byType: {},
      byDifficulty: {}
    });
  }

  const stat = stats[0];
  
  // Count by type
  const byType = stat.byType.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Count by difficulty
  const byDifficulty = stat.byDifficulty.reduce((acc, diff) => {
    acc[diff] = (acc[diff] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalQuestions: stat.totalQuestions,
    totalMarks: stat.totalMarks,
    avgDifficulty: Math.round(stat.avgDifficulty * 10) / 10,
    byType,
    byDifficulty
  });
}));

module.exports = router; 