const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import production utilities
const logger = require('./utils/logger');
const healthChecker = require('./utils/healthCheck');
const securityMiddleware = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Store server and mongoose globally for graceful shutdown
global.server = server;
global.mongoose = mongoose;

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// MongoDB connection with production settings
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: parseInt(process.env.MONGODB_CONNECTION_POOL_SIZE) || 10,
  serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 30000,
  socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS) || 45000,
  bufferCommands: false
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examtech', mongoOptions)
.then(() => {
  logger.database('Connected to MongoDB', {
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.name
  });
})
.catch(err => {
  logger.error('MongoDB connection error', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Body parser middleware (must come before rate limiting)
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));

// Enable CORS for all routes
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security middleware
// app.use(securityMiddleware.helmet); // Temporarily disabled
// app.use(securityMiddleware.cors); // Temporarily disabled - using direct CORS instead
// app.use(securityMiddleware.requestId); // Temporarily disabled
// app.use(securityMiddleware.securityLogging); // Temporarily disabled
// app.use(securityMiddleware.sanitizeInput); // Temporarily disabled
// app.use(securityMiddleware.validateContentType); // Temporarily disabled
// app.use(securityMiddleware.requestSizeLimit); // Temporarily disabled

// Rate limiting
// app.use('/api/', securityMiddleware.generalRateLimit); // Temporarily disabled
// app.use('/api/auth/', securityMiddleware.authRateLimit); // Temporarily disabled
// app.use('/api/exams/upload', securityMiddleware.uploadRateLimit); // Temporarily disabled
// app.use(securityMiddleware.speedLimit); // Temporarily disabled

// Utility middleware
app.use(compression());
app.use(morgan('combined', { stream: logger.stream }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await healthChecker.runAllChecks();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check endpoint error', {
      error: error.message,
      stack: error.stack
    });
    res.status(503).json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  try {
    const metrics = healthChecker.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to get metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/results', require('./routes/results'));
app.use('/api/users', require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/proctoring', require('./routes/proctoring'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/practice-tests', require('./routes/practice-tests'));
app.use('/api/study-materials', require('./routes/study-materials'));

// Socket.IO authentication middleware
// Temporarily disabled
/*
const jwt = require('jsonwebtoken');
const User = require('./models/User');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    socket.userId = user._id;
    socket.userRole = user.role;
    socket.userEmail = user.email;
    
    logger.userActivity('Socket connection authenticated', {
      userId: user._id,
      email: user.email,
      role: user.role,
      socketId: socket.id
    });
    
    next();
  } catch (error) {
    logger.error('Socket authentication error', {
      error: error.message,
      socketId: socket.id
    });
    next(new Error('Authentication error'));
  }
});
*/

// Socket.IO event handlers
io.on('connection', (socket) => {
  logger.userActivity('User connected', {
    userId: socket.userId,
    email: socket.userEmail,
    role: socket.userRole,
    socketId: socket.id
  });

  // Join exam room
  socket.on('join-exam', async (examId) => {
    try {
      socket.join(`exam-${examId}`);
      socket.examId = examId;
      
      logger.userActivity('User joined exam', {
        userId: socket.userId,
        examId,
        socketId: socket.id
      });
    } catch (error) {
      logger.error('Error joining exam', {
        error: error.message,
        userId: socket.userId,
        examId
      });
    }
  });

  // Leave exam room
  socket.on('leave-exam', (examId) => {
    socket.leave(`exam-${examId}`);
    socket.examId = null;
    
    logger.userActivity('User left exam', {
      userId: socket.userId,
      examId,
      socketId: socket.id
    });
  });

  // Answer submission
  socket.on('submit-answer', async (data) => {
    try {
      const { examId, questionId, answer } = data;
      
      // Emit to other users in the same exam
      socket.to(`exam-${examId}`).emit('answer-submitted', {
        userId: socket.userId,
        questionId,
        answer,
        timestamp: new Date()
      });

      logger.userActivity('Answer submitted', {
        userId: socket.userId,
        examId,
        questionId,
        socketId: socket.id
      });
    } catch (error) {
      logger.error('Error handling answer submission', {
        error: error.message,
        userId: socket.userId,
        examId: data.examId
      });
    }
  });

  // Mark question for review
  socket.on('mark-for-review', (data) => {
    try {
      const { examId, questionId, marked } = data;
      
      socket.to(`exam-${examId}`).emit('question-marked', {
        userId: socket.userId,
        questionId,
        marked,
        timestamp: new Date()
      });

      logger.userActivity('Question marked for review', {
        userId: socket.userId,
        examId,
        questionId,
        marked,
        socketId: socket.id
      });
    } catch (error) {
      logger.error('Error handling mark for review', {
        error: error.message,
        userId: socket.userId
      });
    }
  });

  // Proctoring events
  socket.on('proctoring-event', async (data) => {
    try {
      const { sessionId, eventType, details, severity } = data;
      
      // Emit to admin dashboard
      socket.to('admin-dashboard').emit('proctoring-alert', {
        sessionId,
        eventType,
        details,
        severity,
        userId: socket.userId,
        timestamp: new Date()
      });

      logger.proctoring('Proctoring event', {
        userId: socket.userId,
        eventType,
        severity,
        details,
        socketId: socket.id
      });
    } catch (error) {
      logger.error('Error handling proctoring event', {
        error: error.message,
        userId: socket.userId
      });
    }
  });

  // Join admin dashboard
  socket.on('join-admin-dashboard', () => {
    if (socket.userRole === 'admin' || socket.userRole === 'super_admin') {
      socket.join('admin-dashboard');
      
      logger.userActivity('Admin joined dashboard', {
        userId: socket.userId,
        role: socket.userRole,
        socketId: socket.id
      });
    }
  });

  // Real-time exam countdown
  socket.on('start-exam-countdown', (examId) => {
    socket.join(`countdown-${examId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.userActivity('User disconnected', {
      userId: socket.userId,
      email: socket.userEmail,
      role: socket.userRole,
      socketId: socket.id
    });
  });
});

// Periodic countdown broadcast
setInterval(() => {
  // This would typically query active exams and broadcast countdowns
  // For now, we'll just log that the service is running
  logger.info('Countdown service running');
}, 1000);

// Start periodic health checks in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_HEALTH_CHECKS === 'true') {
  healthChecker.startPeriodicChecks(60000); // Every minute
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  // Stop health checks
  healthChecker.stopPeriodicChecks();
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    mongoose.connection.close(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/examtech'
  });
});

module.exports = { app, server, io }; 