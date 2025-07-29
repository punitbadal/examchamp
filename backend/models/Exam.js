const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questionCount: {
    type: Number,
    required: true,
    min: 1
  },
  timeLimit: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  marksPerQuestion: {
    type: Number,
    default: 4,
    min: 0
  },
  negativeMarksPerQuestion: {
    type: Number,
    default: 1,
    min: 0
  },
  subjects: [{
    type: String,
    trim: true
  }],
  topics: [{
    type: String,
    trim: true
  }],
  difficultyDistribution: {
    easy: { type: Number, default: 0.3, min: 0, max: 1 },
    medium: { type: Number, default: 0.5, min: 0, max: 1 },
    hard: { type: Number, default: 0.2, min: 0, max: 1 }
  },
  questionTypes: [{
    type: String,
    enum: ['MCQ_Single', 'MCQ_Multiple', 'TrueFalse', 'Integer', 'Numerical']
  }],
  randomization: {
    randomizeQuestions: { type: Boolean, default: true },
    randomizeOptions: { type: Boolean, default: true },
    randomizeSections: { type: Boolean, default: false }
  },
  instructions: {
    type: String,
    trim: true
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  passingScore: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Validate section configuration
sectionSchema.methods.validateSection = function() {
  const errors = [];
  
  if (this.questionCount < 1) {
    errors.push('Section must have at least 1 question');
  }
  
  if (this.timeLimit < 1) {
    errors.push('Section must have a positive time limit');
  }
  
  const totalDistribution = this.difficultyDistribution.easy + 
                          this.difficultyDistribution.medium + 
                          this.difficultyDistribution.hard;
  if (Math.abs(totalDistribution - 1) > 0.01) {
    errors.push('Difficulty distribution must sum to 1');
  }
  
  return errors;
};

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  examCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  sections: [sectionSchema],
  totalDuration: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  passingScore: {
    type: Number,
    min: 0
  },
  // Scheduling
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  checkInWindow: {
    type: Number, // minutes before start time
    default: 10,
    min: 0
  },
  // Access control
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  isPaid: {
    type: Boolean,
    default: false,
    index: true
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  allowedDomains: [String],
  maxAttempts: {
    type: Number,
    default: 1,
    min: 1
  },
  // Proctoring settings
  proctoring: {
    enabled: { type: Boolean, default: false },
    webcamRequired: { type: Boolean, default: false },
    microphoneRequired: { type: Boolean, default: false },
    screenSharingRequired: { type: Boolean, default: false },
    browserLockdown: { type: Boolean, default: false },
    tabSwitchingDetection: { type: Boolean, default: false },
    copyPastePrevention: { type: Boolean, default: false },
    multiMonitorDetection: { type: Boolean, default: false },
    ipRestriction: { type: Boolean, default: false },
    allowedIPs: [String],
    aiProctoring: { type: Boolean, default: false },
    suspiciousActivityThreshold: { type: Number, default: 3, min: 1 }
  },
  // Exam settings
  settings: {
    showTimer: { type: Boolean, default: true },
    showProgress: { type: Boolean, default: true },
    allowReview: { type: Boolean, default: true },
    allowMarkForReview: { type: Boolean, default: true },
    allowBackNavigation: { type: Boolean, default: true },
    autoSubmit: { type: Boolean, default: true },
    showResultsImmediately: { type: Boolean, default: true },
    showLeaderboard: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: false },
    showExplanations: { type: Boolean, default: false },
    allowCalculator: { type: Boolean, default: false },
    allowScratchpad: { type: Boolean, default: false },
    allowHighlighter: { type: Boolean, default: false }
  },
  // Instructions and content
  instructions: {
    general: { type: String, trim: true },
    technical: { type: String, trim: true },
    academic: { type: String, trim: true },
    proctoring: { type: String, trim: true }
  },
  // Metadata
  category: {
    type: String,
    trim: true,
    index: true
  },
  tags: [String],
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
    index: true
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'completed', 'archived'],
    default: 'draft',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // Creator and permissions
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Analytics
  analytics: {
    totalRegistrations: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 }, // in minutes
    passRate: { type: Number, default: 0 },
    questionStats: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      correctCount: { type: Number, default: 0 },
      totalAttempts: { type: Number, default: 0 },
      averageTime: { type: Number, default: 0 }
    }]
  }
}, {
  timestamps: true
});

// Indexes for better performance
examSchema.index({ startTime: 1, endTime: 1, status: 1 });
examSchema.index({ category: 1, difficulty: 1, isActive: 1 });
examSchema.index({ createdBy: 1, createdAt: -1 });
examSchema.index({ examCode: 1, status: 1 });

