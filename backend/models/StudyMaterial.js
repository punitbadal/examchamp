const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['document', 'video', 'image', 'link', 'presentation', 'pdf', 'article', 'formula_sheet', 'notes', 'previous_papers'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  // File information
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  url: {
    type: String,
    trim: true
  },
  // Video specific fields
  duration: {
    type: Number, // in minutes
    default: 0
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  // Access control
  isPremium: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  // Course association (optional)
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Version control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    fileUrl: String,
    updatedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
studyMaterialSchema.index({ subject: 1, category: 1 });
studyMaterialSchema.index({ type: 1, status: 1 });
studyMaterialSchema.index({ isPremium: 1, isPublic: 1 });
studyMaterialSchema.index({ tags: 1 });

// Instance methods
studyMaterialSchema.methods.incrementViews = async function() {
  this.views += 1;
  return await this.save();
};

studyMaterialSchema.methods.incrementDownloads = async function() {
  this.downloads += 1;
  return await this.save();
};

studyMaterialSchema.methods.addRating = async function(rating) {
  const totalRating = (this.rating * this.ratingCount) + rating;
  this.ratingCount += 1;
  this.rating = totalRating / this.ratingCount;
  return await this.save();
};

// Static methods
studyMaterialSchema.statics.getBySubject = async function(subject, options = {}) {
  const query = { subject, status: 'published', ...options };
  return await this.find(query).sort({ createdAt: -1 });
};

studyMaterialSchema.statics.getByCategory = async function(category, options = {}) {
  const query = { category, status: 'published', ...options };
  return await this.find(query).sort({ createdAt: -1 });
};

studyMaterialSchema.statics.getPremiumMaterials = async function(options = {}) {
  const query = { isPremium: true, status: 'published', ...options };
  return await this.find(query).sort({ createdAt: -1 });
};

studyMaterialSchema.statics.search = async function(searchTerm, options = {}) {
  const query = {
    status: 'published',
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ],
    ...options
  };
  return await this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema); 