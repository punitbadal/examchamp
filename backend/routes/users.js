const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  // Apply filters
  if (role) query.role = role;

  // Search functionality
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } }
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const users = await User.find(query)
    .select('-password')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
}));

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('phoneNumber').optional().trim(),
  body('institution').optional().trim(),
  body('grade').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('role').optional().isIn(['student', 'admin', 'super_admin']),
  body('preferences').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update user
  Object.assign(user, req.body);
  await user.save();

  res.json({
    message: 'User updated successfully',
    user: user.getPublicProfile()
  });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if user has any exam attempts
  const ExamAttempt = require('../models/ExamAttempt');
  const attempts = await ExamAttempt.find({ userId: req.params.id });
  
  if (attempts.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete user with existing exam attempts. Deactivate instead.' 
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({ message: 'User deleted successfully' });
}));

// @route   POST /api/users/bulk-upload
// @desc    Bulk upload users via CSV
// @access  Private (Admin only)
router.post('/bulk-upload', asyncHandler(async (req, res) => {
  // This would require multer middleware for file upload
  // For now, we'll accept an array of user data
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'Users array is required' });
  }

  const createdUsers = [];
  const errors = [];

  for (let i = 0; i < users.length; i++) {
    try {
      const userData = users[i];
      
      // Validate required fields
      if (!userData.email || !userData.firstName || !userData.lastName) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        errors.push(`Row ${i + 1}: User with email ${userData.email} already exists`);
        continue;
      }

      // Create user with default password
      const user = new User({
        ...userData,
        password: userData.password || 'defaultPassword123', // In production, generate random password
        role: userData.role || 'student'
      });

      await user.save();
      createdUsers.push(user.getPublicProfile());
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  res.status(201).json({
    message: 'Bulk user upload completed',
    created: createdUsers.length,
    errors: errors.length > 0 ? errors : undefined,
    users: createdUsers
  });
}));

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin only)
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        inactiveUsers: { $sum: { $cond: ['$isActive', 0, 1] } },
        byRole: {
          $push: '$role'
        },
        byInstitution: {
          $push: '$institution'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return res.json({
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      byRole: {},
      byInstitution: {}
    });
  }

  const stat = stats[0];
  
  // Count by role
  const byRole = stat.byRole.reduce((acc, role) => {
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  // Count by institution
  const byInstitution = stat.byInstitution
    .filter(inst => inst && inst.trim())
    .reduce((acc, inst) => {
      acc[inst] = (acc[inst] || 0) + 1;
      return acc;
    }, {});

  res.json({
    totalUsers: stat.totalUsers,
    activeUsers: stat.activeUsers,
    inactiveUsers: stat.inactiveUsers,
    byRole,
    byInstitution
  });
}));

// @route   POST /api/users/:id/reset-password
// @desc    Reset user password (Admin only)
// @access  Private (Admin only)
router.post('/:id/reset-password', [
  body('newPassword').isLength({ min: 6 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { newPassword } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password reset successfully' });
}));

// @route   POST /api/users/:id/activate
// @desc    Activate/deactivate user (Admin only)
// @access  Private (Admin only)
router.post('/:id/activate', [
  body('isActive').isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.isActive = isActive;
  await user.save();

  res.json({ 
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    user: user.getPublicProfile()
  });
}));

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', asyncHandler(async (req, res) => {
  const { q, role, limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const query = {
    $or: [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { studentId: { $regex: q, $options: 'i' } }
    ]
  };

  if (role) query.role = role;

  const users = await User.find(query)
    .select('firstName lastName email studentId role isActive')
    .limit(parseInt(limit));

  res.json({ users });
}));

module.exports = router; 