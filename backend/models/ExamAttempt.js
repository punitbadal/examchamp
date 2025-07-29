const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, array, number, or boolean
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  isMarkedForReview: {
    type: Boolean,
    default: false
  },
  isVisited: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const proctoringEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['tab_switch', 'copy_paste', 'browser_focus', 'webcam_off', 'microphone_off', 'suspicious_activity', 'ip_change', 'multi_monitor'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  action: {
    type: String,
    enum: ['warn', 'flag', 'terminate', 'none'],
    default: 'warn'
  }
}, {
  timestamps: true
});

const examAttemptSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Timing
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  // Status
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'terminated', 'abandoned'],
    default: 'in_progress',
    index: true
  },
  // Answers and scoring
  answers: [answerSchema],
  totalScore: {
    type: Number,
    default: 0
  },
  maxPossibleScore: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: null
  },
  percentile: {
    type: Number,
    default: null
  },
  // Section-wise performance
  sectionPerformance: [{
    sectionName: { type: String, required: true },
    sectionScore: { type: Number, default: 0 },
    sectionMaxScore: { type: Number, default: 0 },
    sectionPercentage: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }, // in minutes
    questionsAttempted: { type: Number, default: 0 },
    questionsCorrect: { type: Number, default: 0 }
  }],
  // Detailed analytics
  analytics: {
    totalQuestions: { type: Number, default: 0 },
    questionsAttempted: { type: Number, default: 0 },
    questionsCorrect: { type: Number, default: 0 },
    questionsIncorrect: { type: Number, default: 0 },
    questionsUnattempted: { type: Number, default: 0 },
    questionsMarkedForReview: { type: Number, default: 0 },
    averageTimePerQuestion: { type: Number, default: 0 }, // in seconds
    fastestQuestion: { type: Number, default: 0 }, // in seconds
    slowestQuestion: { type: Number, default: 0 }, // in seconds
    accuracy: { type: Number, default: 0 }, // percentage
    efficiency: { type: Number, default: 0 }, // questions per minute
    // Question type performance
    mcqSinglePerformance: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      score: { type: Number, default: 0 }
    },
    mcqMultiplePerformance: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      score: { type: Number, default: 0 }
    },
    trueFalsePerformance: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      score: { type: Number, default: 0 }
    },
    integerPerformance: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      score: { type: Number, default: 0 }
    },
    numericalPerformance: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      score: { type: Number, default: 0 }
    }
  },
  // Proctoring data
  proctoring: {
    enabled: { type: Boolean, default: false },
    events: [proctoringEventSchema],
    suspiciousActivityCount: { type: Number, default: 0 },
    tabSwitchCount: { type: Number, default: 0 },
    copyPasteCount: { type: Number, default: 0 },
    browserFocusLossCount: { type: Number, default: 0 },
    webcamOffCount: { type: Number, default: 0 },
    microphoneOffCount: { type: Number, default: 0 },
    ipChanges: [String],
    deviceInfo: {
      userAgent: String,
      screenResolution: String,
      timezone: String,
      language: String
    },
    aiProctoringScore: { type: Number, default: 0 }, // 0-100, higher = more suspicious
    finalProctoringStatus: {
      type: String,
      enum: ['clean', 'flagged', 'suspicious', 'terminated'],
      default: 'clean'
    }
  },
  // Navigation and interaction data
  navigation: {
    totalQuestionVisits: { type: Number, default: 0 },
    questionVisitPattern: [{
      questionNumber: { type: Number, required: true },
      visitCount: { type: Number, default: 1 },
      firstVisit: { type: Date, default: Date.now },
      lastVisit: { type: Date, default: Date.now }
    }],
    timeSpentPerSection: [{
      sectionName: { type: String, required: true },
      timeSpent: { type: Number, default: 0 } // in minutes
    }],
    idleTime: { type: Number, default: 0 }, // in seconds
    lastActivity: { type: Date, default: Date.now }
  },
  // Technical data
  technical: {
    browserInfo: {
      name: String,
      version: String,
      userAgent: String
    },
    networkInfo: {
      connectionType: String,
      effectiveType: String,
      downlink: Number
    },
    systemInfo: {
      platform: String,
      memory: Number,
      cores: Number
    },
    connectionStability: {
      disconnections: { type: Number, default: 0 },
      reconnections: { type: Number, default: 0 },
      averageLatency: { type: Number, default: 0 }
    }
  },
  // Metadata
  ipAddress: String,
  userAgent: String,
  submittedVia: {
    type: String,
    enum: ['manual', 'auto', 'admin'],
    default: 'manual'
  },
  notes: String,
  flags: [String], // For admin notes or special flags
  isDisqualified: {
    type: Boolean,
    default: false
  },
  disqualificationReason: String
}, {
  timestamps: true
});

