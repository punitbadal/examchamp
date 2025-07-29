const logger = require('../utils/logger');

class ProctoringService {
  constructor() {
    this.activeSessions = new Map();
    this.violationThresholds = {
      tabSwitch: 3, // Maximum allowed tab switches
      inactivityTimeout: 300000, // 5 minutes in milliseconds
      fullScreenExit: 2 // Maximum allowed full screen exits
    };
  }

  // Start proctoring session
  startSession(examId, userId, examConfig) {
    const session = {
      examId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      tabSwitchCount: 0,
      fullScreenExitCount: 0,
      violations: [],
      isActive: true,
      config: examConfig
    };

    this.activeSessions.set(`${examId}-${userId}`, session);
    logger.info(`Proctoring session started for exam ${examId}, user ${userId}`);
    
    return session;
  }

  // Update activity timestamp
  updateActivity(examId, userId) {
    const sessionKey = `${examId}-${userId}`;
    const session = this.activeSessions.get(sessionKey);
    
    if (session) {
      session.lastActivity = new Date();
      logger.debug(`Activity updated for session ${sessionKey}`);
    }
  }

  // Record tab switching
  recordTabSwitch(examId, userId) {
    const sessionKey = `${examId}-${userId}`;
    const session = this.activeSessions.get(sessionKey);
    
    if (session) {
      session.tabSwitchCount++;
      const violation = {
        type: 'tab_switch',
        timestamp: new Date(),
        message: 'Tab switching detected',
        severity: session.tabSwitchCount > this.violationThresholds.tabSwitch ? 'error' : 'warning'
      };
      
      session.violations.push(violation);
      
      logger.warn(`Tab switch recorded for session ${sessionKey}, count: ${session.tabSwitchCount}`);
      
      // Check if threshold exceeded
      if (session.tabSwitchCount > this.violationThresholds.tabSwitch) {
        this.triggerViolationAlert(examId, userId, 'excessive_tab_switching', 'Excessive tab switching detected');
      }
      
      return violation;
    }
    
    return null;
  }

  // Record full screen exit
  recordFullScreenExit(examId, userId) {
    const sessionKey = `${examId}-${userId}`;
    const session = this.activeSessions.get(sessionKey);
    
    if (session) {
      session.fullScreenExitCount++;
      const violation = {
        type: 'fullscreen_exit',
        timestamp: new Date(),
        message: 'Full screen mode exited',
        severity: session.fullScreenExitCount > this.violationThresholds.fullScreenExit ? 'error' : 'warning'
      };
      
      session.violations.push(violation);
      
      logger.warn(`Full screen exit recorded for session ${sessionKey}, count: ${session.fullScreenExitCount}`);
      
      if (session.fullScreenExitCount > this.violationThresholds.fullScreenExit) {
        this.triggerViolationAlert(examId, userId, 'excessive_fullscreen_exit', 'Excessive full screen exits detected');
      }
      
      return violation;
    }
    
    return null;
  }

  // Check for inactivity
  checkInactivity(examId, userId) {
    const sessionKey = `${examId}-${userId}`;
    const session = this.activeSessions.get(sessionKey);
    
    if (session) {
      const now = new Date();
      const timeSinceActivity = now - session.lastActivity;
      
      if (timeSinceActivity > this.violationThresholds.inactivityTimeout) {
        const violation = {
          type: 'inactivity',
          timestamp: new Date(),
          message: `No activity detected for ${Math.floor(timeSinceActivity / 60000)} minutes`,
          severity: 'warning'
        };
        
        session.violations.push(violation);
        logger.warn(`Inactivity detected for session ${sessionKey}, duration: ${Math.floor(timeSinceActivity / 60000)} minutes`);
        
        return violation;
      }
    }
    
    return null;
  }

  // Trigger violation alert
  triggerViolationAlert(examId, userId, violationType, message) {
    const alert = {
      examId,
      userId,
      type: violationType,
      message,
      timestamp: new Date(),
      severity: 'error'
    };
    
    logger.error(`Proctoring violation: ${violationType} for exam ${examId}, user ${userId}`);
    
    // In a real implementation, this would send notifications to administrators
    // and potentially take actions like pausing the exam or flagging for review
    
    return alert;
  }

