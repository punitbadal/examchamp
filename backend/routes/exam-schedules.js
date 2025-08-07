const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const ExamSchedule = require('../models/ExamSchedule');
const Exam = require('../models/Exam');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/exam-schedules
// @desc    Get all exam schedules
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const schedules = await ExamSchedule.find()
    .populate('examId', 'title examCode description totalDuration totalMarks')
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.json({ schedules });
}));

// @route   POST /api/exam-schedules
// @desc    Create a new exam schedule
// @access  Private (Admin only)
router.post('/', authenticateToken, authorize('admin', 'super_admin'), [
  body('examId').isMongoId().withMessage('Valid exam ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('maxParticipants').optional().isInt({ min: 1 }),
  body('proctoringEnabled').optional().isBoolean(),
  body('instructions').optional().trim().isLength({ max: 1000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    examId,
    startDate,
    endDate,
    maxParticipants,
    proctoringEnabled = true,
    instructions = ''
  } = req.body;

  // Validate that end date is after start date
  if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ 
      error: 'End date must be after start date' 
    });
  }

  // Validate that start date is in the future
  if (new Date(startDate) <= new Date()) {
    return res.status(400).json({ 
      error: 'Start date must be in the future' 
    });
  }

  // Get exam details
  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  // Create schedule
  const schedule = new ExamSchedule({
    examId,
    title: exam.title,
    examCode: exam.examCode,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    duration: exam.totalDuration,
    maxAttempts: exam.maxAttempts,
    totalMarks: exam.totalMarks,
    passMarks: exam.passingScore,
    proctoringEnabled,
    instructions,
    subjects: exam.sections?.map(section => section.subjects).flat().filter(Boolean) || [],
    maxParticipants,
    createdBy: req.user.id
  });

  await schedule.save();

  // Populate references for response
  await schedule.populate('examId', 'title examCode description');
  await schedule.populate('createdBy', 'firstName lastName');

  res.status(201).json({
    message: 'Exam schedule created successfully',
    schedule
  });
}));

// @route   GET /api/exam-schedules/:id
// @desc    Get exam schedule by ID
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const schedule = await ExamSchedule.findById(req.params.id)
    .populate('examId', 'title examCode description totalDuration totalMarks')
    .populate('createdBy', 'firstName lastName');

  if (!schedule) {
    return res.status(404).json({ error: 'Exam schedule not found' });
  }

  res.json({ schedule });
}));

// @route   PUT /api/exam-schedules/:id
// @desc    Update exam schedule
// @access  Private (Admin only)
router.put('/:id', authenticateToken, authorize('admin', 'super_admin'), [
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('maxParticipants').optional().isInt({ min: 1 }),
  body('proctoringEnabled').optional().isBoolean(),
  body('instructions').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['draft', 'scheduled', 'active', 'completed'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const schedule = await ExamSchedule.findById(req.params.id);
  if (!schedule) {
    return res.status(404).json({ error: 'Exam schedule not found' });
  }

  // Validate date logic if dates are being updated
  if (req.body.startDate || req.body.endDate) {
    const startDate = req.body.startDate ? new Date(req.body.startDate) : schedule.startDate;
    const endDate = req.body.endDate ? new Date(req.body.endDate) : schedule.endDate;
    
    if (endDate <= startDate) {
      return res.status(400).json({ 
        error: 'End date must be after start date' 
      });
    }
  }

  // Update schedule
  Object.assign(schedule, req.body);
  await schedule.save();

  // Populate references for response
  await schedule.populate('examId', 'title examCode description');
  await schedule.populate('createdBy', 'firstName lastName');

  res.json({
    message: 'Exam schedule updated successfully',
    schedule
  });
}));

// @route   DELETE /api/exam-schedules/:id
// @desc    Delete exam schedule
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, authorize('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const schedule = await ExamSchedule.findById(req.params.id);
  if (!schedule) {
    return res.status(404).json({ error: 'Exam schedule not found' });
  }

  await ExamSchedule.findByIdAndDelete(req.params.id);

  res.json({ message: 'Exam schedule deleted successfully' });
}));

module.exports = router; 