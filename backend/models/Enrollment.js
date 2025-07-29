const mongoose = require('mongoose');

const topicProgressSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  // Practice test attempts
  practiceTestAttempts: [{
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PracticeTestAttempt'
    },
    score: Number,
    totalQuestions: Number,
    correctAnswers: Number,
    timeTaken: Number, // in minutes
    completedAt: Date
  }],
  // Study material progress
  studyMaterialProgress: [{
    materialId: String,
    title: String,
    type: String,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    timeSpent: Number,
    completedAt: Date
  }]
}, {
  timestamps: true
});

const chapterProgressSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedTopics: {
    type: Number,
    default: 0
  },
  totalTopics: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  // Enrollment details
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'dropped'],
    default: 'active',
    index: true
  },
  // Progress tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedChapters: {
    type: Number,
    default: 0
  },
  completedTopics: {
    type: Number,
    default: 0
  },
  totalChapters: {
    type: Number,
    default: 0
  },
  totalTopics: {
    type: Number,
    default: 0
  },
  // Time tracking
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  // Detailed progress
  chapterProgress: [chapterProgressSchema],
  topicProgress: [topicProgressSchema],
  // Assessment scores
  assessmentScores: [{
    assessmentType: {
      type: String,
      enum: ['practice_test', 'chapter_quiz', 'final_assessment'],
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    correctAnswers: {
      type: Number,
      required: true
    },
    timeTaken: Number, // in minutes
    attemptedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Course rating and feedback
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  reviewedAt: {
    type: Date
  },
  // Certificate
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: {
      type: Date
    },
    certificateId: {
      type: String,
      trim: true
    }
  },
  // Payment information
  payment: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    paidAt: {
      type: Date
    }
  },
  // Study preferences
  preferences: {
    dailyGoal: {
      type: Number, // in minutes
      default: 60
    },
    reminderTime: {
      type: String, // HH:MM format
      default: '09:00'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ status: 1, lastAccessed: -1 });
enrollmentSchema.index({ progress: -1 });
enrollmentSchema.index({ 'assessmentScores.attemptedAt': -1 });

// Pre-save middleware to update progress
enrollmentSchema.pre('save', function(next) {
  if (this.totalTopics > 0) {
    this.progress = Math.round((this.completedTopics / this.totalTopics) * 100);
  }
  
  if (this.progress >= 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  next();
});

// Method to update topic progress
enrollmentSchema.methods.updateTopicProgress = async function(topicId, chapterId, progress, timeSpent = 0) {
  const topicProgress = this.topicProgress.find(tp => 
    tp.topicId.toString() === topicId.toString() && 
    tp.chapterId.toString() === chapterId.toString()
  );
  
  if (topicProgress) {
    topicProgress.progress = progress;
    topicProgress.timeSpent += timeSpent;
    topicProgress.lastAccessed = new Date();
    
    if (progress >= 100) {
      topicProgress.status = 'completed';
      topicProgress.completedAt = new Date();
      this.completedTopics++;
    } else if (progress > 0) {
      topicProgress.status = 'in_progress';
    }
  } else {
    this.topicProgress.push({
      topicId,
      chapterId,
      progress,
      timeSpent,
      status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
      completedAt: progress >= 100 ? new Date() : undefined
    });
    
    if (progress >= 100) {
      this.completedTopics++;
    }
  }
  
  // Update chapter progress
  await this.updateChapterProgress(chapterId);
  
  await this.save();
};

// Method to update chapter progress
enrollmentSchema.methods.updateChapterProgress = async function(chapterId) {
  const chapterProgress = this.chapterProgress.find(cp => 
    cp.chapterId.toString() === chapterId.toString()
  );
  
  if (chapterProgress) {
    const topicProgresses = this.topicProgress.filter(tp => 
      tp.chapterId.toString() === chapterId.toString()
    );
    
    const completedTopics = topicProgresses.filter(tp => tp.status === 'completed').length;
    const totalTopics = topicProgresses.length;
    
    chapterProgress.completedTopics = completedTopics;
    chapterProgress.totalTopics = totalTopics;
    chapterProgress.progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    chapterProgress.lastAccessed = new Date();
    
    if (chapterProgress.progress >= 100) {
      chapterProgress.status = 'completed';
      chapterProgress.completedAt = new Date();
      this.completedChapters++;
    } else if (chapterProgress.progress > 0) {
      chapterProgress.status = 'in_progress';
    }
  }
};

// Method to add assessment score
enrollmentSchema.methods.addAssessmentScore = async function(assessmentData) {
  this.assessmentScores.push(assessmentData);
  await this.save();
};

// Method to get average score
enrollmentSchema.methods.getAverageScore = function() {
  if (this.assessmentScores.length === 0) return 0;
  
  const totalScore = this.assessmentScores.reduce((sum, assessment) => {
    return sum + (assessment.score / assessment.totalQuestions) * 100;
  }, 0);
  
  return Math.round(totalScore / this.assessmentScores.length);
};

// Method to get study streak
enrollmentSchema.methods.getStudyStreak = function() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let streak = 0;
  let currentDate = new Date(this.lastAccessed);
  
  while (currentDate >= yesterday) {
    // Check if there was activity on this date
    const hasActivity = this.topicProgress.some(tp => {
      const tpDate = new Date(tp.lastAccessed);
      return tpDate.toDateString() === currentDate.toDateString();
    });
    
    if (hasActivity) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

// Static method to get user's learning analytics
enrollmentSchema.statics.getUserAnalytics = async function(userId) {
  const analytics = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalEnrollments: { $sum: 1 },
        activeEnrollments: { 
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
        },
        completedEnrollments: { 
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
        },
        totalTimeSpent: { $sum: '$timeSpent' },
        averageProgress: { $avg: '$progress' },
        totalAssessments: { 
          $sum: { $size: '$assessmentScores' } 
        }
      }
    }
  ]);
  
  return analytics[0] || {
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    totalTimeSpent: 0,
    averageProgress: 0,
    totalAssessments: 0
  };
};

module.exports = mongoose.model('Enrollment', enrollmentSchema); 