#!/usr/bin/env node

/**
 * Standalone health check script for ExamTech backend
 * Usage: node health-check.js
 */

const healthChecker = require('./utils/healthCheck');
const logger = require('./utils/logger');

async function runHealthCheck() {
  try {
    console.log('🔍 Running ExamTech health check...\n');
    
    const health = await healthChecker.runAllChecks();
    
    console.log('📊 Health Check Results:');
    console.log('========================');
    console.log(`Status: ${health.status.toUpperCase()}`);
    console.log(`Timestamp: ${health.timestamp}`);
    console.log(`Uptime: ${Math.floor(health.uptime / 60)} minutes`);
    console.log(`Response Time: ${health.responseTime}ms`);
    console.log(`Environment: ${health.environment}`);
    console.log(`Version: ${health.version}\n`);
    
    // Display individual check results
    console.log('📋 Individual Checks:');
    console.log('====================');
    
    Object.entries(health.checks).forEach(([checkName, result]) => {
      const status = result.status === 'healthy' ? '✅' : 
                    result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${status} ${checkName}: ${result.status}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.details) {
        if (checkName === 'database') {
          console.log(`   Host: ${result.details.host}:${result.details.port}`);
          console.log(`   Database: ${result.details.database}`);
        } else if (checkName === 'memory') {
          console.log(`   Usage: ${result.details.usagePercent.toFixed(1)}%`);
          console.log(`   Heap Used: ${(result.details.heapUsed / 1024 / 1024).toFixed(1)}MB`);
        } else if (checkName === 'cpu') {
          console.log(`   Load: ${result.details.loadPercent.toFixed(1)}%`);
          console.log(`   CPU Count: ${result.details.cpuCount}`);
        }
      }
      console.log('');
    });
    
    // Display metrics
    console.log('📈 System Metrics:');
    console.log('==================');
    const metrics = healthChecker.getMetrics();
    console.log(`Memory Usage: ${(metrics.memory.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(metrics.memory.heapTotal / 1024 / 1024).toFixed(1)}MB`);
    console.log(`System Memory: ${(metrics.memory.systemUsed / 1024 / 1024 / 1024).toFixed(1)}GB / ${(metrics.memory.systemTotal / 1024 / 1024 / 1024).toFixed(1)}GB`);
    console.log(`CPU Load: ${metrics.cpu.loadAverage[0].toFixed(2)} (1min), ${metrics.cpu.loadAverage[1].toFixed(2)} (5min), ${metrics.cpu.loadAverage[2].toFixed(2)} (15min)`);
    console.log(`Platform: ${metrics.system.platform} ${metrics.system.arch}`);
    console.log(`Node Version: ${metrics.system.nodeVersion}`);
    console.log(`Hostname: ${metrics.system.hostname}\n`);
    
    // Exit with appropriate code
    if (health.status === 'healthy') {
      console.log('🎉 All systems operational!');
      process.exit(0);
    } else if (health.status === 'warning') {
      console.log('⚠️  System has warnings but is operational');
      process.exit(0);
    } else {
      console.log('❌ System is unhealthy');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Health check failed:', error.message);
    logger.error('Health check script error', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Run health check if this script is executed directly
if (require.main === module) {
  runHealthCheck();
}

module.exports = { runHealthCheck }; 