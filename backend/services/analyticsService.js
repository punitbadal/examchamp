const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Question = require('../models/Question');
const User = require('../models/User');

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get comprehensive exam analytics
  async getExamAnalytics(examId) {
    const cacheKey = `exam_analytics_${examId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const exam = await Exam.findById(examId);
    if (!exam) throw new Error('Exam not found');

    const attempts = await ExamAttempt.find({ examId, status: 'completed' });
    
    const analytics = {
      examId,
      examTitle: exam.title,
      totalAttempts: attempts.length,
      totalRegistrations: exam.analytics.totalRegistrations,
      averageScore: 0,
      averageTime: 0,
      passRate: 0,
      scoreDistribution: {
        '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
      },
      sectionPerformance: [],
      questionTypePerformance: {
        mcqSingle: { attempted: 0, correct: 0, averageScore: 0 },
        mcqMultiple: { attempted: 0, correct: 0, averageScore: 0 },
        trueFalse: { attempted: 0, correct: 0, averageScore: 0 },
        integer: { attempted: 0, correct: 0, averageScore: 0 },
        numerical: { attempted: 0, correct: 0, averageScore: 0 }
      },
      timeAnalysis: {
        averageTimePerQuestion: 0,
        fastestCompletion: 0,
        slowestCompletion: 0,
        timeDistribution: {
          '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0
        }
      },
      difficultyAnalysis: {
        easy: { attempted: 0, correct: 0, averageScore: 0 },
        medium: { attempted: 0, correct: 0, averageScore: 0 },
        hard: { attempted: 0, correct: 0, averageScore: 0 }
      },
      proctoringStats: {
        cleanSessions: 0,
        flaggedSessions: 0,
        terminatedSessions: 0,
        averageSuspiciousScore: 0
      },
      trends: {
        dailyAttempts: [],
        scoreTrends: [],
        timeTrends: []
      }
    };

    if (attempts.length > 0) {
      // Calculate basic statistics
      const totalScore = attempts.reduce((sum, attempt) => sum + attempt.totalScore, 0);
      const totalTime = attempts.reduce((sum, attempt) => sum + attempt.duration, 0);
      const passingAttempts = attempts.filter(attempt => attempt.percentage >= exam.passingScore).length;

      analytics.averageScore = totalScore / attempts.length;
      analytics.averageTime = totalTime / attempts.length;
      analytics.passRate = (passingAttempts / attempts.length) * 100;

      // Score distribution
      attempts.forEach(attempt => {
        const percentage = attempt.percentage;
        if (percentage <= 20) analytics.scoreDistribution['0-20']++;
        else if (percentage <= 40) analytics.scoreDistribution['21-40']++;
        else if (percentage <= 60) analytics.scoreDistribution['41-60']++;
        else if (percentage <= 80) analytics.scoreDistribution['61-80']++;
        else analytics.scoreDistribution['81-100']++;
      });

      // Time analysis
      const completionTimes = attempts.map(attempt => attempt.duration);
      analytics.timeAnalysis.fastestCompletion = Math.min(...completionTimes);
      analytics.timeAnalysis.slowestCompletion = Math.max(...completionTimes);
      analytics.timeAnalysis.averageTimePerQuestion = attempts.reduce((sum, attempt) => 
        sum + (attempt.analytics.averageTimePerQuestion || 0), 0) / attempts.length;

      // Proctoring statistics
      const proctoringStats = attempts.map(attempt => attempt.proctoring);
      analytics.proctoringStats.cleanSessions = proctoringStats.filter(p => p.finalProctoringStatus === 'clean').length;
      analytics.proctoringStats.flaggedSessions = proctoringStats.filter(p => p.finalProctoringStatus === 'flagged').length;
      analytics.proctoringStats.terminatedSessions = proctoringStats.filter(p => p.finalProctoringStatus === 'terminated').length;
      analytics.proctoringStats.averageSuspiciousScore = proctoringStats.reduce((sum, p) => sum + p.suspiciousActivityCount, 0) / attempts.length;

      // Generate trends
      analytics.trends = await this.generateTrends(examId, attempts);
    }

    this.setCachedData(cacheKey, analytics);
    return analytics;
  }

  // Get student performance analytics
  async getStudentAnalytics(studentId, examId = null) {
    const cacheKey = `student_analytics_${studentId}_${examId || 'all'}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const query = { studentId, status: 'completed' };
    if (examId) query.examId = examId;

    const attempts = await ExamAttempt.find(query).populate('examId');
    
    const analytics = {
      studentId,
      totalExams: attempts.length,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      averageTime: 0,
      totalTime: 0,
      passRate: 0,
      rankHistory: [],
      subjectPerformance: {},
      questionTypePerformance: {
        mcqSingle: { attempted: 0, correct: 0, accuracy: 0 },
        mcqMultiple: { attempted: 0, correct: 0, accuracy: 0 },
        trueFalse: { attempted: 0, correct: 0, accuracy: 0 },
        integer: { attempted: 0, correct: 0, accuracy: 0 },
        numerical: { attempted: 0, correct: 0, accuracy: 0 }
      },
      timeManagement: {
        averageTimePerQuestion: 0,
        fastestExam: 0,
        slowestExam: 0,
        timeEfficiency: 0
      },
      improvementTrend: [],
      strengths: [],
      weaknesses: [],
      recommendations: []
    };

    if (attempts.length > 0) {
      // Calculate basic statistics
      const scores = attempts.map(attempt => attempt.percentage);
      analytics.totalScore = scores.reduce((sum, score) => sum + score, 0);
      analytics.averageScore = analytics.totalScore / attempts.length;
      analytics.bestScore = Math.max(...scores);
      analytics.worstScore = Math.min(...scores);

      const times = attempts.map(attempt => attempt.duration);
      analytics.totalTime = times.reduce((sum, time) => sum + time, 0);
      analytics.averageTime = analytics.totalTime / attempts.length;
      analytics.timeManagement.fastestExam = Math.min(...times);
      analytics.timeManagement.slowestExam = Math.max(...times);

      // Pass rate
      const passingAttempts = attempts.filter(attempt => 
        attempt.percentage >= (attempt.examId.passingScore || 40)
      ).length;
      analytics.passRate = (passingAttempts / attempts.length) * 100;

      // Rank history
      analytics.rankHistory = attempts
        .filter(attempt => attempt.rank)
        .map(attempt => ({
          examId: attempt.examId._id,
          examTitle: attempt.examId.title,
          rank: attempt.rank,
          score: attempt.percentage,
          date: attempt.endTime
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Subject performance
      const subjectStats = {};
      attempts.forEach(attempt => {
        attempt.sectionPerformance.forEach(section => {
          const subject = section.sectionName.split(' ')[0]; // Simple subject extraction
          if (!subjectStats[subject]) {
            subjectStats[subject] = { totalScore: 0, count: 0 };
          }
          subjectStats[subject].totalScore += section.sectionPercentage;
          subjectStats[subject].count++;
        });
      });

      analytics.subjectPerformance = Object.keys(subjectStats).map(subject => ({
        subject,
        averageScore: subjectStats[subject].totalScore / subjectStats[subject].count,
        examsTaken: subjectStats[subject].count
      }));

      // Question type performance
      attempts.forEach(attempt => {
        Object.keys(attempt.analytics).forEach(key => {
          if (key.includes('Performance') && attempt.analytics[key]) {
            const type = key.replace('Performance', '').toLowerCase();
            if (analytics.questionTypePerformance[type]) {
              analytics.questionTypePerformance[type].attempted += attempt.analytics[key].attempted || 0;
              analytics.questionTypePerformance[type].correct += attempt.analytics[key].correct || 0;
            }
          }
        });
      });

      // Calculate accuracies
      Object.keys(analytics.questionTypePerformance).forEach(type => {
        const stats = analytics.questionTypePerformance[type];
        stats.accuracy = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
      });

      // Improvement trend
      analytics.improvementTrend = attempts
        .sort((a, b) => new Date(a.endTime) - new Date(b.endTime))
        .map((attempt, index) => ({
          examId: attempt.examId._id,
          examTitle: attempt.examId.title,
          score: attempt.percentage,
          date: attempt.endTime,
          improvement: index > 0 ? attempt.percentage - analytics.improvementTrend[index - 1].score : 0
        }));

      // Identify strengths and weaknesses
      analytics.strengths = this.identifyStrengths(analytics);
      analytics.weaknesses = this.identifyWeaknesses(analytics);
      analytics.recommendations = this.generateRecommendations(analytics);
    }

    this.setCachedData(cacheKey, analytics);
    return analytics;
  }

  // Get detailed question analytics
  async getQuestionAnalytics(questionId) {
    const cacheKey = `question_analytics_${questionId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const question = await Question.findById(questionId);
    if (!question) throw new Error('Question not found');

    // Get all attempts that include this question
    const attempts = await ExamAttempt.find({
      'answers.questionId': questionId,
      status: 'completed'
    });

    const analytics = {
      questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      difficulty: question.difficulty,
      subject: question.subject,
      topic: question.topic,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      averageTime: 0,
      averageAttempts: 0,
      difficultyRating: 0,
      discriminationIndex: 0,
      answerDistribution: {},
      timeDistribution: {
        '0-30s': 0, '31-60s': 0, '61-120s': 0, '120s+': 0
      },
      performanceByDifficulty: {
        easy: { attempts: 0, correct: 0, accuracy: 0 },
        medium: { attempts: 0, correct: 0, accuracy: 0 },
        hard: { attempts: 0, correct: 0, accuracy: 0 }
      },
      performanceBySubject: {},
      trends: {
        dailyAccuracy: [],
        weeklyAccuracy: []
      }
    };

    if (attempts.length > 0) {
      const questionAnswers = attempts.map(attempt => 
        attempt.answers.find(answer => answer.questionId.toString() === questionId.toString())
      ).filter(Boolean);

      analytics.totalAttempts = questionAnswers.length;
      analytics.correctAttempts = questionAnswers.filter(answer => answer.isCorrect).length;
      analytics.accuracy = (analytics.correctAttempts / analytics.totalAttempts) * 100;

      // Time analysis
      const times = questionAnswers.map(answer => answer.timeSpent).filter(time => time > 0);
      if (times.length > 0) {
        analytics.averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        
        times.forEach(time => {
          if (time <= 30) analytics.timeDistribution['0-30s']++;
          else if (time <= 60) analytics.timeDistribution['31-60s']++;
          else if (time <= 120) analytics.timeDistribution['61-120s']++;
          else analytics.timeDistribution['120s+']++;
        });
      }

      // Attempt analysis
      const attemptCounts = questionAnswers.map(answer => answer.attempts);
      analytics.averageAttempts = attemptCounts.reduce((sum, count) => sum + count, 0) / attemptCounts.length;

      // Answer distribution for MCQs
      if (question.questionType.includes('MCQ')) {
        question.options.forEach(option => {
          analytics.answerDistribution[option] = questionAnswers.filter(answer => 
            answer.answer === option
          ).length;
        });
      }

      // Discrimination index (correlation between question performance and overall exam performance)
      const questionScores = questionAnswers.map(answer => answer.isCorrect ? 1 : 0);
      const examScores = attempts.map(attempt => attempt.percentage);
      analytics.discriminationIndex = this.calculateCorrelation(questionScores, examScores);

      // Difficulty rating based on accuracy
      if (analytics.accuracy < 30) analytics.difficultyRating = 'hard';
      else if (analytics.accuracy < 70) analytics.difficultyRating = 'medium';
      else analytics.difficultyRating = 'easy';
    }

    this.setCachedData(cacheKey, analytics);
    return analytics;
  }

  // Generate predictive insights
  async generatePredictiveInsights(studentId, examId) {
    const studentAnalytics = await this.getStudentAnalytics(studentId);
    const examAnalytics = await this.getExamAnalytics(examId);
    
    const insights = {
      predictedScore: 0,
      confidenceLevel: 'low',
      riskFactors: [],
      recommendations: [],
      studyPriorities: [],
      timeManagement: {
        predictedTime: 0,
        timeRisk: 'low'
      }
    };

    if (studentAnalytics.totalExams > 0) {
      // Predict score based on historical performance
      const recentScores = studentAnalytics.improvementTrend.slice(-3).map(trend => trend.score);
      const averageRecentScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
      
      insights.predictedScore = Math.round(averageRecentScore);
      
      // Determine confidence level
      const scoreVariance = this.calculateVariance(recentScores);
      if (scoreVariance < 100) insights.confidenceLevel = 'high';
      else if (scoreVariance < 400) insights.confidenceLevel = 'medium';
      else insights.confidenceLevel = 'low';

      // Identify risk factors
      if (studentAnalytics.averageScore < 50) insights.riskFactors.push('low_historical_performance');
      if (studentAnalytics.timeManagement.slowestExam > examAnalytics.averageTime * 1.5) insights.riskFactors.push('time_management_issues');
      if (studentAnalytics.questionTypePerformance.mcqMultiple.accuracy < 60) insights.riskFactors.push('weak_multiple_choice_performance');

      // Generate recommendations
      insights.recommendations = this.generatePersonalizedRecommendations(studentAnalytics, examAnalytics);
      
      // Study priorities
      insights.studyPriorities = this.identifyStudyPriorities(studentAnalytics);

      // Time management prediction
      insights.timeManagement.predictedTime = studentAnalytics.averageTime;
      if (insights.timeManagement.predictedTime > examAnalytics.averageTime * 1.2) {
        insights.timeManagement.timeRisk = 'high';
      } else if (insights.timeManagement.predictedTime > examAnalytics.averageTime * 1.1) {
        insights.timeManagement.timeRisk = 'medium';
      }
    }

    return insights;
  }

  // Generate comprehensive report
  async generateComprehensiveReport(examId, studentId = null) {
    const examAnalytics = await this.getExamAnalytics(examId);
    const report = {
      examId,
      examTitle: examAnalytics.examTitle,
      generatedAt: new Date(),
      overview: examAnalytics,
      detailedAnalysis: {},
      recommendations: []
    };

    if (studentId) {
      const studentAnalytics = await this.getStudentAnalytics(studentId, examId);
      const predictiveInsights = await this.generatePredictiveInsights(studentId, examId);
      
      report.detailedAnalysis = {
        studentPerformance: studentAnalytics,
        predictiveInsights,
        comparison: this.compareWithAverage(studentAnalytics, examAnalytics)
      };
    }

    // Generate recommendations
    report.recommendations = this.generateReportRecommendations(report);

    return report;
  }

  // Helper methods
  async generateTrends(examId, attempts) {
    const trends = {
      dailyAttempts: [],
      scoreTrends: [],
      timeTrends: []
    };

    // Group attempts by date
    const attemptsByDate = {};
    attempts.forEach(attempt => {
      const date = attempt.endTime.toISOString().split('T')[0];
      if (!attemptsByDate[date]) {
        attemptsByDate[date] = { attempts: [], scores: [], times: [] };
      }
      attemptsByDate[date].attempts.push(attempt);
      attemptsByDate[date].scores.push(attempt.percentage);
      attemptsByDate[date].times.push(attempt.duration);
    });

    // Generate daily trends
    Object.keys(attemptsByDate).sort().forEach(date => {
      const dayData = attemptsByDate[date];
      trends.dailyAttempts.push({
        date,
        count: dayData.attempts.length,
        averageScore: dayData.scores.reduce((sum, score) => sum + score, 0) / dayData.scores.length,
        averageTime: dayData.times.reduce((sum, time) => sum + time, 0) / dayData.times.length
      });
    });

    return trends;
  }

  identifyStrengths(analytics) {
    const strengths = [];
    
    if (analytics.averageScore > 80) strengths.push('high_overall_performance');
    if (analytics.passRate > 90) strengths.push('excellent_pass_rate');
    
    Object.keys(analytics.questionTypePerformance).forEach(type => {
      const performance = analytics.questionTypePerformance[type];
      if (performance.accuracy > 80) {
        strengths.push(`strong_${type}_performance`);
      }
    });

    return strengths;
  }

  identifyWeaknesses(analytics) {
    const weaknesses = [];
    
    if (analytics.averageScore < 50) weaknesses.push('low_overall_performance');
    if (analytics.passRate < 60) weaknesses.push('poor_pass_rate');
    
    Object.keys(analytics.questionTypePerformance).forEach(type => {
      const performance = analytics.questionTypePerformance[type];
      if (performance.accuracy < 60) {
        weaknesses.push(`weak_${type}_performance`);
      }
    });

    return weaknesses;
  }

  generateRecommendations(analytics) {
    const recommendations = [];
    
    if (analytics.averageScore < 60) {
      recommendations.push('Focus on fundamental concepts and practice more questions');
    }
    
    if (analytics.timeManagement.slowestExam > analytics.averageTime * 1.5) {
      recommendations.push('Improve time management skills and practice timed mock tests');
    }
    
    analytics.weaknesses.forEach(weakness => {
      if (weakness.includes('mcqMultiple')) {
        recommendations.push('Practice multiple choice questions with partial marking');
      }
      if (weakness.includes('numerical')) {
        recommendations.push('Focus on numerical problem-solving techniques');
      }
    });

    return recommendations;
  }

  generatePersonalizedRecommendations(studentAnalytics, examAnalytics) {
    const recommendations = [];
    
    // Performance-based recommendations
    if (studentAnalytics.averageScore < examAnalytics.averageScore) {
      recommendations.push('Your performance is below average. Consider additional study time.');
    }
    
    // Time management recommendations
    if (studentAnalytics.averageTime > examAnalytics.averageTime) {
      recommendations.push('Practice time management to improve exam efficiency');
    }
    
    // Subject-specific recommendations
    studentAnalytics.subjectPerformance.forEach(subject => {
      if (subject.averageScore < 60) {
        recommendations.push(`Focus on improving ${subject.subject} performance`);
      }
    });

    return recommendations;
  }

  identifyStudyPriorities(analytics) {
    const priorities = [];
    
    // Find weakest subject
    const weakestSubject = analytics.subjectPerformance.reduce((weakest, subject) => 
      subject.averageScore < weakest.averageScore ? subject : weakest
    );
    
    if (weakestSubject.averageScore < 60) {
      priorities.push(`Focus on ${weakestSubject.subject} - current average: ${weakestSubject.averageScore.toFixed(1)}%`);
    }
    
    // Find weakest question type
    Object.keys(analytics.questionTypePerformance).forEach(type => {
      const performance = analytics.questionTypePerformance[type];
      if (performance.accuracy < 60) {
        priorities.push(`Practice more ${type} questions - current accuracy: ${performance.accuracy.toFixed(1)}%`);
      }
    });

    return priorities;
  }

  compareWithAverage(studentAnalytics, examAnalytics) {
    return {
      scoreComparison: {
        student: studentAnalytics.averageScore,
        exam: examAnalytics.averageScore,
        difference: studentAnalytics.averageScore - examAnalytics.averageScore,
        percentile: this.calculatePercentile(studentAnalytics.averageScore, examAnalytics.scoreDistribution)
      },
      timeComparison: {
        student: studentAnalytics.averageTime,
        exam: examAnalytics.averageTime,
        difference: studentAnalytics.averageTime - examAnalytics.averageTime
      }
    };
  }

  calculatePercentile(score, distribution) {
    let cumulative = 0;
    let total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    for (const [range, count] of Object.entries(distribution)) {
      cumulative += count;
      if (cumulative / total >= 0.5) {
        return range;
      }
    }
    
    return '81-100';
  }

  calculateCorrelation(x, y) {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  generateReportRecommendations(report) {
    const recommendations = [];
    
    if (report.overview.passRate < 70) {
      recommendations.push('Consider reviewing exam difficulty or providing additional study materials');
    }
    
    if (report.overview.proctoringStats.flaggedSessions > report.overview.totalAttempts * 0.1) {
      recommendations.push('Review proctoring settings - high number of flagged sessions');
    }
    
    if (report.detailedAnalysis) {
      const comparison = report.detailedAnalysis.comparison;
      if (comparison.scoreComparison.difference < -10) {
        recommendations.push('Student needs additional support to improve performance');
      }
    }
    
    return recommendations;
  }

  // Cache management
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Get overview statistics
  async getOverviewStats() {
    const cacheKey = 'overview_stats';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const stats = {
      totalExams: await Exam.countDocuments(),
      totalUsers: await User.countDocuments(),
      totalAttempts: await ExamAttempt.countDocuments(),
      averageScore: 0,
      passRate: 0,
      recentExams: [],
      topPerformers: [],
      subjectPerformance: []
    };

    // Calculate average score and pass rate
    const completedAttempts = await ExamAttempt.find({ status: 'completed' });
    if (completedAttempts.length > 0) {
      const totalScore = completedAttempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0);
      stats.averageScore = totalScore / completedAttempts.length;
      
      const passingAttempts = completedAttempts.filter(attempt => 
        attempt.percentage >= (attempt.passingScore || 40)
      ).length;
      stats.passRate = (passingAttempts / completedAttempts.length) * 100;
    }

    // Get recent exams
    const recentExams = await Exam.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'firstName lastName');

    stats.recentExams = recentExams.map(exam => ({
      id: exam._id,
      title: exam.title,
      attempts: exam.analytics?.totalAttempts || 0,
      avgScore: exam.analytics?.averageScore || 0,
      status: exam.status
    }));

    // Get top performers
    const topPerformers = await ExamAttempt.find({ status: 'completed' })
      .sort({ percentage: -1 })
      .limit(10)
      .populate('studentId', 'firstName lastName email')
      .populate('examId', 'title');

    stats.topPerformers = topPerformers.map(attempt => ({
      id: attempt.studentId._id,
      name: `${attempt.studentId.firstName} ${attempt.studentId.lastName}`,
      score: attempt.percentage,
      exam: attempt.examId.title
    }));

    // Get subject performance
    const subjectStats = {};
    completedAttempts.forEach(attempt => {
      if (attempt.sectionPerformance) {
        attempt.sectionPerformance.forEach(section => {
          const subject = section.sectionName.split(' ')[0];
          if (!subjectStats[subject]) {
            subjectStats[subject] = { totalScore: 0, count: 0, totalQuestions: 0 };
          }
          subjectStats[subject].totalScore += section.sectionPercentage;
          subjectStats[subject].count++;
          subjectStats[subject].totalQuestions += section.totalQuestions || 0;
        });
      }
    });

    stats.subjectPerformance = Object.keys(subjectStats).map(subject => ({
      subject,
      avgScore: subjectStats[subject].totalScore / subjectStats[subject].count,
      totalQuestions: subjectStats[subject].totalQuestions
    }));

    this.setCachedData(cacheKey, stats);
    return stats;
  }

  // Get dashboard data
  async getDashboardData() {
    const cacheKey = 'dashboard_data';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const data = {
      overview: await this.getOverviewStats(),
      recentActivity: [],
      alerts: [],
      trends: {}
    };

    // Get recent activity
    const recentAttempts = await ExamAttempt.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('studentId', 'firstName lastName')
      .populate('examId', 'title');

    data.recentActivity = recentAttempts.map(attempt => ({
      type: 'exam_attempt',
      student: `${attempt.studentId.firstName} ${attempt.studentId.lastName}`,
      exam: attempt.examId.title,
      score: attempt.percentage,
      timestamp: attempt.createdAt
    }));

    // Get alerts
    const flaggedAttempts = await ExamAttempt.find({
      'proctoring.finalProctoringStatus': 'flagged'
    }).count();

    if (flaggedAttempts > 0) {
      data.alerts.push({
        type: 'proctoring_violation',
        message: `${flaggedAttempts} proctoring violations detected`,
        severity: 'medium'
      });
    }

    this.setCachedData(cacheKey, data);
    return data;
  }

  // Get analytics insights
  async getAnalyticsInsights(examId) {
    const examAnalytics = await this.getExamAnalytics(examId);
    
    const insights = {
      examId,
      keyInsights: [],
      recommendations: [],
      trends: examAnalytics.trends
    };

    // Generate key insights
    if (examAnalytics.passRate < 70) {
      insights.keyInsights.push({
        type: 'warning',
        message: 'Low pass rate detected. Consider reviewing exam difficulty.',
        metric: 'passRate',
        value: examAnalytics.passRate
      });
    }

    if (examAnalytics.proctoringStats.flaggedSessions > examAnalytics.totalAttempts * 0.1) {
      insights.keyInsights.push({
        type: 'alert',
        message: 'High number of proctoring violations. Review security settings.',
        metric: 'proctoringViolations',
        value: examAnalytics.proctoringStats.flaggedSessions
      });
    }

    if (examAnalytics.averageScore > 85) {
      insights.keyInsights.push({
        type: 'success',
        message: 'Excellent average performance. Consider increasing difficulty.',
        metric: 'averageScore',
        value: examAnalytics.averageScore
      });
    }

    return insights;
  }

  // Get analytics recommendations
  async getAnalyticsRecommendations(examId) {
    const examAnalytics = await this.getExamAnalytics(examId);
    
    const recommendations = [];

    if (examAnalytics.passRate < 70) {
      recommendations.push({
        type: 'difficulty',
        priority: 'high',
        message: 'Consider reducing exam difficulty or providing additional study materials',
        action: 'review_exam_content'
      });
    }

    if (examAnalytics.proctoringStats.flaggedSessions > examAnalytics.totalAttempts * 0.1) {
      recommendations.push({
        type: 'security',
        priority: 'medium',
        message: 'Review proctoring settings to reduce false positives',
        action: 'adjust_proctoring_settings'
      });
    }

    if (examAnalytics.averageTime > examAnalytics.totalDuration * 0.8) {
      recommendations.push({
        type: 'timing',
        priority: 'low',
        message: 'Consider extending exam duration or reducing question count',
        action: 'review_exam_timing'
      });
    }

    return recommendations;
  }
}

module.exports = new AnalyticsService(); 