// Virtual for exam status based on time
examSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  const checkInStart = new Date(this.startTime.getTime() - this.checkInWindow * 60000);
  
  if (now < checkInStart) return 'upcoming';
  if (now >= checkInStart && now < this.startTime) return 'checkin';
  if (now >= this.startTime && now <= this.endTime) return 'active';
  if (now > this.endTime) return 'completed';
  return 'unknown';
});

// Virtual for total questions
examSchema.virtual('totalQuestions').get(function() {
  return this.sections.reduce((total, section) => total + section.questionCount, 0);
});

// Method to validate exam configuration
examSchema.methods.validateExam = function() {
  const errors = [];
  
  // Validate basic fields
  if (!this.title || this.title.trim().length < 3) {
    errors.push('Exam title must be at least 3 characters long');
  }
  
  if (!this.examCode || this.examCode.trim().length < 3) {
    errors.push('Exam code must be at least 3 characters long');
  }
  
  if (this.startTime >= this.endTime) {
    errors.push('Start time must be before end time');
  }
  
  if (this.totalDuration <= 0) {
    errors.push('Total duration must be positive');
  }
  
  if (this.totalMarks <= 0) {
    errors.push('Total marks must be positive');
  }
  
  // Validate sections
  if (!this.sections || this.sections.length === 0) {
    errors.push('Exam must have at least one section');
  }
  
  let totalSectionTime = 0;
  let totalSectionQuestions = 0;
  
  for (const section of this.sections) {
    const sectionErrors = section.validateSection();
    errors.push(...sectionErrors.map(err => `Section "${section.name}": ${err}`));
    
    totalSectionTime += section.timeLimit;
    totalSectionQuestions += section.questionCount;
  }
  
  // Validate time consistency
  if (totalSectionTime !== this.totalDuration) {
    errors.push(`Total section time (${totalSectionTime}) must equal exam duration (${this.totalDuration})`);
  }
  
  // Validate question count
  if (totalSectionQuestions === 0) {
    errors.push('Exam must have at least one question');
  }
  
  return errors;
};

// Method to generate unique exam code
examSchema.statics.generateExamCode = async function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const existingExam = await this.findOne({ examCode: code });
    if (!existingExam) {
      isUnique = true;
    }
  }
  
  return code;
};

// Method to get exam preview (without sensitive data)
examSchema.methods.getPreview = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    examCode: this.examCode,
    totalDuration: this.totalDuration,
    totalMarks: this.totalMarks,
    totalQuestions: this.totalQuestions,
    startTime: this.startTime,
    endTime: this.endTime,
    checkInWindow: this.checkInWindow,
    category: this.category,
    difficulty: this.difficulty,
    status: this.status,
    currentStatus: this.currentStatus,
    sections: this.sections.map(section => ({
      name: section.name,
      description: section.description,
      questionCount: section.questionCount,
      timeLimit: section.timeLimit,
      marksPerQuestion: section.marksPerQuestion,
      isOptional: section.isOptional
    })),
    settings: this.settings,
    proctoring: {
      enabled: this.proctoring.enabled,
      webcamRequired: this.proctoring.webcamRequired,
      browserLockdown: this.proctoring.browserLockdown
    }
  };
};

// Method to update analytics
examSchema.methods.updateAnalytics = function(attemptData) {
  this.analytics.totalAttempts++;
  
  // Update average score
  const currentTotal = this.analytics.averageScore * (this.analytics.totalAttempts - 1);
  this.analytics.averageScore = (currentTotal + attemptData.score) / this.analytics.totalAttempts;
  
  // Update average time
  const currentTimeTotal = this.analytics.averageTime * (this.analytics.totalAttempts - 1);
  this.analytics.averageTime = (currentTimeTotal + attemptData.duration) / this.analytics.totalAttempts;
  
  // Update pass rate
  if (attemptData.score >= this.passingScore) {
    this.analytics.passRate = ((this.analytics.passRate * (this.analytics.totalAttempts - 1)) + 1) / this.analytics.totalAttempts;
  } else {
    this.analytics.passRate = (this.analytics.passRate * (this.analytics.totalAttempts - 1)) / this.analytics.totalAttempts;
  }
};

// Pre-save middleware to validate exam
examSchema.pre('save', function(next) {
  const errors = this.validateExam();
  if (errors.length > 0) {
    return next(new Error(`Exam validation failed: ${errors.join(', ')}`));
  }
  next();
});

module.exports = mongoose.model('Exam', examSchema); 