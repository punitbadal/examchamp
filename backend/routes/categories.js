const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Subject = require('../models/Subject');

const router = express.Router();

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin only)
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().isHexColor(),
  body('icon').optional().trim(),
  body('order').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    description = '',
    color = '#3B82F6',
    icon = '🏷️',
    order = 0
  } = req.body;

  // Check if category name already exists
  const existingCategory = await Category.findOne({ name: name.trim() });
  if (existingCategory) {
    return res.status(400).json({ error: 'Category name already exists' });
  }

  const category = new Category({
    name: name.trim(),
    description,
    color,
    icon,
    order,
    isActive: true,
    createdBy: new mongoose.Types.ObjectId() // Generate a new ObjectId for now
  });

  await category.save();

  res.status(201).json({
    message: 'Category created successfully',
    category
  });
}));

// @route   GET /api/categories
// @desc    Get all categories (with filtering)
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search,
    sortBy = 'order',
    sortOrder = 'asc'
  } = req.query;

  const query = {};

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const categories = await Category.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get subject count for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const subjectCount = await Subject.countDocuments({ category: category.name });
      return {
        ...category.toObject(),
        subjectCount
      };
    })
  );

  const total = await Category.countDocuments(query);

  res.json({
    categories: categoriesWithCounts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Get subject count
  const subjectCount = await Subject.countDocuments({ category: category.name });

  res.json({ 
    category: {
      ...category.toObject(),
      subjectCount
    }
  });
}));

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin only)
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().isHexColor(),
  body('icon').optional().trim(),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Check if name is being changed and if it already exists
  if (req.body.name && req.body.name !== category.name) {
    const existingCategory = await Category.findOne({ 
      name: req.body.name.trim(),
      _id: { $ne: req.params.id }
    });
    if (existingCategory) {
      return res.status(400).json({ error: 'Category name already exists' });
    }
  }

  // Update category
  Object.assign(category, req.body);
  await category.save();

  res.json({
    message: 'Category updated successfully',
    category
  });
}));

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Check if category has subjects
  const subjectCount = await Subject.countDocuments({ category: category.name });
  if (subjectCount > 0) {
    return res.status(400).json({ 
      error: `Cannot delete category. It has ${subjectCount} subject(s) assigned to it.` 
    });
  }

  await Category.findByIdAndDelete(req.params.id);

  res.json({ message: 'Category deleted successfully' });
}));

// @route   GET /api/categories/:id/subjects
// @desc    Get subjects by category
// @access  Private
router.get('/:id/subjects', asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const subjects = await Subject.find({ category: category.name })
    .sort({ order: 1, name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Subject.countDocuments({ category: category.name });

  res.json({
    subjects,
    category,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

module.exports = router; 