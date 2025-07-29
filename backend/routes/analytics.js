const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Question = require('../models/Question');
const User = require('../models/User');
const AnalyticsService = require('../services/analyticsService');
const { authenticateToken } = require('../middleware/auth');

// Get overview analytics
router.get('/overview', authenticateToken, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const stats = await AnalyticsService.getOverviewStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overview analytics', error: error.message });
  }
}));

// Get exam analytics
router.get('/exam/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const analytics = await AnalyticsService.getExamAnalytics(examId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam analytics', error: error.message });
  }
}));

// Get student analytics
router.get('/student/:studentId', authenticateToken, asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { examId } = req.query;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const analytics = await AnalyticsService.getStudentAnalytics(studentId, examId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student analytics', error: error.message });
  }
}));

// Get question analytics
router.get('/question/:questionId', authenticateToken, asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const analytics = await AnalyticsService.getQuestionAnalytics(questionId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching question analytics', error: error.message });
  }
}));

// Get predictive insights
router.get('/predictive/:studentId/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { studentId, examId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const insights = await AnalyticsService.generatePredictiveInsights(studentId, examId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: 'Error generating predictive insights', error: error.message });
  }
}));

// Generate comprehensive report
router.get('/report/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const { studentId } = req.query;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const report = await AnalyticsService.generateComprehensiveReport(examId, studentId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
}));

// Get performance trends
router.get('/trends/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const { period = '7d' } = req.query;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const trends = await AnalyticsService.getPerformanceTrends(examId, period);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trends', error: error.message });
  }
}));

// Get comparative analytics
router.get('/comparative/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const { compareWith } = req.query;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const comparative = await AnalyticsService.getComparativeAnalytics(examId, compareWith);
    res.json(comparative);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comparative analytics', error: error.message });
  }
}));

// Get section-wise analytics
router.get('/sections/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const sectionAnalytics = await AnalyticsService.getSectionAnalytics(examId);
    res.json(sectionAnalytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching section analytics', error: error.message });
  }
}));

// Get difficulty analysis
router.get('/difficulty/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const difficultyAnalysis = await AnalyticsService.getDifficultyAnalysis(examId);
    res.json(difficultyAnalysis);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching difficulty analysis', error: error.message });
  }
}));

// Get time analysis
router.get('/time/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const timeAnalysis = await AnalyticsService.getTimeAnalysis(examId);
    res.json(timeAnalysis);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching time analysis', error: error.message });
  }
}));

// Get proctoring analytics
router.get('/proctoring/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const proctoringAnalytics = await AnalyticsService.getProctoringAnalytics(examId);
    res.json(proctoringAnalytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching proctoring analytics', error: error.message });
  }
}));

// Export analytics data
router.post('/export', authenticateToken, [
  body('examId').isMongoId().withMessage('Valid exam ID required'),
  body('format').isIn(['csv', 'pdf', 'excel']).withMessage('Valid export format required'),
  body('filters').optional().isObject().withMessage('Filters must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { examId, format, filters } = req.body;

  try {
    const exportData = await AnalyticsService.exportAnalytics(examId, format, filters);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${examId}.${format}`);
    res.send(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting analytics', error: error.message });
  }
}));

// Get real-time analytics
router.get('/realtime/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const realtimeData = await AnalyticsService.getRealTimeAnalytics(examId);
    res.json(realtimeData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching real-time analytics', error: error.message });
  }
}));

// Get custom analytics
router.post('/custom', authenticateToken, [
  body('examId').isMongoId().withMessage('Valid exam ID required'),
  body('metrics').isArray().withMessage('Metrics must be an array'),
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('groupBy').optional().isString().withMessage('Group by must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { examId, metrics, filters, groupBy } = req.body;

  try {
    const customAnalytics = await AnalyticsService.getCustomAnalytics(examId, metrics, filters, groupBy);
    res.json(customAnalytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching custom analytics', error: error.message });
  }
}));

// Get analytics dashboard data
router.get('/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const dashboardData = await AnalyticsService.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
}));

// Get analytics insights
router.get('/insights/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const insights = await AnalyticsService.getAnalyticsInsights(examId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching insights', error: error.message });
  }
}));

// Get analytics recommendations
router.get('/recommendations/:examId', authenticateToken, asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const recommendations = await AnalyticsService.getAnalyticsRecommendations(examId);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
  }
}));

// Clear analytics cache
router.delete('/cache', authenticateToken, asyncHandler(async (req, res) => {
  try {
    AnalyticsService.clearCache();
    res.json({ message: 'Analytics cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cache', error: error.message });
  }
}));

module.exports = router; 