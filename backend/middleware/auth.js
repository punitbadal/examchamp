const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');

// JWT token verification middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.security('Authentication failed: No token provided', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      return next(new AuthenticationError('Access token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      logger.security('Authentication failed: Invalid or inactive user', {
        userId: decoded.userId,
        ip: req.ip,
        path: req.path
      });
      return next(new AuthenticationError('Invalid or inactive user'));
    }

    // Add user to request object
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    // Log successful authentication
    logger.userActivity('User authenticated', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      path: req.path
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.security('Authentication failed: Invalid token', {
        ip: req.ip,
        path: req.path,
        error: error.message
      });
      return next(new AuthenticationError('Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.security('Authentication failed: Token expired', {
        ip: req.ip,
        path: req.path
      });
      return next(new AuthenticationError('Token expired'));
    }

    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      path: req.path
    });
    return next(new AuthenticationError('Authentication failed'));
  }
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorization check:', {
      hasUser: !!req.user,
      userRole: req.user?.role,
      requiredRoles: roles,
      path: req.path
    });

    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      logger.security('Authorization failed: Insufficient permissions', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        path: req.path
      });
      return next(new AuthorizationError('Insufficient permissions'));
    }

    console.log('Authorization successful for role:', req.user.role);
    next();
  };
};

// Admin only middleware
const requireAdmin = authorize('admin', 'super_admin');

// Super admin only middleware
const requireSuperAdmin = authorize('super_admin');

// Student only middleware
const requireStudent = authorize('student');

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id;
      req.userRole = user.role;
    }

    next();
  } catch (error) {
    // Don't fail on token errors, just continue without auth
    next();
  }
};

// Rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
  const key = `${req.ip}-${(req.body && req.body.email) || (req.body && req.body.username) || 'unknown'}`;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5;

  // Simple in-memory rate limiting (use Redis in production)
  if (!req.app.locals.authAttempts) {
    req.app.locals.authAttempts = new Map();
  }

  const attempts = req.app.locals.authAttempts.get(key) || { count: 0, resetTime: Date.now() + windowMs };

  if (Date.now() > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = Date.now() + windowMs;
  }

  attempts.count++;

  if (attempts.count > maxAttempts) {
    logger.security('Authentication rate limit exceeded', {
      ip: req.ip,
      email: req.body && req.body.email,
      attempts: attempts.count
    });
    return res.status(429).json({
      error: 'Too many authentication attempts, please try again later',
      retryAfter: Math.ceil((attempts.resetTime - Date.now()) / 1000)
    });
  }

  req.app.locals.authAttempts.set(key, attempts);
  next();
};

// Session validation middleware
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AuthenticationError('Session validation failed'));
    }

    // Check if user's session is still valid
    const lastLogin = new Date(req.user.lastLogin);
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    const now = new Date();

    if (now - lastLogin > sessionTimeout) {
      logger.security('Session expired', {
        userId: req.user._id,
        lastLogin: req.user.lastLogin,
        ip: req.ip
      });
      return next(new AuthenticationError('Session expired'));
    }

    // Update last activity
    req.user.lastLogin = now;
    await req.user.save();

    next();
  } catch (error) {
    logger.error('Session validation error', {
      error: error.message,
      userId: req.user?._id,
      ip: req.ip
    });
    return next(new AuthenticationError('Session validation failed'));
  }
};

// IP-based access control
const ipWhitelist = (allowedIPs) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      logger.security('IP access denied', {
        ip: clientIP,
        allowedIPs,
        path: req.path
      });
      return next(new AuthorizationError('Access denied from this IP'));
    }
    
    next();
  };
};

// Device fingerprinting middleware
const validateDevice = (req, res, next) => {
  const deviceFingerprint = req.headers['x-device-fingerprint'];
  const userAgent = req.get('User-Agent');
  
  if (req.user && deviceFingerprint) {
    // In production, you might want to validate device fingerprints
    // against a database of known devices for the user
    logger.userActivity('Device fingerprint validated', {
      userId: req.user._id,
      deviceFingerprint,
      userAgent,
      ip: req.ip
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  authorize,
  requireAdmin,
  requireSuperAdmin,
  requireStudent,
  optionalAuth,
  authRateLimit,
  validateSession,
  ipWhitelist,
  validateDevice
}; 