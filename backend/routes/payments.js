const express = require('express');
const { body, validationResult } = require('express-validator');
const paymentService = require('../services/paymentService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/payments/create-order
// @desc    Create a new payment order
// @access  Private
router.post('/create-order', [
  authenticateToken,
  body('examId').isMongoId().withMessage('Valid exam ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Valid amount is required'),
  body('currency').optional().isIn(['INR', 'USD', 'EUR']).withMessage('Valid currency is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
  }

  const { examId, amount, currency = 'INR' } = req.body;
  const userId = req.userId;

  const order = await paymentService.createOrder(userId, examId, amount, currency);

  logger.userActivity('Payment order created', {
    userId,
    examId,
    orderId: order.orderId,
    amount
  });

  res.status(201).json({
    success: true,
    message: 'Payment order created successfully',
    data: order
  });
}));

// @route   POST /api/payments/verify
// @desc    Verify payment and grant access
// @access  Private
router.post('/verify', [
  authenticateToken,
  body('paymentId').isMongoId().withMessage('Valid payment ID is required'),
  body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpaySignature').notEmpty().withMessage('Razorpay signature is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
  }

  const { paymentId, razorpayPaymentId, razorpaySignature } = req.body;

  const result = await paymentService.verifyPayment(paymentId, razorpayPaymentId, razorpaySignature);

  logger.userActivity('Payment verified', {
    userId: req.userId,
    paymentId,
    razorpayPaymentId
  });

  res.json({
    success: true,
    message: 'Payment verified and access granted',
    data: result
  });
}));

// @route   POST /api/payments/refund
// @desc    Process refund for a payment
// @access  Private (Admin only)
router.post('/refund', [
  authenticateToken,
  requireAdmin,
  body('paymentId').isMongoId().withMessage('Valid payment ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid refund amount is required'),
  body('reason').notEmpty().withMessage('Refund reason is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
  }

  const { paymentId, amount, reason } = req.body;

  const result = await paymentService.processRefund(paymentId, amount, reason);

  logger.userActivity('Payment refunded by admin', {
    adminId: req.userId,
    paymentId,
    amount,
    reason
  });

  res.json({
    success: true,
    message: 'Refund processed successfully',
    data: result
  });
}));

// @route   GET /api/payments/access/:examId
// @desc    Check user access to an exam
// @access  Private
router.get('/access/:examId', [
  authenticateToken,
  body('examId').isMongoId().withMessage('Valid exam ID is required')
], asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const userId = req.userId;

  const access = await paymentService.checkUserAccess(userId, examId);

  res.json({
    success: true,
    data: access
  });
}));

// @route   GET /api/payments/history
// @desc    Get user payment history
// @access  Private
router.get('/history', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { status } = req.query;

  const payments = await paymentService.getUserPayments(userId, status);

  res.json({
    success: true,
    data: payments
  });
}));

// @route   GET /api/payments/stats
// @desc    Get payment statistics (Admin only)
// @access  Private (Admin only)
router.get('/stats', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const stats = await paymentService.getPaymentStats();

  res.json({
    success: true,
    data: stats
  });
}));

// @route   POST /api/payments/webhook
// @desc    Handle Razorpay webhook events
// @access  Public
router.post('/webhook', asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  
  if (!signature) {
    logger.security('Webhook called without signature', {
      headers: req.headers,
      body: req.body
    });
    return res.status(400).json({ error: 'Missing signature' });
  }

  try {
    await paymentService.handleWebhook(req.body, signature);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing failed', {
      error: error.message,
      body: req.body,
      signature
    });
    
    res.status(400).json({ error: 'Webhook processing failed' });
  }
}));

// @route   GET /api/payments/order/:orderId
// @desc    Get order details
// @access  Private
router.get('/order/:orderId', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.userId;

  // Find payment by order ID and verify user ownership
  const Payment = require('../models/Payment');
  const payment = await Payment.findOne({
    razorpayOrderId: orderId,
    userId: userId
  }).populate('examId', 'title examCode startTime endTime');

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: payment
  });
}));

// @route   POST /api/payments/cancel/:paymentId
// @desc    Cancel a pending payment
// @access  Private
router.post('/cancel/:paymentId', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.userId;

  const Payment = require('../models/Payment');
  const payment = await Payment.findOne({
    _id: paymentId,
    userId: userId
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found'
    });
  }

  if (payment.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: 'Only pending payments can be cancelled'
    });
  }

  payment.status = 'cancelled';
  await payment.save();

  logger.userActivity('Payment cancelled', {
    userId,
    paymentId,
    examId: payment.examId
  });

  res.json({
    success: true,
    message: 'Payment cancelled successfully'
  });
}));

// @route   GET /api/payments/exam/:examId/pricing
// @desc    Get exam pricing information
// @access  Public
router.get('/exam/:examId/pricing', asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const Exam = require('../models/Exam');
  const exam = await Exam.findById(examId).select('title isPaid price currency description');

  if (!exam) {
    return res.status(404).json({
      success: false,
      error: 'Exam not found'
    });
  }

  res.json({
    success: true,
    data: {
      examId: exam._id,
      title: exam.title,
      isPaid: exam.isPaid,
      price: exam.price || 0,
      currency: exam.currency || 'INR',
      description: exam.description
    }
  });
}));

// @route   POST /api/payments/bulk-refund
// @desc    Process bulk refunds (Admin only)
// @access  Private (Admin only)
router.post('/bulk-refund', [
  authenticateToken,
  requireAdmin,
  body('paymentIds').isArray().withMessage('Payment IDs array is required'),
  body('reason').notEmpty().withMessage('Refund reason is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
  }

  const { paymentIds, reason } = req.body;

  const results = [];
  const refundErrors = [];

  for (const paymentId of paymentIds) {
    try {
      const Payment = require('../models/Payment');
      const payment = await Payment.findById(paymentId);
      
      if (!payment) {
        refundErrors.push(`Payment ${paymentId}: Not found`);
        continue;
      }

      if (payment.status !== 'completed') {
        refundErrors.push(`Payment ${paymentId}: Not completed`);
        continue;
      }

      const result = await paymentService.processRefund(paymentId, payment.amount, reason);
      results.push(result);
    } catch (error) {
      refundErrors.push(`Payment ${paymentId}: ${error.message}`);
    }
  }

  logger.userActivity('Bulk refund processed', {
    adminId: req.userId,
    paymentIds,
    reason,
    successCount: results.length,
    errorCount: refundErrors.length
  });

  res.json({
    success: true,
    message: `Bulk refund processed. ${results.length} successful, ${refundErrors.length} failed.`,
    data: {
      successful: results,
      errors: refundErrors
    }
  });
}));

module.exports = router; 