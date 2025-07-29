const logger = require('../utils/logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  const errorContext = {
    requestId: req.id || 'unknown',
    method: req.method || 'unknown',
    url: req.url || 'unknown',
    ip: req.ip || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

  // Handle different types of errors
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = new AppError(message, 400);
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value';
    error = new AppError(message, 400);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AuthenticationError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AuthenticationError(message);
  }

  if (err.name === 'MongoError') {
    if (err.code === 11000) {
      const message = 'Duplicate field value';
      error = new AppError(message, 400);
    } else {
      const message = 'Database error';
      error = new AppError(message, 500);
    }
  }

  // Log error based on severity
  if (error.statusCode >= 500) {
    logger.error('Server error', {
      ...errorContext,
      error: err.message,
      stack: err.stack,
      statusCode: error.statusCode
    });
  } else if (error.statusCode >= 400) {
    logger.warn('Client error', {
      ...errorContext,
      error: err.message,
      statusCode: error.statusCode
    });
  }

  // Send error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    status: error.status || 'error',
    message: error.message || 'Something went wrong',
    ...(isDevelopment && { stack: err.stack }),
    ...(isDevelopment && { error: err.message }),
    requestId: req.id || 'unknown',
    timestamp: new Date().toISOString()
  };

  // Add validation errors if present
  if (err.errors && Object.keys(err.errors).length > 0) {
    errorResponse.errors = Object.values(err.errors).map(val => val.message);
  }

  res.status(error.statusCode || 500).json(errorResponse);
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Unhandled promise rejection handler
const unhandledRejectionHandler = (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
  
  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

// Uncaught exception handler
const uncaughtExceptionHandler = (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // In production, exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  // Close server
  if (global.server) {
    global.server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connection
      if (global.mongoose) {
        global.mongoose.connection.close(() => {
          logger.info('Database connection closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  } else {
    process.exit(0);
  }
};

// Set up global error handlers
process.on('unhandledRejection', unhandledRejectionHandler);
process.on('uncaughtException', uncaughtExceptionHandler);
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
}; 