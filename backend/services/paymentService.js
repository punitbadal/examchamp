const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Exam = require('../models/Exam');
const User = require('../models/User');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    // Only initialize Razorpay if credentials are provided
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
    } else {
      this.razorpay = null;
      logger.warn('Razorpay credentials not provided - payment features will be disabled');
    }
  }

  // Create a new payment order
  async createOrder(userId, examId, amount, currency = 'INR') {
    try {
      if (!this.razorpay) {
        throw new Error('Payment service is not configured. Please set Razorpay credentials.');
      }

      // Validate exam exists and is payable
      const exam = await Exam.findById(examId);
      if (!exam) {
        throw new Error('Exam not found');
      }

      if (!exam.isPaid) {
        throw new Error('This exam is free and does not require payment');
      }

      // Check if user already has valid access
      const existingPayment = await Payment.findValidAccess(userId, examId);
      if (existingPayment) {
        throw new Error('User already has valid access to this exam');
      }

      // Create Razorpay order
      const orderData = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        receipt: `exam_${examId}_user_${userId}_${Date.now()}`,
        notes: {
          examId: examId.toString(),
          userId: userId.toString(),
          examTitle: exam.title
        }
      };

      const order = await this.razorpay.orders.create(orderData);

      // Create payment record
      const payment = new Payment({
        userId,
        examId,
        amount,
        currency,
        description: `Payment for ${exam.title}`,
        razorpayOrderId: order.id,
        accessType: 'single_exam',
        accessExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      await payment.save();

      logger.userActivity('Payment order created', {
        userId,
        examId,
        orderId: order.id,
        amount
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment._id
      };
    } catch (error) {
      logger.error('Error creating payment order', {
        error: error.message,
        userId,
        examId,
        amount
      });
      throw error;
    }
  }

  // Verify payment signature and process payment
  async verifyPayment(paymentId, razorpayPaymentId, razorpaySignature) {
    try {
      if (!this.razorpay) {
        throw new Error('Payment service is not configured. Please set Razorpay credentials.');
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        logger.security('Payment signature verification failed', {
          paymentId,
          razorpayPaymentId,
          expectedSignature,
          receivedSignature: razorpaySignature
        });
        throw new Error('Invalid payment signature');
      }

      // Verify payment with Razorpay
      const razorpayPayment = await this.razorpay.payments.fetch(razorpayPaymentId);
      
      if (razorpayPayment.status !== 'captured') {
        throw new Error(`Payment not captured. Status: ${razorpayPayment.status}`);
      }

      // Update payment record
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.status = 'completed';
      payment.paymentMethod = razorpayPayment.method;
      payment.metadata = new Map([
        ['razorpay_payment_method', razorpayPayment.method],
        ['razorpay_bank', razorpayPayment.bank],
        ['razorpay_wallet', razorpayPayment.wallet],
        ['razorpay_vpa', razorpayPayment.vpa]
      ]);

      await payment.save();

      // Grant access to exam
      await payment.grantAccess();

      logger.userActivity('Payment verified and access granted', {
        userId: payment.userId,
        examId: payment.examId,
        paymentId: razorpayPaymentId,
        amount: payment.amount
      });

      return {
        success: true,
        payment: payment,
        accessGranted: true
      };
    } catch (error) {
      logger.error('Error verifying payment', {
        error: error.message,
        paymentId,
        razorpayPaymentId
      });
      throw error;
    }
  }

  // Process refund
  async processRefund(paymentId, amount, reason) {
    try {
      if (!this.razorpay) {
        throw new Error('Payment service is not configured. Please set Razorpay credentials.');
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Payment is not completed and cannot be refunded');
      }

      // Process refund through Razorpay
      const refund = await this.razorpay.payments.refund(
        payment.razorpayPaymentId,
        {
          amount: amount * 100, // Convert to paise
          notes: {
            reason: reason
          }
        }
      );

      // Update payment record
      await payment.processRefund(amount, reason);

      logger.userActivity('Payment refunded', {
        userId: payment.userId,
        examId: payment.examId,
        paymentId: payment.razorpayPaymentId,
        refundAmount: amount,
        reason: reason
      });

      return {
        success: true,
        refundId: refund.id,
        payment: payment
      };
    } catch (error) {
      logger.error('Error processing refund', {
        error: error.message,
        paymentId,
        amount
      });
      throw error;
    }
  }

  // Check user access to exam
  async checkUserAccess(userId, examId) {
    try {
      const exam = await Exam.findById(examId);
      if (!exam) {
        return { hasAccess: false, reason: 'Exam not found' };
      }

      // Free exams
      if (!exam.isPaid) {
        return { hasAccess: true, reason: 'Free exam' };
      }

      // Check for valid payment
      const payment = await Payment.findValidAccess(userId, examId);
      if (payment) {
        return { 
          hasAccess: true, 
          reason: 'Valid payment',
          payment: payment,
          expiresAt: payment.accessExpiryDate
        };
      }

      // Check if user is admin
      const user = await User.findById(userId);
      if (user && ['admin', 'super_admin'].includes(user.role)) {
        return { hasAccess: true, reason: 'Admin access' };
      }

      return { hasAccess: false, reason: 'Payment required' };
    } catch (error) {
      logger.error('Error checking user access', {
        error: error.message,
        userId,
        examId
      });
      return { hasAccess: false, reason: 'Error checking access' };
    }
  }

  // Get user payment history
  async getUserPayments(userId, status = null) {
    try {
      const payments = await Payment.findUserPayments(userId, status);
      return payments;
    } catch (error) {
      logger.error('Error getting user payments', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  // Get payment statistics
  async getPaymentStats() {
    try {
      const stats = await Payment.getPaymentStats();
      return stats;
    } catch (error) {
      logger.error('Error getting payment stats', {
        error: error.message
      });
      throw error;
    }
  }

  // Webhook handler for Razorpay events
  async handleWebhook(event, signature) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(event))
        .digest('hex');

      if (expectedSignature !== signature) {
        logger.security('Webhook signature verification failed', {
          expectedSignature,
          receivedSignature: signature
        });
        throw new Error('Invalid webhook signature');
      }

      const { event: eventType, payload } = event;

      switch (eventType) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload.payment.entity);
          break;
        case 'refund.processed':
          await this.handleRefundProcessed(payload.refund.entity);
          break;
        default:
          logger.info('Unhandled webhook event', { eventType });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error handling webhook', {
        error: error.message,
        event: event
      });
      throw error;
    }
  }

  // Handle payment captured event
  async handlePaymentCaptured(paymentEntity) {
    try {
      const payment = await Payment.findOne({
        razorpayOrderId: paymentEntity.order_id
      });

      if (payment && payment.status === 'pending') {
        payment.status = 'completed';
        payment.razorpayPaymentId = paymentEntity.id;
        await payment.save();
        await payment.grantAccess();

        logger.userActivity('Payment captured via webhook', {
          userId: payment.userId,
          examId: payment.examId,
          paymentId: paymentEntity.id
        });
      }
    } catch (error) {
      logger.error('Error handling payment captured', {
        error: error.message,
        paymentEntity
      });
    }
  }

  // Handle payment failed event
  async handlePaymentFailed(paymentEntity) {
    try {
      const payment = await Payment.findOne({
        razorpayOrderId: paymentEntity.order_id
      });

      if (payment) {
        payment.status = 'failed';
        payment.errorCode = paymentEntity.error_code;
        payment.errorDescription = paymentEntity.error_description;
        await payment.save();

        logger.userActivity('Payment failed via webhook', {
          userId: payment.userId,
          examId: payment.examId,
          paymentId: paymentEntity.id,
          error: paymentEntity.error_description
        });
      }
    } catch (error) {
      logger.error('Error handling payment failed', {
        error: error.message,
        paymentEntity
      });
    }
  }

  // Handle refund processed event
  async handleRefundProcessed(refundEntity) {
    try {
      const payment = await Payment.findOne({
        razorpayPaymentId: refundEntity.payment_id
      });

      if (payment) {
        payment.status = 'refunded';
        payment.refundAmount = refundEntity.amount / 100; // Convert from paise
        payment.refundedAt = new Date();
        payment.accessGranted = false;
        await payment.save();

        logger.userActivity('Refund processed via webhook', {
          userId: payment.userId,
          examId: payment.examId,
          paymentId: refundEntity.payment_id,
          refundAmount: refundEntity.amount / 100
        });
      }
    } catch (error) {
      logger.error('Error handling refund processed', {
        error: error.message,
        refundEntity
      });
    }
  }
}

module.exports = new PaymentService(); 