const mongoose = require('mongoose');

const practiceTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  // Test configuration
  type: {
    type: String,
    enum: ['topic_quiz', 'chapter_test', 'subject_test', 'mock_exam', 'custom'],
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  // Scope and content
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  subjects: [{
    type: String,
    trim: true
  }],
  topics: [{
    type: String,
    trim: true
  }],
  // Test settings
  settings: {
    questionCount: {
      type: Number,
      required: true,
      min: 1,
      max: 200
    },
    timeLimit: {
      type: Number, // in minutes
      required: true,
      min: 5,
      max: 480
    },
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 60
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1
    },
    // Question distribution
    difficultyDistribution: {
      easy: { type: Number, default: 0.3, min: 0, max: 1 },
      medium: { type: Number, default: 0.5, min: 0, max: 1 },
      hard: { type: Number, default: 0.2, min: 0, max: 1 }
    },
    questionTypes: [{
      type: String,
      enum: ['MCQ_Single', 'MCQ_Multiple', 'TrueFalse', 'Integer', 'Numerical']
    }],
    // Marking scheme
    marksPerQuestion: {
      type: Number,
      default: 4,
      min: 1
    },
    negativeMarksPerQuestion: {
      type: Number,
      default: 1,
      min: 0
    },
    // Test behavior
    showTimer: {
      type: Boolean,
      default: true
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    allowMarkForReview: {
      type: Boolean,
      default: true
    },
    allowBackNavigation: {
      type: Boolean,
      default: true
    },
    autoSubmit: {
      type: Boolean,
      default: true
    },
    showResultsImmediately: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: false
    },
    showExplanations: {
      type: Boolean,
      default: false
    },
    // Tools allowed
    allowCalculator: {
      type: Boolean,
      default: false
    },
    allowScratchpad: {
      type: Boolean,
      default: true
    },
    allowHighlighter: {
      type: Boolean,
      default: true
    }
  },
  // Question selection
  questionSelection: {
    mode: {
      type: String,
      enum: ['random', 'adaptive', 'fixed', 'weighted'],
      default: 'random'
    },
    // For adaptive tests
    adaptiveSettings: {
      initialDifficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      },
      difficultyAdjustment: {
        type: Number,
        default: 0.5,
        min: 0.1,
        max: 1.0
      },
      minQuestionsPerDifficulty: {
        type: Number,
        default: 2,
        min: 1
      }
    },
    // For weighted selection
    weights: {
      byDifficulty: {
        easy: { type: Number, default: 1 },
        medium: { type: Number, default: 1 },
        hard: { type: Number, default: 1 }
      },
      byTopic: [{
        topic: String,
        weight: { type: Number, default: 1 }
      }]
    }
  },
  // Access control
  access: {
    isPublic: {
      type: Boolean,
      default: true
    },
    isPaid: {
      type: Boolean,
      default: false
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
    allowedRoles: [{
      type: String,
      enum: ['student', 'admin', 'instructor']
    }],
    enrollmentRequired: {
      type: Boolean,
      default: false
    },
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PracticeTest'
    }]
  },
  // Scheduling
  availability: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    timeSlots: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // HH:MM format
      endTime: String,   // HH:MM format
      maxAttempts: Number
    }]
  },
  // Statistics
  stats: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageTime: {
      type: Number, // in minutes
      default: 0
    },
    passRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    difficultyRating: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
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
  // Metadata
  tags: [String],
  instructions: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
practiceTestSchema.index({ type: 1, level: 1, status: 1 });
practiceTestSchema.index({ courseId: 1, chapterId: 1, topicId: 1 });
practiceTestSchema.index({ subjects: 1, topics: 1 });
practiceTestSchema.index({ 'stats.averageScore': -1 });
practiceTestSchema.index({ 'stats.totalAttempts': -1 });

// Virtual for total marks
practiceTestSchema.virtual('totalMarks').get(function() {
  return this.settings.questionCount * this.settings.marksPerQuestion;
});