  // Get session status
  getSessionStatus(examId, userId) {
    const sessionKey = `${examId}-${userId}`;
    const session = this.activeSessions.get(sessionKey);
    
    if (!session) {
      return null;
    }
    
    return {
      isActive: session.isActive,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      tabSwitchCount: session.tabSwitchCount,
      fullScreenExitCount: session.fullScreenExitCount,
      violations: session.violations,
      timeElapsed: new Date() - session.startTime
    };
  }

  // End proctoring session
  endSession(examId, userId) {
    const sessionKey = `${examId}-${userId}`;
    const session = this.activeSessions.get(sessionKey);
    
    if (session) {
      session.isActive = false;
      session.endTime = new Date();
      
      logger.info(`Proctoring session ended for exam ${examId}, user ${userId}`);
      
      return {
        sessionId: sessionKey,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.endTime - session.startTime,
        violations: session.violations,
        summary: this.generateSessionSummary(session)
      };
    }
    
    return null;
  }

  // Generate session summary
  generateSessionSummary(session) {
    const totalViolations = session.violations.length;
    const criticalViolations = session.violations.filter(v => v.severity === 'error').length;
    const tabSwitches = session.violations.filter(v => v.type === 'tab_switch').length;
    const inactivityWarnings = session.violations.filter(v => v.type === 'inactivity').length;
    
    return {
      totalViolations,
      criticalViolations,
      tabSwitches,
      inactivityWarnings,
      riskLevel: this.calculateRiskLevel(session),
      recommendations: this.generateRecommendations(session)
    };
  }

  // Calculate risk level
  calculateRiskLevel(session) {
    const criticalViolations = session.violations.filter(v => v.severity === 'error').length;
    const totalViolations = session.violations.length;
    
    if (criticalViolations > 0) {
      return 'high';
    } else if (totalViolations > 5) {
      return 'medium';
    } else if (totalViolations > 0) {
      return 'low';
    } else {
      return 'none';
    }
  }

  // Generate recommendations
  generateRecommendations(session) {
    const recommendations = [];
    
    if (session.tabSwitchCount > this.violationThresholds.tabSwitch) {
      recommendations.push('Review exam session for potential cheating due to excessive tab switching');
    }
    
    if (session.violations.filter(v => v.type === 'inactivity').length > 2) {
      recommendations.push('Consider implementing additional monitoring for this user');
    }
    
    if (session.violations.length === 0) {
      recommendations.push('No violations detected - session appears clean');
    }
    
    return recommendations;
  }

  // Get all active sessions
  getActiveSessions() {
    const activeSessions = [];
    
    for (const [sessionKey, session] of this.activeSessions) {
      if (session.isActive) {
        activeSessions.push({
          sessionKey,
          examId: session.examId,
          userId: session.userId,
          startTime: session.startTime,
          lastActivity: session.lastActivity,
          violations: session.violations.length
        });
      }
    }
    
    return activeSessions;
  }

  // Clean up old sessions
  cleanupOldSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    const now = new Date();
    const sessionsToRemove = [];
    
    for (const [sessionKey, session] of this.activeSessions) {
      if (!session.isActive && (now - session.endTime) > maxAge) {
        sessionsToRemove.push(sessionKey);
      }
    }
    
    sessionsToRemove.forEach(key => {
      this.activeSessions.delete(key);
      logger.info(`Cleaned up old session: ${key}`);
    });
    
    return sessionsToRemove.length;
  }

  // Get violation statistics
  getViolationStats() {
    const stats = {
      totalSessions: this.activeSessions.size,
      activeSessions: 0,
      totalViolations: 0,
      violationsByType: {},
      riskLevels: { none: 0, low: 0, medium: 0, high: 0 }
    };
    
    for (const session of this.activeSessions.values()) {
      if (session.isActive) {
        stats.activeSessions++;
      }
      
      stats.totalViolations += session.violations.length;
      
      session.violations.forEach(violation => {
        stats.violationsByType[violation.type] = (stats.violationsByType[violation.type] || 0) + 1;
      });
      
      const riskLevel = this.calculateRiskLevel(session);
      stats.riskLevels[riskLevel]++;
    }
    
    return stats;
  }
}

module.exports = new ProctoringService(); 