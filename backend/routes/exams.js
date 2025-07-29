const express = require('express');
const multer = require('multer');
const Papa = require('papaparse');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// @route   POST /api/exams
// @desc    Create a new exam
// @access  Private (Admin only)
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('instructions').optional().trim().isLength({ max: 2000 }),
  body('totalMarks').isInt({ min: 1 }),
  body('duration').isInt({ min: 1 }),
  body('startTime').isISO8601(),
  body('endTime').isISO8601(),
  body('examType').optional().isIn(['practice', 'mock', 'final']),
  body('enrollment').optional().isIn(['open', 'invite_only', 'restricted']),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'mixed']),
  body('maxAttempts').optional().isInt({ min: 1 }),
  body('passingScore').optional().isInt({ min: 0 }),
  body('sections').optional().isArray(),
  body('settings').optional().isObject(),
  body('tags').optional().isArray(),
  body('category').optional().trim(),
  body('allowedUsers').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    description,
    instructions,
    totalMarks,
    duration,
    startTime,
    endTime,
    examType = 'mock',
    enrollment = 'open',
    difficulty = 'medium',
    maxAttempts = 1,
    passingScore,
    sections = [],
    settings = {},
    tags = [],
    category,
    allowedUsers = []
  } = req.body;

  // Validate time constraints
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  if (start <= now) {
    return res.status(400).json({ error: 'Start time must be in the future' });
  }

  if (end <= start) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  // Create exam
  const exam = new Exam({
    title,
    description,
    instructions,
    totalMarks,
    duration,
    startTime: start,
    endTime: end,
    examType,
    enrollment,
    difficulty,
    maxAttempts,
    passingScore,
    sections,
    settings,
    tags,
    category,
    allowedUsers,
    createdBy: req.user?.id || 'admin' // This would come from auth middleware
  });

  await exam.save();

  res.status(201).json({
    message: 'Exam created successfully',
    exam
  });
}));

// @route   GET /api/exams
// @desc    Get all exams (with filtering)
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    examType,
    category,
    difficulty,
    search,
    sortBy = 'startTime',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  // Apply filters
  if (status) query.status = status;
  if (examType) query.examType = examType;
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;

  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const exams = await Exam.find(query)
    .populate('createdBy', 'firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Exam.countDocuments(query);

  res.json({
    exams,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// @route   GET /api/exams/:id
// @desc    Get exam by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate('createdBy', 'firstName lastName')
    .populate('allowedUsers', 'firstName lastName email');

  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  res.json({ exam });
}));

// @route   PUT /api/exams/:id
// @desc    Update exam
// @access  Private (Admin only)
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('instructions').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(['draft', 'published', 'active', 'completed', 'archived']),
  body('settings').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  // Update exam
  Object.assign(exam, req.body);
  await exam.save();

  res.json({
    message: 'Exam updated successfully',
    exam
  });
}));

// @route   DELETE /api/exams/:id
// @desc    Delete exam
// @access  Private (Admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  // Check if exam has attempts
  const attempts = await ExamAttempt.find({ examId: req.params.id });
  if (attempts.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete exam with existing attempts. Archive instead.' 
    });
  }

  await Exam.findByIdAndDelete(req.params.id);
  await Question.deleteMany({ examId: req.params.id });

  res.json({ message: 'Exam deleted successfully' });
}));