// Method to generate questions for the test
practiceTestSchema.methods.generateQuestions = async function() {
  const Question = require('./Question');
  
  let query = { isActive: true };
  
  // Filter by scope
  if (this.courseId) {
    query.courseId = this.courseId;
  }
  if (this.chapterId) {
    query.chapterId = this.chapterId;
  }
  if (this.topicId) {
    query.topicId = this.topicId;
  }
  if (this.subjects.length > 0) {
    query.subject = { $in: this.subjects };
  }
  if (this.topics.length > 0) {
    query.topic = { $in: this.topics };
  }
  if (this.settings.questionTypes.length > 0) {
    query.questionType = { $in: this.settings.questionTypes };
  }
  
  // Get questions based on selection mode
  let questions = [];
  
  switch (this.questionSelection.mode) {
    case 'random':
      questions = await Question.aggregate([
        { $match: query },
        { $sample: { size: this.settings.questionCount } },
        { $sort: { questionNumber: 1 } }
      ]);
      break;
      
    case 'adaptive':
      // For adaptive tests, we'll select questions dynamically during the test
      questions = await Question.find(query)
        .limit(this.settings.questionCount * 2) // Get more questions for adaptive selection
        .sort({ questionNumber: 1 });
      break;
      
    case 'fixed':
      // For fixed tests, use specific question IDs (if provided)
      questions = await Question.find(query)
        .limit(this.settings.questionCount)
        .sort({ questionNumber: 1 });
      break;
      
    case 'weighted':
      // For weighted selection, use aggregation with weights
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            weight: {
              $switch: {
                branches: [
                  { case: { $eq: ['$difficulty', 'Easy'] }, then: this.questionSelection.weights.byDifficulty.easy },
                  { case: { $eq: ['$difficulty', 'Medium'] }, then: this.questionSelection.weights.byDifficulty.medium },
                  { case: { $eq: ['$difficulty', 'Hard'] }, then: this.questionSelection.weights.byDifficulty.hard }
                ],
                default: 1
              }
            }
          }
        },
        { $sample: { size: this.settings.questionCount } },
        { $sort: { questionNumber: 1 } }
      ];
      questions = await Question.aggregate(pipeline);
      break;
  }
  
  return questions;
};

// Method to calculate test statistics
practiceTestSchema.methods.updateStats = async function() {
  const PracticeTestAttempt = require('./PracticeTestAttempt');
  
  const stats = await PracticeTestAttempt.aggregate([
    { $match: { practiceTestId: this._id } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score' },
        averageTime: { $avg: '$timeTaken' },
        passRate: {
          $avg: {
            $cond: [
              { $gte: ['$score', this.settings.passingScore] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const stat = stats[0];
    this.stats = {
      totalAttempts: stat.totalAttempts,
      averageScore: Math.round(stat.averageScore || 0),
      averageTime: Math.round(stat.averageTime || 0),
      passRate: Math.round((stat.passRate || 0) * 100),
      difficultyRating: this.stats.difficultyRating,
      totalRatings: this.stats.totalRatings
    };
    await this.save();
  }
};

// Method to check if user can attempt the test
practiceTestSchema.methods.canUserAttempt = async function(userId) {
  const PracticeTestAttempt = require('./PracticeTestAttempt');
  
  // Check if user has reached max attempts
  const userAttempts = await PracticeTestAttempt.countDocuments({
    practiceTestId: this._id,
    userId: userId
  });
  
  if (userAttempts >= this.settings.maxAttempts) {
    return { canAttempt: false, reason: 'Maximum attempts reached' };
  }
  
  // Check if test is available
  const now = new Date();
  if (this.availability.startDate && now < this.availability.startDate) {
    return { canAttempt: false, reason: 'Test not yet available' };
  }
  
  if (this.availability.endDate && now > this.availability.endDate) {
    return { canAttempt: false, reason: 'Test has ended' };
  }
  
  // Check time slots if configured
  if (this.availability.timeSlots.length > 0) {
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const validSlot = this.availability.timeSlots.find(slot => 
      slot.day === currentDay &&
      currentTime >= slot.startTime &&
      currentTime <= slot.endTime
    );
    
    if (!validSlot) {
      return { canAttempt: false, reason: 'Test not available at this time' };
    }
  }
  
  return { canAttempt: true };
};

module.exports = mongoose.model('PracticeTest', practiceTestSchema); 