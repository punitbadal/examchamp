const express = require('express');
const multer = require('multer');
const Papa = require('papaparse');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for bulk import
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// @route   POST /api/bulk-import/content
// @desc    Bulk import categories, subjects, chapters, and topics via CSV
// @access  Private (Admin only)
router.post('/content', 
  authenticateToken,
  authorize('admin', 'super_admin'),
  upload.single('csv'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    try {
      const csvData = req.file.buffer.toString();
      const { data, errors } = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true
      });

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'CSV parsing errors',
          errors: errors.slice(0, 5)
        });
      }

      if (data.length === 0) {
        return res.status(400).json({ error: 'CSV file is empty' });
      }

      const results = {
        categories: { created: 0, skipped: 0, errors: [] },
        subjects: { created: 0, skipped: 0, errors: [] },
        chapters: { created: 0, skipped: 0, errors: [] },
        topics: { created: 0, skipped: 0, errors: [] }
      };

      // Track created entities to avoid duplicates
      const createdCategories = new Map();
      const createdSubjects = new Map();
      const createdChapters = new Map();
      
      // Debug logging
      console.log(`Processing ${data.length} rows for bulk import`);

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 because of 0-indexing and header row

        try {
          // 1. Create Category (if not exists)
          let category = null;
          if (row.category) {
            const categoryName = row.category.trim();
            if (!createdCategories.has(categoryName)) {
              // Check if category already exists in database
              let existingCategory = await Category.findOne({ name: categoryName });
              if (!existingCategory) {
                category = new Category({
                  name: categoryName,
                  description: row.category_description || '',
                  color: row.category_color || '#3B82F6',
                  icon: row.category_icon || '🏷️',
                  order: parseInt(row.category_order) || 0,
                  isActive: true,
                  createdBy: req.user._id
                });
                await category.save();
                results.categories.created++;
                createdCategories.set(categoryName, category._id);
              } else {
                createdCategories.set(categoryName, existingCategory._id);
                results.categories.skipped++;
              }
            }
          }

          // 2. Create Subject (if not exists)
          let subject = null;
          if (row.subject_name && row.subject_code) {
            const subjectKey = `${row.subject_name.trim()}-${row.subject_code.trim()}`;
            console.log(`Processing subject: ${row.subject_name} (${row.subject_code})`);
            
            if (!createdSubjects.has(subjectKey)) {
              // Check if subject already exists
              let existingSubject = await Subject.findOne({ 
                $or: [
                  { name: row.subject_name.trim() },
                  { code: row.subject_code.trim() }
                ]
              });
              
              if (!existingSubject) {
                subject = new Subject({
                  name: row.subject_name.trim(),
                  code: row.subject_code.trim(),
                  description: row.subject_description || '',
                  category: row.category || 'General',
                  difficulty: row.subject_difficulty || 'Intermediate',
                  icon: row.subject_icon || '',
                  color: row.subject_color || '#3B82F6',
                  order: parseInt(row.subject_order) || 0,
                  isActive: true,
                  createdBy: req.user._id
                });
                await subject.save();
                console.log(`Created subject: ${subject.name} with ID: ${subject._id}`);
                results.subjects.created++;
                createdSubjects.set(subjectKey, subject._id);
              } else {
                console.log(`Found existing subject: ${existingSubject.name} with ID: ${existingSubject._id}`);
                createdSubjects.set(subjectKey, existingSubject._id);
                results.subjects.skipped++;
              }
            } else {
              const subjectId = createdSubjects.get(subjectKey);
              console.log(`Looking up existing subject with ID: ${subjectId}`);
              subject = await Subject.findById(subjectId);
              if (!subject) {
                console.log(`Subject ID ${subjectId} not found in database, removing from map`);
                createdSubjects.delete(subjectKey);
                continue;
              }
              console.log(`Found subject in map: ${subject.name}`);
            }
          } else {
            console.log(`Skipping subject creation - missing data: subject_name=${row.subject_name}, subject_code=${row.subject_code}`);
          }

          // 3. Create Chapter (if not exists)
          let chapter = null;
          if (row.chapter_name && row.chapter_code && subject) {
            const chapterKey = `${subject._id}-${row.chapter_code.trim()}`;
            console.log(`Processing chapter: ${row.chapter_name} (${row.chapter_code}) for subject: ${subject.name}`);
            
            if (!createdChapters.has(chapterKey)) {
              // Check if chapter already exists
              let existingChapter = await Chapter.findOne({
                subjectId: subject._id,
                code: row.chapter_code.trim()
              });
              
              if (!existingChapter) {
                chapter = new Chapter({
                  name: row.chapter_name.trim(),
                  code: row.chapter_code.trim(),
                  description: row.chapter_description || '',
                  subjectId: subject._id,
                  subjectName: subject.name,
                  chapterNumber: parseInt(row.chapter_number) || 1,
                  difficulty: row.chapter_difficulty || 'Medium',
                  weightage: parseFloat(row.chapter_weightage) || 0,
                  estimatedHours: parseFloat(row.chapter_estimated_hours) || 0,
                  syllabus: row.chapter_syllabus || '',
                  learningObjectives: row.chapter_learning_objectives ? 
                    row.chapter_learning_objectives.split(',').map(obj => obj.trim()) : [],
                  prerequisites: row.chapter_prerequisites ? 
                    row.chapter_prerequisites.split(',').map(pre => pre.trim()) : [],
                  isActive: true,
                  createdBy: req.user._id
                });
                await chapter.save();
                console.log(`Created chapter: ${chapter.name} with ID: ${chapter._id}`);
                results.chapters.created++;
                createdChapters.set(chapterKey, chapter._id);
              } else {
                console.log(`Found existing chapter: ${existingChapter.name} with ID: ${existingChapter._id}`);
                createdChapters.set(chapterKey, existingChapter._id);
                results.chapters.skipped++;
              }
            } else {
              const chapterId = createdChapters.get(chapterKey);
              console.log(`Looking up existing chapter with ID: ${chapterId}`);
              chapter = await Chapter.findById(chapterId);
              if (!chapter) {
                console.log(`Chapter ID ${chapterId} not found in database, removing from map`);
                // If chapter ID exists in map but not in database, remove from map and recreate
                createdChapters.delete(chapterKey);
                continue; // This will retry creating the chapter in the next iteration
              }
              console.log(`Found chapter in map: ${chapter.name}`);
            }
          } else {
            console.log(`Skipping chapter creation - missing data: chapter_name=${row.chapter_name}, chapter_code=${row.chapter_code}, subject=${subject ? 'exists' : 'missing'}`);
          }

          // 4. Create Topic (if not exists)
          if (row.topic_name && row.topic_code && chapter) {
            console.log(`Processing topic: ${row.topic_name} (${row.topic_code}) for chapter: ${chapter.name}`);
            
            // Check if topic already exists
            let existingTopic = await Topic.findOne({
              chapterId: chapter._id,
              code: row.topic_code.trim()
            });
            
            if (!existingTopic) {
              const topic = new Topic({
                name: row.topic_name.trim(),
                code: row.topic_code.trim(),
                description: row.topic_description || '',
                subjectId: subject._id,
                subjectName: subject.name,
                chapterId: chapter._id,
                chapterName: chapter.name,
                topicNumber: parseInt(row.topic_number) || 1,
                difficulty: row.topic_difficulty || 'Medium',
                weightage: parseFloat(row.topic_weightage) || 0,
                estimatedHours: parseFloat(row.topic_estimated_hours) || 0,
                content: row.topic_content || '',
                learningObjectives: row.topic_learning_objectives ? 
                  row.topic_learning_objectives.split(',').map(obj => obj.trim()) : [],
                keyConcepts: row.topic_key_concepts ? 
                  row.topic_key_concepts.split(',').map(concept => concept.trim()) : [],
                formulas: row.topic_formulas ? 
                  row.topic_formulas.split(',').map(formula => formula.trim()) : [],
                isActive: true,
                createdBy: req.user._id
              });
              await topic.save();
              console.log(`Created topic: ${topic.name} with ID: ${topic._id}`);
              results.topics.created++;
            } else {
              console.log(`Skipped existing topic: ${existingTopic.name}`);
              results.topics.skipped++;
            }
          } else {
            console.log(`Skipping topic creation - missing data: topic_name=${row.topic_name}, topic_code=${row.topic_code}, chapter=${chapter ? 'exists' : 'missing'}`);
          }

        } catch (error) {
          const errorMsg = `Row ${rowNumber}: ${error.message}`;
          if (error.message.includes('category')) {
            results.categories.errors.push(errorMsg);
          } else if (error.message.includes('subject')) {
            results.subjects.errors.push(errorMsg);
          } else if (error.message.includes('chapter')) {
            results.chapters.errors.push(errorMsg);
          } else if (error.message.includes('topic')) {
            results.topics.errors.push(errorMsg);
          } else {
            results.topics.errors.push(errorMsg);
          }
        }
      }

      // Calculate totals
      const totalCreated = results.categories.created + results.subjects.created + 
                          results.chapters.created + results.topics.created;
      const totalSkipped = results.categories.skipped + results.subjects.skipped + 
                           results.chapters.skipped + results.topics.skipped;
      const totalErrors = results.categories.errors.length + results.subjects.errors.length + 
                         results.chapters.errors.length + results.topics.errors.length;

      res.status(201).json({
        message: 'Bulk import completed successfully',
        summary: {
          totalCreated,
          totalSkipped,
          totalErrors
        },
        details: results
      });

    } catch (error) {
      res.status(500).json({
        error: 'Bulk import failed',
        message: error.message
      });
    }
  })
);

