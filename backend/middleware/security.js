const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('../utils/logger');

// Rate limiting configuration
const createRateLimit = (windowMs, max, message, keyGenerator = null) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => {
      return req.ip || req.connection.remoteAddress;
    }),
    handler: (req, res) => {
      logger.security('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Speed limiting configuration
const createSpeedLimit = (windowMs, delayAfter, delayMs) => {
  return slowDown({
    windowMs,
    delayAfter,
    delayMs,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
    handler: (req, res) => {
      logger.security('Speed limit exceeded', {
        ip: req.ip,
        path: req.path
      });
    }
  });
};

// Security middleware configuration
const securityMiddleware = {
  // General rate limiting
  generalRateLimit: createRateLimit(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    'Too many requests from this IP, please try again later.'
  ),

  // Authentication rate limiting
  authRateLimit: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
    'Too many authentication attempts, please try again later.',
    (req) => `${req.ip}-${(req.body && req.body.email) || (req.body && req.body.username) || 'unknown'}`
  ),

  // API rate limiting
  apiRateLimit: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    200,
    'API rate limit exceeded, please try again later.'
  ),

  // File upload rate limiting
  uploadRateLimit: createRateLimit(
    60 * 60 * 1000, // 1 hour
    10,
    'Too many file uploads, please try again later.'
  ),

  // Speed limiting
  speedLimit: createSpeedLimit(
    15 * 60 * 1000, // 15 minutes
    50, // requests
    () => 500 // ms delay
  ),

  // Helmet security headers
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'", "ws:", "wss:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    ieNoOpen: true,
    dnsPrefetchControl: { allow: false }
  }),

  // CORS configuration
  cors: cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://yourdomain.com', // Add your production domain
        'https://www.yourdomain.com'
      ];
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.security('CORS blocked request', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400 // 24 hours
  }),

  // Request ID middleware
  requestId: (req, res, next) => {
    req.id = req.headers['x-request-id'] || require('crypto').randomBytes(16).toString('hex');
    res.setHeader('X-Request-ID', req.id);
    next();
  },

  // Security logging middleware
  securityLogging: (req, res, next) => {
    // Log suspicious requests
    const suspiciousPatterns = [
      /\.\.\//, // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /eval\(/i, // Code injection
      /document\.cookie/i, // Cookie theft attempts
    ];

    const userAgent = req.get('User-Agent') || '';
    const url = req.url;
    const method = req.method;

    // Check for suspicious patterns
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(url) || pattern.test(userAgent)
    );

    if (isSuspicious) {
      logger.security('Suspicious request detected', {
        ip: req.ip,
        userAgent,
        url,
        method,
        headers: req.headers
      });
    }

    // Log authentication attempts
    if (req.path.includes('/auth') && req.method === 'POST') {
      logger.security('Authentication attempt', {
        ip: req.ip,
        userAgent,
        path: req.path,
        timestamp: new Date().toISOString()
      });
    }

    next();
  },

  // Input sanitization middleware
  sanitizeInput: (req, res, next) => {
    const sanitize = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          // Remove null bytes and other dangerous characters
          obj[key] = obj[key].replace(/\0/g, '');
          // Trim whitespace
          obj[key] = obj[key].trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };

    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);

    next();
  },

  // Content type validation
  validateContentType: (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({
          error: 'Content-Type must be application/json'
        });
      }
    }
    next();
  },

  // Request size limiting
  requestSizeLimit: (req, res, next) => {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
    let dataLength = 0;

    req.on('data', (chunk) => {
      dataLength += chunk.length;
      if (dataLength > maxSize) {
        logger.security('Request size limit exceeded', {
          ip: req.ip,
          size: dataLength,
          maxSize
        });
        return res.status(413).json({
          error: 'Request entity too large'
        });
      }
    });

    next();
  }
};

module.exports = securityMiddleware; 