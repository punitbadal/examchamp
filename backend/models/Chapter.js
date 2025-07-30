const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const chapterSchema = new mongoose.Schema({
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
  chapterNumber: {
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
  syllabus: {
    type: String,
    trim: true
  },
  learningObjectives: [String],
  prerequisites: [String],
  // Statistics
  stats: {
    totalTopics: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    totalExams: { type: Number, default: 0 },
    totalPracticeTests: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 }
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

// Compound index for unique chapter within subject
chapterSchema.index({ subjectId: 1, code: 1 }, { unique: true });
chapterSchema.index({ subjectId: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.index({ subjectId: 1, isActive: 1 });
chapterSchema.index({ order: 1, name: 1 });

// Pre-save middleware to update stats
chapterSchema.pre('save', async function(next) {
  if (this.isModified('isActive') || this.isNew) {
    // Update stats when chapter is created or modified
    const Topic = mongoose.model('Topic');
    const Question = mongoose.model('Question');
    const Exam = mongoose.model('Exam');
    const PracticeTest = mongoose.model('PracticeTest');

    try {
      const [topics, questions, exams, practiceTests] = await Promise.all([
        Topic.countDocuments({ chapterId: this._id, isActive: true }),
        Question.countDocuments({ 
          subject: this.subjectName, 
          chapter: this.name, 
          isActive: true 
        }),
        Exam.countDocuments({ 
          'sections.subjects': this.subjectName,
          'sections.chapters': this.name,
          isActive: true 
        }),
        PracticeTest.countDocuments({ 
          subject: this.subjectName,
          chapter: this.name,
          isActive: true 
        })
      ]);

      this.stats = {
        totalTopics: topics,
        totalQuestions: questions,
        totalExams: exams,
        totalPracticeTests: practiceTests,
        averageScore: 0, // Will be calculated separately
        totalAttempts: 0 // Will be calculated separately
      };
    } catch (error) {
      console.error('Error updating chapter stats:', error);
    }
  }
  next();
});

// Add pagination plugin
chapterSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Chapter', chapterSchema); 