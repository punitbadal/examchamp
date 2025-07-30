const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Exam = require('../models/Exam');
const PracticeTest = require('../models/PracticeTest');
const StudyMaterial = require('../models/StudyMaterial');

// @route   GET /api/payments
// @desc    Get payment history
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    status,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};
  
  if (status) query.status = status;
  
  // Users can only see their own payments, admins can see all
  if (req.user.role === 'student') {
    query.userId = req.user.id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const payments = await Payment.find(query)
    .populate('userId', 'firstName lastName email')
    .populate('examId', 'title examCode')
    .populate('practiceTestId', 'title')
    .populate('studyMaterialId', 'title')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  res.json({
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// @route   POST /api/payments/create-payment
// @desc    Create a new payment
// @access  Private
router.post('/create-payment', [
  authenticateToken,
  body('type').isIn(['exam', 'practice_test', 'study_material', 'subscription']).withMessage('Valid payment type is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('currency').optional().isIn(['INR', 'USD', 'EUR']).withMessage('Valid currency is required'),
  body('examId').optional().isMongoId().withMessage('Valid exam ID is required'),
  body('practiceTestId').optional().isMongoId().withMessage('Valid practice test ID is required'),
  body('studyMaterialId').optional().isMongoId().withMessage('Valid study material ID is required'),
  body('subscriptionType').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Valid subscription type is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    type,
    amount,
    currency = 'INR',
    examId,
    practiceTestId,
    studyMaterialId,
    subscriptionType,
    paymentMethod = 'online'
  } = req.body;

  const userId = req.user.id;

  // Validate based on payment type
  if (type === 'exam' && !examId) {
    return res.status(400).json({ message: 'Exam ID is required for exam payments' });
  }
  if (type === 'practice_test' && !practiceTestId) {
    return res.status(400).json({ message: 'Practice test ID is required for practice test payments' });
  }
  if (type === 'study_material' && !studyMaterialId) {
    return res.status(400).json({ message: 'Study material ID is required for study material payments' });
  }
  if (type === 'subscription' && !subscriptionType) {
    return res.status(400).json({ message: 'Subscription type is required for subscription payments' });
  }

  // Check if user already has access
  if (type === 'exam') {
    const existingPayment = await Payment.findOne({
      userId,
      examId,
      status: 'completed'
    });
    if (existingPayment) {
      return res.status(400).json({ message: 'You already have access to this exam' });
    }
  }

  if (type === 'practice_test') {
    const existingPayment = await Payment.findOne({
      userId,
      practiceTestId,
      status: 'completed'
    });
    if (existingPayment) {
      return res.status(400).json({ message: 'You already have access to this practice test' });
    }
  }

  if (type === 'study_material') {
    const existingPayment = await Payment.findOne({
      userId,
      studyMaterialId,
      status: 'completed'
    });
    if (existingPayment) {
      return res.status(400).json({ message: 'You already have access to this study material' });
    }
  }

  // Create payment record
  const payment = new Payment({
    userId,
    type,
    amount,
    currency,
    examId,
    practiceTestId,
    studyMaterialId,
    subscriptionType,
    paymentMethod,
    status: 'pending',
    gateway: 'stripe', // Default gateway
    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });

  await payment.save();

  // In a real implementation, you would integrate with a payment gateway here
  // For now, we'll simulate a successful payment
  payment.status = 'completed';
  payment.completedAt = new Date();
  await payment.save();

  res.status(201).json({
    message: 'Payment created successfully',
    payment
  });
}));

// @route   POST /api/payments/verify-payment
// @desc    Verify payment with payment gateway
// @access  Private
router.post('/verify-payment', [
  authenticateToken,
  body('paymentId').isMongoId().withMessage('Valid payment ID is required'),
  body('transactionId').notEmpty().withMessage('Transaction ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { paymentId, transactionId } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  // Check if user owns this payment
  if (payment.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // In a real implementation, verify with payment gateway
  // For now, we'll simulate verification
  payment.status = 'completed';
  payment.completedAt = new Date();
  payment.gatewayTransactionId = transactionId;
  await payment.save();

  res.json({
    message: 'Payment verified successfully',
    payment
  });
}));

// @route   GET /api/payments/access-check
// @desc    Check if user has access to a resource
// @access  Private
router.get('/access-check', authenticateToken, asyncHandler(async (req, res) => {
  const { examId, practiceTestId, studyMaterialId } = req.query;

  const userId = req.user.id;
  const access = {
    hasAccess: false,
    reason: 'No payment found'
  };

  // Check exam access
  if (examId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Free exams are accessible to all
    if (!exam.isPaid) {
      access.hasAccess = true;
      access.reason = 'Free exam';
    } else {
      const payment = await Payment.findOne({
        userId,
        examId,
        status: 'completed'
      });
      
      if (payment) {
        access.hasAccess = true;
        access.reason = 'Paid access';
      }
    }
  }

  // Check practice test access
  if (practiceTestId) {
    const practiceTest = await PracticeTest.findById(practiceTestId);
    if (!practiceTest) {
      return res.status(404).json({ message: 'Practice test not found' });
    }

    // Free practice tests are accessible to all
    if (!practiceTest.isPremium) {
      access.hasAccess = true;
      access.reason = 'Free practice test';
    } else {
      const payment = await Payment.findOne({
        userId,
        practiceTestId,
        status: 'completed'
      });
      
      if (payment) {
        access.hasAccess = true;
        access.reason = 'Paid access';
      }
    }
  }

  // Check study material access
  if (studyMaterialId) {
    const studyMaterial = await StudyMaterial.findById(studyMaterialId);
    if (!studyMaterial) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    // Free study materials are accessible to all
    if (!studyMaterial.isPremium) {
      access.hasAccess = true;
      access.reason = 'Free study material';
    } else {
      const payment = await Payment.findOne({
        userId,
        studyMaterialId,
        status: 'completed'
      });
      
      if (payment) {
        access.hasAccess = true;
        access.reason = 'Paid access';
      }
    }
  }

  res.json(access);
}));

// @route   GET /api/payments/subscription-status
// @desc    Get user's subscription status
// @access  Private
router.get('/subscription-status', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const activeSubscription = await Payment.findOne({
    userId,
    type: 'subscription',
    status: 'completed',
    subscriptionExpiry: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!activeSubscription) {
    return res.json({
      hasSubscription: false,
      subscription: null
    });
  }

  res.json({
    hasSubscription: true,
    subscription: {
      type: activeSubscription.subscriptionType,
      startDate: activeSubscription.completedAt,
      expiryDate: activeSubscription.subscriptionExpiry,
      amount: activeSubscription.amount,
      currency: activeSubscription.currency
    }
  });
}));

// @route   POST /api/payments/refund
// @desc    Request a refund
// @access  Private
router.post('/refund', [
  authenticateToken,
  body('paymentId').isMongoId().withMessage('Valid payment ID is required'),
  body('reason').notEmpty().withMessage('Refund reason is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { paymentId, reason } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  // Check if user owns this payment
  if (payment.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Check if payment is eligible for refund
  if (payment.status !== 'completed') {
    return res.status(400).json({ message: 'Payment is not eligible for refund' });
  }

  // Check refund window (e.g., 7 days)
  const refundWindow = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  if (Date.now() - payment.completedAt.getTime() > refundWindow) {
    return res.status(400).json({ message: 'Refund window has expired' });
  }

  payment.status = 'refunded';
  payment.refundReason = reason;
  payment.refundedAt = new Date();
  await payment.save();

  res.json({
    message: 'Refund request submitted successfully',
    payment
  });
}));

// @route   GET /api/payments/analytics
// @desc    Get payment analytics (Admin only)
// @access  Private (Admin)
router.get('/analytics', authenticateToken, asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { startDate, endDate } = req.query;
  const query = { status: 'completed' };

  if (startDate && endDate) {
    query.completedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const payments = await Payment.find(query);
  
  const analytics = {
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    totalPayments: payments.length,
    averagePayment: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
    paymentTypeDistribution: {},
    monthlyRevenue: {},
    topProducts: []
  };

  // Payment type distribution
  payments.forEach(payment => {
    analytics.paymentTypeDistribution[payment.type] = 
      (analytics.paymentTypeDistribution[payment.type] || 0) + 1;
  });

  // Monthly revenue
  payments.forEach(payment => {
    const month = payment.completedAt.toISOString().substring(0, 7); // YYYY-MM
    analytics.monthlyRevenue[month] = (analytics.monthlyRevenue[month] || 0) + payment.amount;
  });

  res.json(analytics);
}));

// @route   PUT /api/payments/:paymentId
// @desc    Update payment status (Admin only)
// @access  Private (Admin)
router.put('/:paymentId', [
  authenticateToken,
  body('status').isIn(['pending', 'completed', 'failed', 'refunded', 'cancelled']).withMessage('Valid status is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { paymentId } = req.params;
  const { status } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  payment.status = status;
  if (status === 'completed' && !payment.completedAt) {
    payment.completedAt = new Date();
  }
  if (status === 'refunded' && !payment.refundedAt) {
    payment.refundedAt = new Date();
  }

  await payment.save();

  res.json({
    message: 'Payment status updated successfully',
    payment
  });
}));

module.exports = router; 