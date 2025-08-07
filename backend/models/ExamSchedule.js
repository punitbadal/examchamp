const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  examCode: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  maxAttempts: {
    type: Number,
    default: 1,
    min: 1
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  passMarks: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'completed'],
    default: 'scheduled'
  },
  participants: {
    type: Number,
    default: 0
  },
  proctoringEnabled: {
    type: Boolean,
    default: true
  },
  instructions: {
    type: String,
    trim: true
  },
  subjects: [{
    type: String,
    trim: true
  }],
  maxParticipants: {
    type: Number,
    min: 1
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Validate that end date is after start date
examScheduleSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

// Auto-update status based on dates
examScheduleSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (this.endDate < now) {
    this.status = 'completed';
  } else if (this.startDate <= now && this.endDate > now) {
    this.status = 'active';
  } else if (this.startDate > now) {
    this.status = 'scheduled';
  }
  
  return this.save();
};

module.exports = mongoose.model('ExamSchedule', examScheduleSchema); 