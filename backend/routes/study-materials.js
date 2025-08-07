const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const StudyMaterial = require('../models/StudyMaterial');
const multer = require('multer');
const path = require('path');
// const { uploadToR2, generateFileKey } = require('../config/cloudflare');

// Simple fallback functions
const uploadToR2 = async (file, key, contentType) => {
  return {
    success: true,
    url: `/uploads/study-materials/${file.originalname}`,
    key: key
  };
};

const generateFileKey = (originalName, prefix = 'study-materials') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${prefix}/${timestamp}-${randomString}.${extension}`;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/study-materials/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|mp4|avi|mov|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, PPT, Video, and Image files are allowed!'));
    }
  }
});

// @route   GET /api/study-materials
// @desc    Get all study materials with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      subject,
      category,
      type,
      isPremium,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { status: 'published' };

    if (subject) query.subject = subject;
    if (category) query.category = category;
    if (type) query.type = type;
    if (isPremium !== undefined) query.isPremium = isPremium === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const studyMaterials = await StudyMaterial.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await StudyMaterial.countDocuments(query);

    res.json({
      studyMaterials,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching study materials:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/study-materials/:id
// @desc    Get study material details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const studyMaterial = await StudyMaterial.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    // Increment views
    await studyMaterial.incrementViews();

    res.json(studyMaterial);
  } catch (error) {
    console.error('Error fetching study material:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/study-materials/upload
// @desc    Upload content (Admin only)
// @access  Private (Admin)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const {
      title,
      description,
      type,
      subject,
      topic,
      category,
      tags,
      isPremium,
      isPublic,
      url
    } = req.body;

    // Validate required fields
    if (!title || !description || !type) {
      return res.status(400).json({ error: 'Title, description, and type are required' });
    }

    // Validate file upload for non-link types
    if (type !== 'link' && !req.file) {
      return res.status(400).json({ error: 'File is required for non-link content types' });
    }

    // Validate URL for link type
    if (type === 'link' && !url) {
      return res.status(400).json({ error: 'URL is required for link content type' });
    }

    const studyMaterialData = {
      title,
      description,
      type,
      subject: subject || '',
      topic: topic || '',
      category: category || '',
      tags: tags ? JSON.parse(tags) : [],
      isPremium: isPremium === 'true',
      isPublic: isPublic !== 'false',
      createdBy: req.user.id,
      status: 'published'
    };

    // Add file information if uploaded
    if (req.file) {
      // Upload to Cloudflare R2 for documents
      const fileKey = generateFileKey(req.file.originalname, 'study-materials');
      const uploadResult = await uploadToR2(req.file, fileKey, req.file.mimetype);
      
      if (uploadResult.success) {
        studyMaterialData.fileUrl = uploadResult.url;
        studyMaterialData.fileName = req.file.originalname;
        studyMaterialData.fileSize = req.file.size;
      } else {
        return res.status(500).json({ error: 'Failed to upload file to cloud storage' });
      }
    }

    // Add URL for link type
    if (type === 'link' && url) {
      studyMaterialData.url = url;
    }

    const studyMaterial = new StudyMaterial(studyMaterialData);
    await studyMaterial.save();

    res.status(201).json({
      message: 'Content uploaded successfully',
      studyMaterial
    });
  } catch (error) {
    console.error('Error uploading content:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/study-materials
// @desc    Create a new study material (Admin only)
// @access  Private (Admin)
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const {
      title,
      description,
      type,
      subject,
      category,
      tags,
      isPremium,
      isPublic,
      duration,
      courseId,
      chapterId,
      topicId
    } = req.body;

    // Validate required fields
    if (!title || !type || !subject || !category) {
      return res.status(400).json({ error: 'Title, type, subject, and category are required' });
    }

    const studyMaterialData = {
      title,
      description,
      type,
      subject,
      category,
      tags: tags ? JSON.parse(tags) : [],
      isPremium: isPremium === 'true',
      isPublic: isPublic !== 'false',
      duration: duration ? parseInt(duration) : 0,
      courseId: courseId || null,
      chapterId: chapterId || null,
      topicId: topicId || null,
      createdBy: req.user.id
    };

    // Add file information if uploaded
    if (req.file) {
      studyMaterialData.fileUrl = `/uploads/study-materials/${req.file.filename}`;
      studyMaterialData.fileName = req.file.originalname;
      studyMaterialData.fileSize = req.file.size;
    }

    const studyMaterial = new StudyMaterial(studyMaterialData);
    await studyMaterial.save();

    res.status(201).json({
      message: 'Study material created successfully',
      studyMaterial
    });
  } catch (error) {
    console.error('Error creating study material:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/study-materials/:id
// @desc    Update study material (Admin only)
// @access  Private (Admin)
router.put('/:id', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const studyMaterial = await StudyMaterial.findById(req.params.id);
    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    const updateData = { ...req.body };
    
    // Handle tags array
    if (req.body.tags) {
      updateData.tags = JSON.parse(req.body.tags);
    }

    // Handle boolean fields
    if (req.body.isPremium !== undefined) {
      updateData.isPremium = req.body.isPremium === 'true';
    }
    if (req.body.isPublic !== undefined) {
      updateData.isPublic = req.body.isPublic !== 'false';
    }

    // Add file information if new file uploaded
    if (req.file) {
      updateData.fileUrl = `/uploads/study-materials/${req.file.filename}`;
      updateData.fileName = req.file.originalname;
      updateData.fileSize = req.file.size;
    }

    const updatedStudyMaterial = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: 'Study material updated successfully',
      studyMaterial: updatedStudyMaterial
    });
  } catch (error) {
    console.error('Error updating study material:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/study-materials/:id
// @desc    Delete study material (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const studyMaterial = await StudyMaterial.findById(req.params.id);
    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    await StudyMaterial.findByIdAndDelete(req.params.id);

    res.json({ message: 'Study material deleted successfully' });
  } catch (error) {
    console.error('Error deleting study material:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/study-materials/:id/download
// @desc    Record download and get download URL
// @access  Private
router.post('/:id/download', authenticateToken, async (req, res) => {
  try {
    const studyMaterial = await StudyMaterial.findById(req.params.id);
    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    // Check if user has access to premium content
    if (studyMaterial.isPremium && req.user.role !== 'admin') {
      // Check if user has premium subscription or course enrollment
      // This logic can be extended based on your subscription model
      return res.status(403).json({ error: 'Premium content requires subscription' });
    }

    // Increment download count
    await studyMaterial.incrementDownloads();

    res.json({
      downloadUrl: studyMaterial.fileUrl,
      fileName: studyMaterial.fileName
    });
  } catch (error) {
    console.error('Error downloading study material:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/study-materials/:id/rate
// @desc    Rate a study material
// @access  Private
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const studyMaterial = await StudyMaterial.findById(req.params.id);
    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    await studyMaterial.addRating(rating);

    res.json({
      message: 'Rating added successfully',
      newRating: studyMaterial.rating,
      ratingCount: studyMaterial.ratingCount
    });
  } catch (error) {
    console.error('Error rating study material:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/study-materials/categories
// @desc    Get all available categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await StudyMaterial.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/study-materials/subjects
// @desc    Get all available subjects
// @access  Public
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await StudyMaterial.distinct('subject');
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 