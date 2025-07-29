const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true,
    index: true
  },
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  questionType: {
    type: String,
    required: true,
    enum: ['MCQ_Single', 'MCQ_Multiple', 'TrueFalse', 'Integer', 'Numerical'],
    index: true
  },
  options: {
    type: [String],
    default: []
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, array, number, or boolean
    required: true
  },
  marksPerQuestion: {
    type: Number,
    required: true,
    default: 4,
    min: 0
  },
  negativeMarksPerQuestion: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  topic: {
    type: String,
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
    index: true
  },
  explanation: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  // For numerical questions
  tolerance: {
    type: Number,
    default: 0.01,
    min: 0
  },
  // For MCQ_Multiple partial scoring
  partialScoring: {
    type: Boolean,
    default: false
  },
  // Detailed partial scoring rules for MCQ_Multiple
  partialScoringRules: {
    allCorrect: { type: Number, default: 4 },
    threeOutOfFour: { type: Number, default: 3 },
    twoOutOfThree: { type: Number, default: 2 },
    oneOutOfTwo: { type: Number, default: 1 },
    incorrect: { type: Number, default: -2 }
  },
  // Question metadata
  tags: [String],
  timeEstimate: {
    type: Number, // in seconds
    default: 120
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
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
questionSchema.index({ subject: 1, topic: 1, difficulty: 1 });
questionSchema.index({ questionType: 1, isActive: 1 });
questionSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual for question complexity score
questionSchema.virtual('complexityScore').get(function() {
  const difficultyScores = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
  return difficultyScores[this.difficulty] || 2;
});

// Method to validate question data
questionSchema.methods.validateQuestion = function() {
  const errors = [];

  // Validate question text
  if (!this.questionText || this.questionText.trim().length < 10) {
    errors.push('Question text must be at least 10 characters long');
  }

  // Validate based on question type
  switch (this.questionType) {
    case 'MCQ_Single':
      if (!this.options || this.options.length < 2) {
        errors.push('MCQ_Single must have at least 2 options');
      }
      if (typeof this.correctAnswer !== 'string' || !this.options.includes(this.correctAnswer)) {
        errors.push('MCQ_Single correct answer must be one of the provided options');
      }
      break;

    case 'MCQ_Multiple':
      if (!this.options || this.options.length < 2) {
        errors.push('MCQ_Multiple must have at least 2 options');
      }
      if (!Array.isArray(this.correctAnswer) || this.correctAnswer.length === 0) {
        errors.push('MCQ_Multiple correct answer must be an array');
      }
      if (!this.correctAnswer.every(ans => this.options.includes(ans))) {
        errors.push('MCQ_Multiple correct answers must be from provided options');
      }
      if (this.correctAnswer.length >= this.options.length) {
        errors.push('MCQ_Multiple cannot have all options as correct');
      }
      break;

    case 'TrueFalse':
      if (typeof this.correctAnswer !== 'boolean') {
        errors.push('TrueFalse correct answer must be boolean');
      }
      break;

    case 'Integer':
      if (typeof this.correctAnswer !== 'number' || !Number.isInteger(this.correctAnswer) || this.correctAnswer < 0) {
        errors.push('Integer correct answer must be a non-negative integer');
      }
      break;

    case 'Numerical':
      if (typeof this.correctAnswer !== 'number') {
        errors.push('Numerical correct answer must be a number');
      }
      if (this.tolerance < 0) {
        errors.push('Numerical tolerance must be non-negative');
      }
      break;
  }

  // Validate marks
  if (this.marksPerQuestion < 0) {
    errors.push('Marks per question must be non-negative');
  }
  if (this.negativeMarksPerQuestion < 0) {
    errors.push('Negative marks per question must be non-negative');
  }

  return errors;
};

// Method to calculate score for an answer
questionSchema.methods.calculateScore = function(userAnswer) {
  if (!userAnswer) return 0;

  switch (this.questionType) {
    case 'MCQ_Single':
      return userAnswer === this.correctAnswer ? this.marksPerQuestion : -this.negativeMarksPerQuestion;

    case 'MCQ_Multiple':
      if (!Array.isArray(userAnswer)) return -this.negativeMarksPerQuestion;
      
      if (this.partialScoring) {
        return this.calculatePartialScore(userAnswer);
      } else {
        // Exact match required
        const isCorrect = this.correctAnswer.length === userAnswer.length &&
          this.correctAnswer.every(ans => userAnswer.includes(ans)) &&
          userAnswer.every(ans => this.correctAnswer.includes(ans));
        return isCorrect ? this.marksPerQuestion : -this.negativeMarksPerQuestion;
      }

    case 'TrueFalse':
      return userAnswer === this.correctAnswer ? this.marksPerQuestion : -this.negativeMarksPerQuestion;

    case 'Integer':
      return userAnswer === this.correctAnswer ? this.marksPerQuestion : -this.negativeMarksPerQuestion;

    case 'Numerical':
      const difference = Math.abs(userAnswer - this.correctAnswer);
      return difference <= this.tolerance ? this.marksPerQuestion : -this.negativeMarksPerQuestion;

    default:
      return 0;
  }
};

// Method to calculate partial score for MCQ_Multiple
questionSchema.methods.calculatePartialScore = function(userAnswer) {
  if (!Array.isArray(userAnswer) || !Array.isArray(this.correctAnswer)) {
    return -this.negativeMarksPerQuestion;
  }

  const correctAnswers = new Set(this.correctAnswer);
  const userAnswers = new Set(userAnswer);
  
  let correctCount = 0;
  let incorrectCount = 0;

  // Count correct selections
  for (const answer of userAnswers) {
    if (correctAnswers.has(answer)) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  }

  // Count missed correct answers
  const missedCorrect = this.correctAnswer.length - correctCount;

  // Apply partial scoring rules
  if (incorrectCount === 0 && missedCorrect === 0) {
    // All correct
    return this.partialScoringRules.allCorrect;
  } else if (incorrectCount === 0) {
    // Some correct answers selected, no incorrect
    if (correctCount >= 3 && this.correctAnswer.length >= 4) {
      return this.partialScoringRules.threeOutOfFour;
    } else if (correctCount >= 2 && this.correctAnswer.length >= 3) {
      return this.partialScoringRules.twoOutOfThree;
    } else if (correctCount >= 1 && this.correctAnswer.length >= 2) {
      return this.partialScoringRules.oneOutOfTwo;
    }
  }

  // Any incorrect selection
  return this.partialScoringRules.incorrect;
};

// Method to get question statistics
questionSchema.methods.getStatistics = function() {
  return {
    questionId: this._id,
    questionNumber: this.questionNumber,
    questionType: this.questionType,
    difficulty: this.difficulty,
    subject: this.subject,
    topic: this.topic,
    timeEstimate: this.timeEstimate,
    complexityScore: this.complexityScore
  };
};

// Pre-save middleware to validate question
questionSchema.pre('save', function(next) {
  const errors = this.validateQuestion();
  if (errors.length > 0) {
    return next(new Error(`Question validation failed: ${errors.join(', ')}`));
  }
  next();
});

module.exports = mongoose.model('Question', questionSchema); 