const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');

// Store active connections
const activeConnections = new Map();
const examRooms = new Map();

const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Store connection
    activeConnections.set(socket.userId, socket);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle exam room joining
    socket.on('join-exam', async (data) => {
      try {
        const { examId, attemptId } = data;

        // Verify exam access
        const exam = await Exam.findById(examId);
        if (!exam) {
          socket.emit('error', { message: 'Exam not found' });
          return;
        }

        // Verify attempt
        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt || attempt.userId.toString() !== socket.userId) {
          socket.emit('error', { message: 'Invalid attempt' });
          return;
        }

        // Join exam room
        const roomName = `exam:${examId}`;
        socket.join(roomName);
        socket.examId = examId;
        socket.attemptId = attemptId;

        // Track exam room
        if (!examRooms.has(examId)) {
          examRooms.set(examId, new Set());
        }
        examRooms.get(examId).add(socket.userId);

        // Send exam info
        socket.emit('exam-joined', {
          examId,
          attemptId,
          timeRemaining: attempt.timeRemaining,
          totalQuestions: attempt.answers.length
        });

        console.log(`User ${socket.userId} joined exam ${examId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join exam' });
      }
    });

    // Handle answer submission
    socket.on('submit-answer', async (data) => {
      try {
        const { questionId, answer, timeSpent } = data;

        if (!socket.attemptId) {
          socket.emit('error', { message: 'No active attempt' });
          return;
        }

        // Update attempt in database
        const attempt = await ExamAttempt.findById(socket.attemptId);
        if (!attempt) {
          socket.emit('error', { message: 'Attempt not found' });
          return;
        }

        // Update answer
        attempt.updateAnswer(questionId, answer, timeSpent);
        await attempt.save();

        // Emit to user
        socket.emit('answer-submitted', {
          questionId,
          success: true
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    // Handle question marking for review
    socket.on('mark-review', async (data) => {
      try {
        const { questionId, isMarked } = data;

        if (!socket.attemptId) {
          socket.emit('error', { message: 'No active attempt' });
          return;
        }

        const attempt = await ExamAttempt.findById(socket.attemptId);
        if (!attempt) {
          socket.emit('error', { message: 'Attempt not found' });
          return;
        }

        attempt.markForReview(questionId, isMarked);
        await attempt.save();

        socket.emit('review-marked', {
          questionId,
          isMarked,
          success: true
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to mark for review' });
      }
    });

    // Handle proctoring events
    socket.on('proctoring-event', async (data) => {
      try {
        const { eventType, details } = data;

        if (!socket.attemptId) {
          return;
        }

        const attempt = await ExamAttempt.findById(socket.attemptId);
        if (!attempt) {
          return;
        }

        // Update proctoring data
        switch (eventType) {
          case 'tab-switch':
            attempt.proctoringData.tabSwitches += 1;
            break;
          case 'copy-paste':
            attempt.proctoringData.copyPasteAttempts += 1;
            break;
          case 'suspicious-activity':
            attempt.proctoringData.suspiciousActivities.push({
              type: details.type,
              timestamp: new Date()
            });
            break;
          case 'webcam-snapshot':
            attempt.proctoringData.webcamSnapshots.push({
              url: details.url,
              timestamp: new Date()
            });
            break;
        }

        await attempt.save();

        // Emit to admin if suspicious activity
        if (eventType === 'suspicious-activity') {
          io.to(`admin:${socket.examId}`).emit('suspicious-activity', {
            userId: socket.userId,
            user: socket.user.getPublicProfile(),
            eventType: details.type,
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('Proctoring event error:', error);
      }
    });

    // Handle heartbeat for connection monitoring
    socket.on('heartbeat', () => {
      socket.emit('heartbeat-ack');
    });

    // Handle exam submission
    socket.on('submit-exam', async () => {
      try {
        if (!socket.attemptId) {
          socket.emit('error', { message: 'No active attempt' });
          return;
        }

        const attempt = await ExamAttempt.findById(socket.attemptId);
        if (!attempt) {
          socket.emit('error', { message: 'Attempt not found' });
          return;
        }

        // Calculate final score
        const Question = require('../models/Question');
        const questions = await Question.find({ examId: attempt.examId });
        let totalScore = 0;

        for (const answer of attempt.answers) {
          const question = questions.find(q => q._id.toString() === answer.questionId.toString());
          if (question && answer.answer !== null && answer.answer !== undefined) {
            const score = question.calculateScore(answer.answer);
            answer.score = score;
            answer.isCorrect = question.isCorrect(answer.answer);
            totalScore += score;
          }
        }

        // Update attempt
        attempt.totalScore = totalScore;
        attempt.percentage = attempt.maxScore > 0 ? Math.round((totalScore / attempt.maxScore) * 100) : 0;
        attempt.status = 'submitted';
        attempt.submittedAt = new Date();
        attempt.endTime = new Date();

        await attempt.save();

        // Calculate rank
        const allAttempts = await ExamAttempt.find({
          examId: attempt.examId,
          status: { $in: ['submitted', 'completed'] }
        }).sort({ totalScore: -1, submittedAt: 1 });

        const rank = allAttempts.findIndex(a => a._id.toString() === socket.attemptId.toString()) + 1;
        const percentile = Math.round(((allAttempts.length - rank + 1) / allAttempts.length) * 100);

        attempt.rank = rank;
        attempt.percentile = percentile;
        await attempt.save();

        // Emit result
        socket.emit('exam-submitted', {
          totalScore: attempt.totalScore,
          maxScore: attempt.maxScore,
          percentage: attempt.percentage,
          rank,
          percentile,
          timeSpent: attempt.timeRemaining
        });

        // Leave exam room
        socket.leave(`exam:${socket.examId}`);
        if (examRooms.has(socket.examId)) {
          examRooms.get(socket.examId).delete(socket.userId);
        }

        console.log(`User ${socket.userId} submitted exam ${socket.examId}`);

      } catch (error) {
        socket.emit('error', { message: 'Failed to submit exam' });
      }
    });

    // Handle admin joining exam room
    socket.on('admin-join-exam', async (data) => {
      try {
        const { examId } = data;

        // Verify admin role
        if (socket.user.role !== 'admin' && socket.user.role !== 'super_admin') {
          socket.emit('error', { message: 'Admin access required' });
          return;
        }

        const roomName = `admin:${examId}`;
        socket.join(roomName);

        // Get exam stats
        const exam = await Exam.findById(examId);
        const activeAttempts = await ExamAttempt.find({
          examId,
          status: { $in: ['started', 'in_progress'] }
        }).populate('userId', 'firstName lastName email');

        socket.emit('admin-exam-joined', {
          examId,
          exam,
          activeAttempts: activeAttempts.length,
          participants: activeAttempts.map(a => ({
            userId: a.userId._id,
            user: a.userId.getPublicProfile(),
            startTime: a.startTime,
            timeRemaining: a.timeRemaining,
            questionsAnswered: a.answers.filter(ans => ans.answer !== null).length
          }))
        });

        console.log(`Admin ${socket.userId} joined exam ${examId}`);

      } catch (error) {
        socket.emit('error', { message: 'Failed to join exam as admin' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Remove from active connections
      activeConnections.delete(socket.userId);

      // Remove from exam rooms
      if (socket.examId && examRooms.has(socket.examId)) {
        examRooms.get(socket.examId).delete(socket.userId);
      }
    });
  });

  // Broadcast exam countdown updates
  setInterval(async () => {
    for (const [examId, participants] of examRooms.entries()) {
      if (participants.size > 0) {
        try {
          const exam = await Exam.findById(examId);
          if (exam && exam.isActive) {
            const timeRemaining = exam.getTimeUntilEnd();
            
            io.to(`exam:${examId}`).emit('countdown-update', {
              examId,
              timeRemaining,
              isActive: exam.isActive
            });

            // Auto-submit if time is up
            if (timeRemaining <= 0) {
              const attempts = await ExamAttempt.find({
                examId,
                status: { $in: ['started', 'in_progress'] }
              });

              for (const attempt of attempts) {
                // Trigger auto-submission
                attempt.status = 'timeout';
                attempt.endTime = new Date();
                await attempt.save();

                io.to(`user:${attempt.userId}`).emit('exam-timeout', {
                  examId,
                  attemptId: attempt._id
                });
              }
            }
          }
        } catch (error) {
          console.error('Countdown update error:', error);
        }
      }
    }
  }, 1000); // Update every second

  return io;
};

module.exports = { setupSocketHandlers }; 