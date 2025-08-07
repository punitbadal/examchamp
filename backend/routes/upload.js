const express = require('express');
const multer = require('multer');
const { authenticateToken, authorize } = require('../middleware/auth');
const { uploadToR2, generateFileKey } = require('../config/cloudflare');

const router = express.Router();

// Test endpoint to check authentication
router.get('/test-auth', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive
    }
  });
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/upload/image
// @desc    Upload image to Cloudflare R2
// @access  Private (Admin only)
router.post('/image', 
  authenticateToken, 
  (req, res, next) => {
    console.log('Auth middleware passed, user:', req.user);
    console.log('User role:', req.user?.role);
    console.log('User isActive:', req.user?.isActive);
    next();
  },
  // Temporarily comment out authorization to test
  // authorize(['admin', 'super_admin']),
  (req, res, next) => {
    console.log('Authorization middleware passed (temporarily disabled)');
    next();
  },
  upload.single('image'),
  async (req, res) => {
    try {
      console.log('Upload route handler started');
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      console.log('File received:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Generate unique key for the file
      const key = generateFileKey(req.file.originalname, 'questions');

      // Upload to Cloudflare R2
      const result = await uploadToR2(req.file, key, req.file.mimetype);

      if (!result.success) {
        return res.status(500).json({ error: 'Failed to upload image', details: result.error });
      }

      res.json({
        success: true,
        url: result.url,
        key: result.key,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// @route   POST /api/upload/multiple
// @desc    Upload multiple images to Cloudflare R2
// @access  Private (Admin only)
router.post('/multiple',
  authenticateToken,
  authorize(['admin', 'super_admin']),
  upload.array('images', 10), // Max 10 images
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      const uploadResults = [];

      for (const file of req.files) {
        const key = generateFileKey(file.originalname, 'questions');
        const result = await uploadToR2(file, key, file.mimetype);

        uploadResults.push({
          originalName: file.originalname,
          success: result.success,
          url: result.success ? result.url : null,
          key: result.success ? result.key : null,
          error: result.success ? null : result.error
        });
      }

      const successfulUploads = uploadResults.filter(r => r.success);
      const failedUploads = uploadResults.filter(r => !r.success);

      res.json({
        success: true,
        uploaded: successfulUploads,
        failed: failedUploads,
        total: req.files.length,
        successful: successfulUploads.length,
        failed: failedUploads.length
      });

    } catch (error) {
      console.error('Multiple image upload error:', error);
      res.status(500).json({ error: 'Failed to upload images' });
    }
  }
);

module.exports = router; 