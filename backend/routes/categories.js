const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const Category = require('../models/Category');

// GET /api/categories - Get all categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      sortBy = 'order', 
      sortOrder = 'asc',
      activeOnly = true 
    } = req.query;

    const query = {};
    
    // Filter by active status
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const categories = await Category.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Category.countDocuments(query);

    res.json({
      success: true,
      data: {
        docs: categories,
        totalDocs: total,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
        pagingCounter: skip + 1,
        hasPrevPage: page > 1,
        hasNextPage: skip + categories.length < total,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: skip + categories.length < total ? page + 1 : null
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// GET /api/categories/with-subject-counts - Get categories with subject counts
router.get('/with-subject-counts', authenticateToken, async (req, res) => {
  try {
    const categoriesWithCounts = await Category.getWithSubjectCounts();
    
    res.json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Error fetching categories with counts:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// POST /api/categories - Create new category
router.post('/', [
  authenticateToken,
  (req, res, next) => {
    console.log('Direct role check:', {
      userRole: req.user?.role,
      requiredRoles: ['admin', 'super_admin'],
      hasUser: !!req.user
    });
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log('Direct role check successful for role:', req.user.role);
    next();
  },
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
  body('icon').optional().trim(),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, description, color, icon, order, isActive } = req.body;

    // Check if category name already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }

    const category = new Category({
      name: name.trim(),
      description: description?.trim(),
      color: color || '#3B82F6',
      icon: icon || '🏷️',
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', [
  authenticateToken,
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  },
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
  body('icon').optional().trim(),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const { name, description, color, icon, order, isActive } = req.body;

    // Check if new name conflicts with existing category
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: name.trim(),
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category name already exists'
        });
      }
    }

    // Update fields
    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description?.trim();
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', [
  authenticateToken,
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  }
], async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Delete the category
    await Category.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 