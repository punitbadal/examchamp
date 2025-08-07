const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate',
    index: true
  },
  icon: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Blue
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
  // Statistics
  stats: {
    totalChapters: { type: Number, default: 0 },
    totalTopics: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    totalExams: { type: Number, default: 0 },
    totalPracticeTests: { type: Number, default: 0 }
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

// Indexes for better performance
subjectSchema.index({ category: 1, isActive: 1 });
subjectSchema.index({ order: 1, name: 1 });

// Pre-save middleware to update stats
subjectSchema.pre('save', async function(next) {
  if (this.isModified('isActive') || this.isNew) {
    // Update stats when subject is created or modified
    const Chapter = mongoose.model('Chapter');
    const Topic = mongoose.model('Topic');
    const Question = mongoose.model('Question');
    const Exam = mongoose.model('Exam');
    const PracticeTest = mongoose.model('PracticeTest');

    try {
      const [chapters, topics, questions, exams, practiceTests] = await Promise.all([
        Chapter.countDocuments({ subjectId: this._id, isActive: true }),
        Topic.countDocuments({ subjectId: this._id, isActive: true }),
        Question.countDocuments({ subject: this.name, isActive: true }),
        Exam.countDocuments({ 'sections.subjects': this.name, isActive: true }),
        PracticeTest.countDocuments({ subject: this.name, isActive: true })
      ]);

      this.stats = {
        totalChapters: chapters,
        totalTopics: topics,
        totalQuestions: questions,
        totalExams: exams,
        totalPracticeTests: practiceTests
      };
    } catch (error) {
      console.error('Error updating subject stats:', error);
    }
  }
  next();
});

// Add pagination plugin
subjectSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Subject', subjectSchema); 