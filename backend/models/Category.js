const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  color: {
    type: String,
    default: '#3B82F6',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex color'
    }
  },
  icon: {
    type: String,
    default: '🏷️',
    trim: true
  },
  order: {
    type: Number,
    default: 0,
    min: 0
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
  }
}, {
  timestamps: true
});

// Index for efficient queries
categorySchema.index({ name: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ isActive: 1 });

// Virtual for subject count (will be populated when needed)
categorySchema.virtual('subjectCount', {
  ref: 'Subject',
  localField: 'name',
  foreignField: 'category',
  count: true
});

// Method to get category preview (without sensitive data)
categorySchema.methods.getPreview = function() {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    color: this.color,
    icon: this.icon,
    order: this.order,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to get categories with subject counts
categorySchema.statics.getWithSubjectCounts = async function() {
  const categories = await this.find({ isActive: true }).sort({ order: 1, name: 1 });
  
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const Subject = mongoose.model('Subject');
      const subjectCount = await Subject.countDocuments({ category: category.name });
      return {
        ...category.toObject(),
        subjectCount
      };
    })
  );
  
  return categoriesWithCounts;
};

// Pre-save middleware to ensure unique names
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const existingCategory = await this.constructor.findOne({ 
      name: this.name,
      _id: { $ne: this._id }
    });
    
    if (existingCategory) {
      throw new Error('Category name already exists');
    }
  }
  next();
});

// Pre-remove middleware to check if category can be deleted
categorySchema.pre('remove', async function(next) {
  const Subject = mongoose.model('Subject');
  const subjectCount = await Subject.countDocuments({ category: this.name });
  
  if (subjectCount > 0) {
    throw new Error(`Cannot delete category. It has ${subjectCount} subject(s) assigned to it.`);
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema); 