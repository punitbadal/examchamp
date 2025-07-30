const express = require('express');
const router = express.Router();
const proctoringService = require('../services/proctoringService');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const ExamAttempt = require('../models/ExamAttempt');
const User = require('../models/User');

// Start proctoring session
router.post('/session/start', auth, async (req, res) => {
  try {
    const { examId, examConfig } = req.body;
    const userId = req.user.id;

    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const session = proctoringService.startSession(examId, userId, examConfig);
    
    logger.info(`Proctoring session started for exam ${examId}, user ${userId}`);
    
    res.status(201).json({
      success: true,
      message: 'Proctoring session started',
      sessionId: `${examId}-${userId}`,
      session
    });
  } catch (error) {
    logger.error('Error starting proctoring session:', error);
    res.status(500).json({ error: 'Failed to start proctoring session' });
  }
});

// Update activity
router.post('/session/activity', auth, async (req, res) => {
  try {
    const { examId } = req.body;
    const userId = req.user.id;

    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    proctoringService.updateActivity(examId, userId);
    
    res.json({
      success: true,
      message: 'Activity updated'
    });
  } catch (error) {
    logger.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Record tab switch
router.post('/session/tab-switch', auth, async (req, res) => {
  try {
    const { examId, details } = req.body;
    const userId = req.user.id;

    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const violation = proctoringService.recordTabSwitch(examId, userId);
    
    if (violation) {
      logger.warn(`Tab switch violation recorded for exam ${examId}, user ${userId}`);
      
      res.json({
        success: true,
        message: 'Tab switch recorded',
        violation
      });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    logger.error('Error recording tab switch:', error);
    res.status(500).json({ error: 'Failed to record tab switch' });
  }
});

// Record full screen exit
router.post('/session/fullscreen-exit', auth, async (req, res) => {
  try {
    const { examId, details } = req.body;
    const userId = req.user.id;

    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const violation = proctoringService.recordFullScreenExit(examId, userId);
    
    if (violation) {
      logger.warn(`Full screen exit violation recorded for exam ${examId}, user ${userId}`);
      
      res.json({
        success: true,
        message: 'Full screen exit recorded',
        violation
      });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    logger.error('Error recording full screen exit:', error);
    res.status(500).json({ error: 'Failed to record full screen exit' });
  }
});

// Check inactivity
router.post('/session/check-inactivity', auth, async (req, res) => {
  try {
    const { examId } = req.body;
    const userId = req.user.id;

    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const violation = proctoringService.checkInactivity(examId, userId);
    
    if (violation) {
      logger.warn(`Inactivity violation detected for exam ${examId}, user ${userId}`);
      
      res.json({
        success: true,
        message: 'Inactivity detected',
        violation
      });
    } else {
      res.json({
        success: true,
        message: 'No inactivity detected'
      });
    }
  } catch (error) {
    logger.error('Error checking inactivity:', error);
    res.status(500).json({ error: 'Failed to check inactivity' });
  }
});

// Get session status
router.get('/session/:examId/status', auth, async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    const status = proctoringService.getSessionStatus(examId, userId);
    
    if (status) {
      res.json({
        success: true,
        status
      });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    logger.error('Error getting session status:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

// End proctoring session
router.post('/session/end', auth, async (req, res) => {
  try {
    const { examId } = req.body;
    const userId = req.user.id;

    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const sessionSummary = proctoringService.endSession(examId, userId);
    
    if (sessionSummary) {
      logger.info(`Proctoring session ended for exam ${examId}, user ${userId}`);
      
      res.json({
        success: true,
        message: 'Proctoring session ended',
        summary: sessionSummary
      });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    logger.error('Error ending proctoring session:', error);
    res.status(500).json({ error: 'Failed to end proctoring session' });
  }
});

// Get all active sessions (admin only)
router.get('/sessions/active', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activeSessions = proctoringService.getActiveSessions();
    
    res.json({
      success: true,
      sessions: activeSessions
    });
  } catch (error) {
    logger.error('Error getting active sessions:', error);
    res.status(500).json({ error: 'Failed to get active sessions' });
  }
});

// Get violation statistics (admin only)
router.get('/statistics', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = proctoringService.getViolationStats();
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    logger.error('Error getting violation statistics:', error);
    res.status(500).json({ error: 'Failed to get violation statistics' });
  }
});

// Clean up old sessions (admin only)
router.post('/cleanup', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { maxAge } = req.body;
    const cleanedCount = proctoringService.cleanupOldSessions(maxAge);
    
    logger.info(`Cleaned up ${cleanedCount} old proctoring sessions`);
    
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} old sessions`,
      cleanedCount
    });
  } catch (error) {
    logger.error('Error cleaning up old sessions:', error);
    res.status(500).json({ error: 'Failed to clean up old sessions' });
  }
});

// Get session violations (admin only)
router.get('/session/:examId/:userId/violations', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { examId, userId } = req.params;
    const status = proctoringService.getSessionStatus(examId, userId);
    
    if (status) {
      res.json({
        success: true,
        violations: status.violations
      });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    logger.error('Error getting session violations:', error);
    res.status(500).json({ error: 'Failed to get session violations' });
  }
});

// Real-time violation alerts (WebSocket endpoint) - Disabled for now
// router.ws('/alerts', (ws, req) => {
//   logger.info('WebSocket connection established for proctoring alerts');
//   
//   ws.on('message', (message) => {
//     try {
//       const data = JSON.parse(message);
//       const { examId, userId, violationType, details } = data;
//       
//       // Process violation and send alert
//       let violation = null;
//       
//       switch (violationType) {
//         case 'tab_switch':
//           violation = proctoringService.recordTabSwitch(examId, userId);
//           break;
//         case 'fullscreen_exit':
//           violation = proctoringService.recordFullScreenExit(examId, userId);
//           break;
//         case 'inactivity':
//           violation = proctoringService.checkInactivity(examId, userId);
//           break;
//         default:
//           logger.warn(`Unknown violation type: ${violationType}`);
//       }
//       
//       if (violation) {
//         // Send alert to admin dashboard
//         ws.send(JSON.stringify({
//           type: 'violation_alert',
//           examId,
//           userId,
//           violation
//         }));
//       }
//     } catch (error) {
//       logger.error('Error processing WebSocket message:', error);
//     }
//   });
//   
//   ws.on('close', () => {
//     logger.info('WebSocket connection closed for proctoring alerts');
//   });
// });

// Get active proctoring sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get active exam attempts with proctoring data
    const activeSessions = await ExamAttempt.find({ 
      status: 'in_progress',
      'proctoring.startTime': { $exists: true }
    }).populate('userId', 'firstName lastName email')
      .populate('examId', 'title examCode');

    const sessions = activeSessions.map(attempt => ({
      id: attempt._id.toString(),
      studentName: `${attempt.userId.firstName} ${attempt.userId.lastName}`,
      examTitle: attempt.examId.title,
      startTime: attempt.proctoring.startTime,
      status: attempt.proctoring.status || 'active',
      suspiciousScore: attempt.proctoring.suspiciousScore || 0,
      webcamStatus: attempt.proctoring.webcamStatus || false,
      microphoneStatus: attempt.proctoring.microphoneStatus || false,
      screenShareStatus: attempt.proctoring.screenShareStatus || false,
      events: attempt.proctoring.violations || []
    }));

    res.json({ sessions, alerts: [] });
  } catch (error) {
    logger.error('Error fetching proctoring sessions:', error);
    res.status(500).json({ error: 'Failed to fetch proctoring sessions' });
  }
});

module.exports = router; 