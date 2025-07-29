const mongoose = require('mongoose');

const questionResponseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  userAnswer: {
    type: mongoose.Schema.Types.Mixed // Can be string, array, number, or boolean
  },
  isCorrect: {
    type: Boolean
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
  isAnswered: {
    type: Boolean,
    default: false
  },
  answeredAt: {
    type: Date
  }
}, {
  timestamps: true
});

const practiceTestAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  practiceTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PracticeTest',
    required: true,
    index: true
  },
  // Attempt details
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned', 'timed_out'],
    default: 'in_progress',
    index: true
  },
  // Timing
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  timeLimit: {
    type: Number, // in minutes
    required: true
  },
  timeTaken: {
    type: Number, // in minutes
    default: 0
  },
  timeRemaining: {
    type: Number, // in minutes
    default: 0
  },
  // Questions and responses
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  responses: [questionResponseSchema],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  // Scoring
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  unansweredQuestions: {
    type: Number,
    default: 0
  },
  // Performance metrics
  accuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  speed: {
    type: Number, // questions per minute
    default: 0
  },
  // Question analysis
  questionAnalysis: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    difficulty: String,
    topic: String,
    subject: String,
    userAnswer: mongoose.Schema.Types.Mixed,
    correctAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    score: Number,
    timeSpent: Number,
    explanation: String
  }],
  // Section-wise performance (if applicable)
  sectionPerformance: [{
    sectionName: String,
    totalQuestions: Number,
    correctAnswers: Number,
    score: Number,
    timeSpent: Number,
    accuracy: Number
  }],
  // Proctoring data (if enabled)
  proctoring: {
    enabled: {
      type: Boolean,
      default: false
    },
    events: [{
      type: {
        type: String,
        enum: ['tab_switch', 'copy_paste', 'suspicious_activity', 'network_issue']
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      details: mongoose.Schema.Types.Mixed
    }],
    warnings: {
      type: Number,
      default: 0
    },
    violations: {
      type: Number,
      default: 0
    }
  },
  // User feedback
  feedback: {
    difficulty: {
      type: String,
      enum: ['too_easy', 'easy', 'just_right', 'hard', 'too_hard']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String,
      trim: true
    },
    submittedAt: {
      type: Date
    }
  },
  // Metadata
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  deviceInfo: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better performance
practiceTestAttemptSchema.index({ userId: 1, practiceTestId: 1, attemptNumber: 1 }, { unique: true });
practiceTestAttemptSchema.index({ status: 1, startedAt: -1 });
practiceTestAttemptSchema.index({ score: -1 });
practiceTestAttemptSchema.index({ completedAt: -1 });

// Pre-save middleware to calculate metrics
practiceTestAttemptSchema.pre('save', function(next) {
  if (this.responses.length > 0) {
    // Calculate score and accuracy
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalTimeSpent = 0;
    
    this.responses.forEach(response => {
      totalScore += response.score || 0;
      totalTimeSpent += response.timeSpent || 0;
      
      if (response.isAnswered) {
        if (response.isCorrect) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      } else {
        unansweredCount++;
      }
    });
    
    this.score = totalScore;
    this.correctAnswers = correctCount;
    this.incorrectAnswers = incorrectCount;
    this.unansweredQuestions = unansweredCount;
    
    const totalAnswered = correctCount + incorrectCount;
    this.accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    
    // Calculate speed (questions per minute)
    if (this.timeTaken > 0) {
      this.speed = Math.round((totalAnswered / this.timeTaken) * 100) / 100;
    }
  }
  
  // Calculate time remaining
  if (this.startedAt && this.timeLimit) {
    const elapsedMinutes = (Date.now() - this.startedAt) / (1000 * 60);
    this.timeRemaining = Math.max(0, this.timeLimit - elapsedMinutes);
    
    // Auto-complete if time is up
    if (this.timeRemaining <= 0 && this.status === 'in_progress') {
      this.status = 'timed_out';
      this.completedAt = new Date();
    }
  }
  
  next();
});

// Method to submit answer
practiceTestAttemptSchema.methods.submitAnswer = async function(questionIndex, answer, timeSpent = 0) {
  if (questionIndex >= 0 && questionIndex < this.responses.length) {
    const response = this.responses[questionIndex];
    const question = this.questions[questionIndex];
    
    response.userAnswer = answer;
    response.isAnswered = true;
    response.answeredAt = new Date();
    response.timeSpent = timeSpent;
    
    // Calculate score (this would need the actual question data)
    // For now, we'll set a placeholder
    response.score = 0; // Will be calculated when test is completed
    
    await this.save();
  }
};

// Method to mark question for review
practiceTestAttemptSchema.methods.markForReview = async function(questionIndex) {
  if (questionIndex >= 0 && questionIndex < this.responses.length) {
    this.responses[questionIndex].isMarkedForReview = true;
    await this.save();
  }
};

// Method to complete the test
practiceTestAttemptSchema.methods.completeTest = async function() {
  if (this.status === 'in_progress') {
    this.status = 'completed';
    this.completedAt = new Date();
    this.timeTaken = (this.completedAt - this.startedAt) / (1000 * 60); // in minutes
    
    // Calculate final scores
    const Question = require('./Question');
    
    for (let i = 0; i < this.responses.length; i++) {
      const response = this.responses[i];
      const question = await Question.findById(this.questions[i]);
      
      if (question && response.isAnswered) {
        response.isCorrect = question.calculateScore(response.userAnswer) > 0;
        response.score = question.calculateScore(response.userAnswer);
      }
    }
    
    await this.save();
  }
};

// Method to get performance summary
practiceTestAttemptSchema.methods.getPerformanceSummary = function() {
  const totalQuestions = this.questions.length;
  const answeredQuestions = this.correctAnswers + this.incorrectAnswers;
  
  return {
    score: this.score,
    totalMarks: this.totalMarks,
    percentage: this.totalMarks > 0 ? Math.round((this.score / this.totalMarks) * 100) : 0,
    correctAnswers: this.correctAnswers,
    incorrectAnswers: this.incorrectAnswers,
    unansweredQuestions: this.unansweredQuestions,
    accuracy: this.accuracy,
    speed: this.speed,
    timeTaken: this.timeTaken,
    timeRemaining: this.timeRemaining,
    totalQuestions,
    answeredQuestions,
    completionRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  };
};

// Method to get question-wise analysis
practiceTestAttemptSchema.methods.getQuestionAnalysis = function() {
  return this.responses.map((response, index) => ({
    questionNumber: index + 1,
    questionId: this.questions[index],
    userAnswer: response.userAnswer,
    isCorrect: response.isCorrect,
    score: response.score,
    timeSpent: response.timeSpent,
    isMarkedForReview: response.isMarkedForReview,
    isAnswered: response.isAnswered
  }));
};

// Static method to get user's test history
practiceTestAttemptSchema.statics.getUserHistory = async function(userId, limit = 10) {
  return await this.find({ userId })
    .populate('practiceTestId', 'title code type level')
    .sort({ startedAt: -1 })
    .limit(limit);
};

// Static method to get test statistics
practiceTestAttemptSchema.statics.getTestStats = async function(practiceTestId) {
  const stats = await this.aggregate([
    { $match: { practiceTestId: mongoose.Types.ObjectId(practiceTestId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score' },
        averageTime: { $avg: '$timeTaken' },
        averageAccuracy: { $avg: '$accuracy' },
        bestScore: { $max: '$score' },
        worstScore: { $min: '$score' },
        completionRate: {
          $avg: {
            $cond: [
              { $gt: ['$unansweredQuestions', 0] },
              0,
              1
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalAttempts: 0,
    averageScore: 0,
    averageTime: 0,
    averageAccuracy: 0,
    bestScore: 0,
    worstScore: 0,
    completionRate: 0
  };
};

module.exports = mongoose.model('PracticeTestAttempt', practiceTestAttemptSchema); 