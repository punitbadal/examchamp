const mongoose = require('mongoose');
const os = require('os');
const logger = require('./logger');

class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: os.loadavg(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        pid: process.pid
      }
    };
  }

  // Register a health check
  register(name, check) {
    this.checks.set(name, check);
  }

  // Database health check
  async checkDatabase() {
    try {
      const state = mongoose.connection.readyState;
      const isConnected = state === 1;
      
      if (!isConnected) {
        throw new Error(`Database not connected. State: ${state}`);
      }

      // Test database connection with a simple query
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        details: {
          state,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          database: mongoose.connection.name
        }
      };
    } catch (error) {
      logger.error('Database health check failed', {
        error: error.message,
        stack: error.stack
      });
      
      return {
        status: 'unhealthy',
        error: error.message,
        details: {
          state: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port
        }
      };
    }
  }

  // Memory health check
  checkMemory() {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    const isHealthy = memoryUsagePercent < 90; // Alert if > 90%

    return {
      status: isHealthy ? 'healthy' : 'warning',
      details: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        systemTotal: totalMemory,
        systemFree: freeMemory,
        systemUsed: usedMemory,
        usagePercent: memoryUsagePercent
      }
    };
  }

  // CPU health check
  checkCPU() {
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const loadPercent = (loadAvg[0] / cpuCount) * 100;

    const isHealthy = loadPercent < 80; // Alert if > 80%

    return {
      status: isHealthy ? 'healthy' : 'warning',
      details: {
        loadAverage: loadAvg,
        cpuCount,
        loadPercent,
        uptime: os.uptime()
      }
    };
  }

  // Disk health check
  checkDisk() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Check if we can write to the uploads directory
      const uploadsDir = path.join(__dirname, '../uploads');
      const testFile = path.join(uploadsDir, '.health-check');
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Test write access
      fs.writeFileSync(testFile, 'health-check');
      fs.unlinkSync(testFile);
      
      return {
        status: 'healthy',
        details: {
          uploadsDir: uploadsDir,
          writable: true
        }
      };
    } catch (error) {
      logger.error('Disk health check failed', {
        error: error.message
      });
      
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Custom health check
  async runCustomChecks() {
    const results = {};
    
    for (const [name, check] of this.checks) {
      try {
        results[name] = await check();
      } catch (error) {
        logger.error(`Custom health check '${name}' failed`, {
          error: error.message
        });
        
        results[name] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    return results;
  }

  // Run all health checks
  async runAllChecks() {
    const startTime = Date.now();
    
    try {
      const results = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: await this.checkDatabase(),
          memory: this.checkMemory(),
          cpu: this.checkCPU(),
          disk: this.checkDisk(),
          custom: await this.runCustomChecks()
        }
      };

      // Determine overall health
      const allChecks = Object.values(results.checks).flat();
      const hasUnhealthy = allChecks.some(check => 
        check.status === 'unhealthy'
      );
      const hasWarning = allChecks.some(check => 
        check.status === 'warning'
      );

      results.status = hasUnhealthy ? 'unhealthy' : (hasWarning ? 'warning' : 'healthy');
      results.responseTime = Date.now() - startTime;

      // Log health check results
      if (results.status === 'unhealthy') {
        logger.error('Health check failed', results);
      } else if (results.status === 'warning') {
        logger.warn('Health check warning', results);
      } else {
        logger.info('Health check passed', results);
      }

      return results;
    } catch (error) {
      logger.error('Health check error', {
        error: error.message,
        stack: error.stack
      });
      
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }

  // Get system metrics
  getMetrics() {
    const memoryUsage = process.memoryUsage();
    const loadAvg = os.loadavg();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        systemTotal: os.totalmem(),
        systemFree: os.freemem()
      },
      cpu: {
        loadAverage: loadAvg,
        cpuCount: os.cpus().length,
        uptime: os.uptime()
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        pid: process.pid,
        hostname: os.hostname()
      }
    };
  }

  // Start periodic health checks
  startPeriodicChecks(intervalMs = 60000) { // Default: 1 minute
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.runAllChecks();
        
        // Alert on unhealthy status
        if (health.status === 'unhealthy') {
          logger.error('Periodic health check failed', health);
          // In production, you might want to send alerts here
        }
      } catch (error) {
        logger.error('Periodic health check error', {
          error: error.message,
          stack: error.stack
        });
      }
    }, intervalMs);

    logger.info(`Started periodic health checks every ${intervalMs}ms`);
  }

  // Stop periodic health checks
  stopPeriodicChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      logger.info('Stopped periodic health checks');
    }
  }
}

// Create singleton instance
const healthChecker = new HealthChecker();

// Register default health checks
healthChecker.register('database', () => healthChecker.checkDatabase());
healthChecker.register('memory', () => healthChecker.checkMemory());
healthChecker.register('cpu', () => healthChecker.checkCPU());
healthChecker.register('disk', () => healthChecker.checkDisk());

module.exports = healthChecker; 