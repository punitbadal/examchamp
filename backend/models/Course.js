const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  estimatedHours: {
    type: Number,
    default: 2,
    min: 0.5
  },
  questionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Learning objectives
  learningObjectives: [{
    type: String,
    trim: true
  }],
  // Prerequisites
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  // Study materials
  studyMaterials: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['pdf', 'video', 'article', 'practice_set'],
      required: true
    },
    url: {
      type: String,
      trim: true
    },
    duration: Number, // in minutes
    isPremium: {
      type: Boolean,
      default: false
    }
  }],
  // Practice test settings
  practiceTestSettings: {
    questionCount: {
      type: Number,
      default: 10,
      min: 1
    },
    timeLimit: {
      type: Number, // in minutes
      default: 20,
      min: 5
    },
    difficultyDistribution: {
      easy: { type: Number, default: 0.3, min: 0, max: 1 },
      medium: { type: Number, default: 0.5, min: 0, max: 1 },
      hard: { type: Number, default: 0.2, min: 0, max: 1 }
    },
    questionTypes: [{
      type: String,
      enum: ['MCQ_Single', 'MCQ_Multiple', 'TrueFalse', 'Integer', 'Numerical']
    }]
  }
}, {
  timestamps: true
});

const chapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  topics: [topicSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  // Chapter-level settings
  settings: {
    showProgress: {
      type: Boolean,
      default: true
    },
    allowSkip: {
      type: Boolean,
      default: false
    },
    requireCompletion: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  // Course metadata
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  duration: {
    type: Number, // in hours
    default: 40
  },
  chapters: [chapterSchema],
  // Course settings
  settings: {
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
    allowEnrollment: {
      type: Boolean,
      default: true
    },
    maxEnrollments: {
      type: Number,
      default: 1000
    },
    certificateOnCompletion: {
      type: Boolean,
      default: true
    }
  },
  // Course content
  thumbnail: {
    type: String,
    trim: true
  },
  tags: [String],
  // Target audience
  targetAudience: [{
    type: String,
    trim: true
  }],
  // Prerequisites
  prerequisites: [{
    type: String,
    trim: true
  }],
  // Learning outcomes
  learningOutcomes: [{
    type: String,
    trim: true
  }],
  // Course statistics
  stats: {
    totalEnrollments: {
      type: Number,
      default: 0
    },
    activeEnrollments: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
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
  instructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes for better performance
courseSchema.index({ category: 1, level: 1, status: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ 'stats.averageRating': -1 });
courseSchema.index({ 'stats.totalEnrollments': -1 });

// Virtual for total topics
courseSchema.virtual('totalTopics').get(function() {
  return this.chapters.reduce((total, chapter) => {
    return total + chapter.topics.length;
  }, 0);
});

// Virtual for total questions
courseSchema.virtual('totalQuestions').get(function() {
  return this.chapters.reduce((total, chapter) => {
    return total + chapter.topics.reduce((chapterTotal, topic) => {
      return chapterTotal + topic.questionCount;
    }, 0);
  }, 0);
});

// Method to get course progress for a user
courseSchema.methods.getUserProgress = async function(userId) {
  const Enrollment = require('./Enrollment');
  const enrollment = await Enrollment.findOne({ 
    courseId: this._id, 
    userId: userId 
  });
  
  if (!enrollment) return null;
  
  return {
    enrollmentId: enrollment._id,
    progress: enrollment.progress,
    completedTopics: enrollment.completedTopics,
    completedChapters: enrollment.completedChapters,
    lastAccessed: enrollment.lastAccessed,
    timeSpent: enrollment.timeSpent
  };
};

// Method to update course statistics
courseSchema.methods.updateStats = async function() {
  const Enrollment = require('./Enrollment');
  
  const stats = await Enrollment.aggregate([
    { $match: { courseId: this._id } },
    {
      $group: {
        _id: null,
        totalEnrollments: { $sum: 1 },
        activeEnrollments: { 
          $sum: { 
            $cond: [{ $eq: ['$status', 'active'] }, 1, 0] 
          } 
        },
        completedEnrollments: { 
          $sum: { 
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] 
          } 
        },
        averageRating: { $avg: '$rating' },
        totalRatings: { 
          $sum: { $cond: [{ $ne: ['$rating', null] }, 1, 0] } 
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const stat = stats[0];
    this.stats = {
      totalEnrollments: stat.totalEnrollments,
      activeEnrollments: stat.activeEnrollments,
      completionRate: stat.totalEnrollments > 0 ? 
        (stat.completedEnrollments / stat.totalEnrollments) * 100 : 0,
      averageRating: stat.averageRating || 0,
      totalRatings: stat.totalRatings
    };
    await this.save();
  }
};

module.exports = mongoose.model('Course', courseSchema); 