// @route   POST /api/exams/:id/questions/upload
// @desc    Upload questions via CSV
// @access  Private (Admin only)
router.post('/:id/questions/upload', upload.single('csv'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' });
  }

  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  try {
    const csvData = req.file.buffer.toString();
    const { data, errors } = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true
    });

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'CSV parsing errors',
        errors: errors.slice(0, 5) // Limit error display
      });
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    const questions = [];
    const validationErrors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because of 0-indexing and header row

      try {
        // Validate required fields
        if (!row.QuestionText || !row.QuestionType || !row.CorrectAnswer) {
          validationErrors.push(`Row ${rowNumber}: Missing required fields`);
          continue;
        }

        // Parse question type
        const questionType = row.QuestionType.trim();
        if (!['MCQ_Single', 'MCQ_Multiple', 'TrueFalse', 'Integer', 'Numerical'].includes(questionType)) {
          validationErrors.push(`Row ${rowNumber}: Invalid question type`);
          continue;
        }

        // Parse options for MCQ questions
        let options = [];
        if (questionType.startsWith('MCQ')) {
          const optionFields = ['Option1', 'Option2', 'Option3', 'Option4'];
          options = optionFields
            .map(field => row[field])
            .filter(option => option && option.trim())
            .map((option, index) => ({
              text: option.trim(),
              order: index + 1,
              isCorrect: false
            }));

          if (options.length < 2) {
            validationErrors.push(`Row ${rowNumber}: MCQ questions must have at least 2 options`);
            continue;
          }
        }

        // Parse correct answer
        let correctAnswer;
        switch (questionType) {
          case 'MCQ_Single':
            correctAnswer = row.CorrectAnswer.trim();
            // Mark correct option
            const correctOption = options.find(opt => opt.text === correctAnswer);
            if (correctOption) {
              correctOption.isCorrect = true;
            } else {
              validationErrors.push(`Row ${rowNumber}: Correct answer not found in options`);
              continue;
            }
            break;

          case 'MCQ_Multiple':
            const correctAnswers = row.CorrectAnswer.split(',').map(ans => ans.trim());
            correctAnswer = correctAnswers;
            // Mark correct options
            correctAnswers.forEach(ans => {
              const option = options.find(opt => opt.text === ans);
              if (option) option.isCorrect = true;
            });
            break;

          case 'TrueFalse':
            correctAnswer = row.CorrectAnswer.toLowerCase() === 'true';
            options = [
              { text: 'True', order: 1, isCorrect: correctAnswer },
              { text: 'False', order: 2, isCorrect: !correctAnswer }
            ];
            break;

          case 'Integer':
            const intAnswer = parseInt(row.CorrectAnswer);
            if (isNaN(intAnswer) || intAnswer < 0) {
              validationErrors.push(`Row ${rowNumber}: Invalid integer answer`);
              continue;
            }
            correctAnswer = intAnswer;
            break;

          case 'Numerical':
            const numAnswer = parseFloat(row.CorrectAnswer);
            if (isNaN(numAnswer)) {
              validationErrors.push(`Row ${rowNumber}: Invalid numerical answer`);
              continue;
            }
            correctAnswer = numAnswer;
            break;
        }

        // Parse marks
        const marks = parseFloat(row.MarksPerQuestion) || 1;
        const negativeMarks = parseFloat(row.NegativeMarksPerQuestion) || 0;

        const question = new Question({
          examId: exam._id,
          sectionId: row.SectionId || 'default',
          questionNumber: parseInt(row.QuestionNumber) || i + 1,
          questionText: row.QuestionText.trim(),
          questionType,
          options,
          correctAnswer,
          marks,
          negativeMarks,
          explanation: row.Explanation?.trim(),
          difficulty: row.Difficulty?.trim() || 'medium',
          topic: row.Topic?.trim(),
          subject: row.Subject?.trim(),
          tags: row.Tags?.split(',').map(tag => tag.trim()).filter(tag => tag) || []
        });

        // Validate question
        const questionValidationErrors = question.validateQuestion();
        if (questionValidationErrors.length > 0) {
          validationErrors.push(`Row ${rowNumber}: ${questionValidationErrors.join(', ')}`);
          continue;
        }

        questions.push(question);
      } catch (error) {
        validationErrors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'CSV validation errors',
        errors: validationErrors.slice(0, 10) // Limit error display
      });
    }

    // Save questions
    await Question.insertMany(questions);

    res.json({
      message: 'Questions uploaded successfully',
      uploaded: questions.length,
      totalQuestions: await Question.countDocuments({ examId: exam._id })
    });

  } catch (error) {
    res.status(500).json({ error: 'Error processing CSV file' });
  }
}));

// @route   GET /api/exams/:id/questions
// @desc    Get questions for an exam
// @access  Private
router.get('/:id/questions', asyncHandler(async (req, res) => {
  const { sectionId, questionType, difficulty } = req.query;
  
  const query = { examId: req.params.id };
  if (sectionId) query.sectionId = sectionId;
  if (questionType) query.questionType = questionType;
  if (difficulty) query.difficulty = difficulty;

  const questions = await Question.find(query)
    .select('-correctAnswer') // Don't send correct answers to students
    .sort({ questionNumber: 1 });

  res.json({ questions });
}));

// @route   GET /api/exams/:id/attempts
// @desc    Get exam attempts (Admin only)
// @access  Private (Admin only)
router.get('/:id/attempts', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  const query = { examId: req.params.id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const attempts = await ExamAttempt.find(query)
    .populate('userId', 'firstName lastName email studentId')
    .sort({ submittedAt: -1 })
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

// @route   GET /api/exams/:id/leaderboard
// @desc    Get exam leaderboard
// @access  Private
router.get('/:id/leaderboard', asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const attempts = await ExamAttempt.find({
    examId: req.params.id,
    status: { $in: ['completed', 'submitted'] }
  })
    .populate('userId', 'firstName lastName studentId')
    .sort({ totalScore: -1, submittedAt: 1 })
    .limit(parseInt(limit));

  const leaderboard = attempts.map((attempt, index) => ({
    rank: index + 1,
    user: attempt.userId,
    score: attempt.totalScore,
    percentage: attempt.percentage,
    timeSpent: attempt.timeSpent,
    submittedAt: attempt.submittedAt
  }));

  res.json({ leaderboard });
}));

module.exports = router; 