// @route   GET /api/bulk-import/template
// @desc    Download CSV template for bulk import
// @access  Private (Admin only)
router.get('/template', 
  authenticateToken,
  authorize('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const templateHeaders = [
      'category',
      'subject_name',
      'subject_code', 
      'subject_description',
      'subject_difficulty',
      'subject_icon',
      'subject_color',
      'chapter_name',
      'chapter_code',
      'chapter_description',
      'chapter_difficulty',
      'chapter_weightage',
      'chapter_estimated_hours',
      'chapter_syllabus',
      'chapter_learning_objectives',
      'chapter_prerequisites',
      'topic_name',
      'topic_code',
      'topic_number',
      'topic_description',
      'topic_difficulty',
      'topic_weightage',
      'topic_estimated_hours',
      'topic_content',
      'topic_learning_objectives',
      'topic_key_concepts',
      'topic_formulas'
    ];

    const sampleData = [
      'Science',
      'Physics',
      'PHY',
      'Physics is the study of matter, energy, and their interactions.',
      'Intermediate',
      '🔬',
      '#3B82F6',
      'Mechanics',
      'MECH',
      'Study of motion and forces in the physical world',
      'Medium',
      '25',
      '40',
      'Newton\'s laws, kinematics, dynamics, energy conservation',
      'Understand Newton\'s laws of motion,Apply conservation of energy principles',
      'Basic algebra and trigonometry',
      'Kinematics',
      'KIN',
      '1',
      'Study of motion without considering forces',
      'Easy',
      '15',
      '20',
      'Kinematics deals with the description of motion. Key concepts include displacement, velocity, and acceleration.',
      'Define displacement, velocity, and acceleration,Apply kinematic equations to solve problems',
      'Displacement, Velocity, Acceleration, Time',
      'v = v₀ + at, s = v₀t + ½at²'
    ];

    const csvContent = [
      templateHeaders.join(','),
      sampleData.join(',')
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bulk-import-template.csv"');
    res.send(csvContent);
  })
);

module.exports = router; 