// Indexes for better performance
examAttemptSchema.index({ examId: 1, studentId: 1 });
examAttemptSchema.index({ status: 1, startTime: -1 });
examAttemptSchema.index({ totalScore: -1, endTime: -1 });
examAttemptSchema.index({ 'proctoring.finalProctoringStatus': 1 });

// Virtual for attempt duration in minutes
examAttemptSchema.virtual('durationMinutes').get(function() {
  if (!this.endTime) return 0;
  return Math.round((this.endTime - this.startTime) / 60000);
});

// Virtual for attempt status
examAttemptSchema.virtual('isActive').get(function() {
  return this.status === 'in_progress';
});

// Virtual for completion status
examAttemptSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Method to update answer
examAttemptSchema.methods.updateAnswer = function(questionId, answer, timeSpent = 0) {
  const existingAnswer = this.answers.find(a => a.questionId.toString() === questionId.toString());
  
  if (existingAnswer) {
    existingAnswer.answer = answer;
    existingAnswer.timeSpent += timeSpent;
    existingAnswer.attempts += 1;
    existingAnswer.lastModified = new Date();
    existingAnswer.isVisited = true;
  } else {
    this.answers.push({
      questionId,
      answer,
      timeSpent,
      attempts: 1,
      isVisited: true,
      lastModified: new Date()
    });
  }
  
  this.updateAnalytics();
};

// Method to mark question for review
examAttemptSchema.methods.markForReview = function(questionId, isMarked = true) {
  const answer = this.answers.find(a => a.questionId.toString() === questionId.toString());
  if (answer) {
    answer.isMarkedForReview = isMarked;
  }
  this.updateAnalytics();
};

// Method to calculate final score
examAttemptSchema.methods.calculateFinalScore = function() {
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  for (const answer of this.answers) {
    // Get question details from database or cache
    // For now, we'll assume the score is already calculated
    totalScore += answer.score || 0;
    maxPossibleScore += answer.maxPossibleScore || 0;
  }
  
  this.totalScore = totalScore;
  this.maxPossibleScore = maxPossibleScore;
  this.percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  
  return {
    totalScore,
    maxPossibleScore,
    percentage: this.percentage
  };
};

// Method to update analytics
examAttemptSchema.methods.updateAnalytics = function() {
  const analytics = {
    totalQuestions: this.answers.length,
    questionsAttempted: 0,
    questionsCorrect: 0,
    questionsIncorrect: 0,
    questionsUnattempted: 0,
    questionsMarkedForReview: 0,
    totalTimeSpent: 0,
    questionTypeStats: {
      mcqSingle: { attempted: 0, correct: 0, score: 0 },
      mcqMultiple: { attempted: 0, correct: 0, score: 0 },
      trueFalse: { attempted: 0, correct: 0, score: 0 },
      integer: { attempted: 0, correct: 0, score: 0 },
      numerical: { attempted: 0, correct: 0, score: 0 }
    }
  };
  
  for (const answer of this.answers) {
    if (answer.answer !== null && answer.answer !== undefined) {
      analytics.questionsAttempted++;
      if (answer.isCorrect) {
        analytics.questionsCorrect++;
      } else {
        analytics.questionsIncorrect++;
      }
    } else {
      analytics.questionsUnattempted++;
    }
    
    if (answer.isMarkedForReview) {
      analytics.questionsMarkedForReview++;
    }
    
    analytics.totalTimeSpent += answer.timeSpent || 0;
  }
  
  analytics.accuracy = analytics.questionsAttempted > 0 ? 
    (analytics.questionsCorrect / analytics.questionsAttempted) * 100 : 0;
  
  analytics.averageTimePerQuestion = analytics.questionsAttempted > 0 ? 
    analytics.totalTimeSpent / analytics.questionsAttempted : 0;
  
  analytics.efficiency = this.duration > 0 ? 
    analytics.questionsAttempted / (this.duration / 60) : 0;
  
  this.analytics = { ...this.analytics, ...analytics };
};

