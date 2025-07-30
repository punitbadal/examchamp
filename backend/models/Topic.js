const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true,
    index: true
  },
  chapterName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  topicNumber: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
    index: true
  },
  weightage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  estimatedHours: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  order: {
    type: Number,
    default: 0,
    index: true
  },
  // Content
  content: {
    type: String,
    trim: true
  },
  learningObjectives: [String],
  keyConcepts: [String],
  formulas: [String],
  examples: [{
    title: String,
    description: String,
    solution: String
  }],
  // Statistics
  stats: {
    totalQuestions: { type: Number, default: 0 },
    totalExams: { type: Number, default: 0 },
    totalPracticeTests: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    questionDistribution: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    }
  },
  // Metadata
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for unique topic within chapter
topicSchema.index({ chapterId: 1, code: 1 }, { unique: true });
topicSchema.index({ chapterId: 1, topicNumber: 1 }, { unique: true });
topicSchema.index({ chapterId: 1, isActive: 1 });
topicSchema.index({ order: 1, name: 1 });

// Pre-save middleware to update stats
topicSchema.pre('save', async function(next) {
  if (this.isModified('isActive') || this.isNew) {
    // Update stats when topic is created or modified
    const Question = mongoose.model('Question');
    const Exam = mongoose.model('Exam');
    const PracticeTest = mongoose.model('PracticeTest');

    try {
      const [questions, exams, practiceTests] = await Promise.all([
        Question.countDocuments({ 
          subject: this.subjectName, 
          chapter: this.chapterName,
          topic: this.name,
          isActive: true 
        }),
        Exam.countDocuments({ 
          'sections.subjects': this.subjectName,
          'sections.chapters': this.chapterName,
          'sections.topics': this.name,
          isActive: true 
        }),
        PracticeTest.countDocuments({ 
          subject: this.subjectName,
          chapter: this.chapterName,
          topic: this.name,
          isActive: true 
        })
      ]);

      // Get question distribution by difficulty
      const questionDistribution = await Question.aggregate([
        {
          $match: {
            subject: this.subjectName,
            chapter: this.chapterName,
            topic: this.name,
            isActive: true
          }
        },
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 }
          }
        }
      ]);

      const distribution = {
        easy: 0,
        medium: 0,
        hard: 0
      };

      questionDistribution.forEach(item => {
        distribution[item._id.toLowerCase()] = item.count;
      });

      this.stats = {
        totalQuestions: questions,
        totalExams: exams,
        totalPracticeTests: practiceTests,
        averageScore: 0, // Will be calculated separately
        totalAttempts: 0, // Will be calculated separately
        questionDistribution: distribution
      };
    } catch (error) {
      console.error('Error updating topic stats:', error);
    }
  }
  next();
});

// Add pagination plugin
topicSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Topic', topicSchema); 