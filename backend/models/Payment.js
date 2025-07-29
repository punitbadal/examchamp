const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Payment Details
  razorpayPaymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    index: true
  },
  razorpaySignature: {
    type: String,
    required: true
  },
  
  // User and Exam Details
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  
  // Payment Information
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  description: {
    type: String,
    required: true
  },
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'card', 'netbanking', 'upi', 'wallet'],
    default: 'razorpay'
  },
  
  // Access Control
  accessGranted: {
    type: Boolean,
    default: false
  },
  accessExpiryDate: {
    type: Date,
    required: true
  },
  accessType: {
    type: String,
    enum: ['single_exam', 'all_exams', 'subscription'],
    default: 'single_exam'
  },
  
  // Refund Information
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: String
  },
  
  // Error Information
  errorCode: {
    type: String
  },
  errorDescription: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ userId: 1, examId: 1 });
paymentSchema.index({ status: 1, createdAt: 1 });
paymentSchema.index({ accessExpiryDate: 1 });
paymentSchema.index({ razorpayPaymentId: 1, status: 1 });

// Virtual for payment status
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

paymentSchema.virtual('isAccessValid').get(function() {
  return this.accessGranted && new Date() <= this.accessExpiryDate;
});

// Methods
paymentSchema.methods.grantAccess = async function() {
  this.accessGranted = true;
  await this.save();
  
  // Log access grant
  const logger = require('../utils/logger');
  logger.userActivity('Payment access granted', {
    userId: this.userId,
    examId: this.examId,
    paymentId: this.razorpayPaymentId,
    amount: this.amount
  });
};

paymentSchema.methods.revokeAccess = async function() {
  this.accessGranted = false;
  await this.save();
  
  // Log access revocation
  const logger = require('../utils/logger');
  logger.userActivity('Payment access revoked', {
    userId: this.userId,
    examId: this.examId,
    paymentId: this.razorpayPaymentId
  });
};

paymentSchema.methods.processRefund = async function(amount, reason) {
  this.status = 'refunded';
  this.refundAmount = amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  this.accessGranted = false;
  
  await this.save();
  
  // Log refund
  const logger = require('../utils/logger');
  logger.userActivity('Payment refunded', {
    userId: this.userId,
    examId: this.examId,
    paymentId: this.razorpayPaymentId,
    refundAmount: amount,
    reason: reason
  });
};

// Static methods
paymentSchema.statics.findValidAccess = async function(userId, examId) {
  return this.findOne({
    userId,
    examId,
    status: 'completed',
    accessGranted: true,
    accessExpiryDate: { $gte: new Date() }
  });
};

paymentSchema.statics.findUserPayments = async function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('examId', 'title examCode startTime endTime')
    .sort({ createdAt: -1 });
};

paymentSchema.statics.getPaymentStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Set access expiry if not set
  if (!this.accessExpiryDate) {
    this.accessExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  
  next();
});

module.exports = mongoose.model('Payment', paymentSchema); 