// Method to add proctoring event
examAttemptSchema.methods.addProctoringEvent = function(eventType, details = {}, severity = 'low') {
  const event = {
    type: eventType,
    details,
    severity,
    timestamp: new Date()
  };
  
  this.proctoring.events.push(event);
  
  // Update counters
  switch (eventType) {
    case 'tab_switch':
      this.proctoring.tabSwitchCount++;
      break;
    case 'copy_paste':
      this.proctoring.copyPasteCount++;
      break;
    case 'browser_focus':
      this.proctoring.browserFocusLossCount++;
      break;
    case 'webcam_off':
      this.proctoring.webcamOffCount++;
      break;
    case 'microphone_off':
      this.proctoring.microphoneOffCount++;
      break;
    case 'suspicious_activity':
      this.proctoring.suspiciousActivityCount++;
      break;
  }
  
  // Determine action based on severity and count
  if (severity === 'critical' || this.proctoring.suspiciousActivityCount > 5) {
    event.action = 'terminate';
    this.status = 'terminated';
  } else if (severity === 'high' || this.proctoring.suspiciousActivityCount > 3) {
    event.action = 'flag';
    this.proctoring.finalProctoringStatus = 'flagged';
  } else if (severity === 'medium') {
    event.action = 'warn';
  } else {
    event.action = 'none';
  }
};

// Method to get attempt summary
examAttemptSchema.methods.getSummary = function() {
  return {
    id: this._id,
    examId: this.examId,
    studentId: this.studentId,
    status: this.status,
    startTime: this.startTime,
    endTime: this.endTime,
    duration: this.durationMinutes,
    totalScore: this.totalScore,
    maxPossibleScore: this.maxPossibleScore,
    percentage: this.percentage,
    rank: this.rank,
    percentile: this.percentile,
    analytics: this.analytics,
    proctoringStatus: this.proctoring.finalProctoringStatus,
    isDisqualified: this.isDisqualified
  };
};

// Method to get detailed performance analysis
examAttemptSchema.methods.getPerformanceAnalysis = function() {
  return {
    summary: this.getSummary(),
    sectionPerformance: this.sectionPerformance,
    questionTypePerformance: {
      mcqSingle: this.analytics.mcqSinglePerformance,
      mcqMultiple: this.analytics.mcqMultiplePerformance,
      trueFalse: this.analytics.trueFalsePerformance,
      integer: this.analytics.integerPerformance,
      numerical: this.analytics.numericalPerformance
    },
    navigation: this.navigation,
    proctoring: {
      events: this.proctoring.events.length,
      suspiciousActivityCount: this.proctoring.suspiciousActivityCount,
      finalStatus: this.proctoring.finalProctoringStatus,
      aiScore: this.proctoring.aiProctoringScore
    },
    technical: this.technical
  };
};

// Pre-save middleware to update analytics
examAttemptSchema.pre('save', function(next) {
  if (this.isModified('answers') || this.isModified('status')) {
    this.updateAnalytics();
  }
  next();
});

module.exports = mongoose.model('ExamAttempt', examAttemptSchema); 