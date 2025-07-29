#!/usr/bin/env node

/**
 * Load Testing Script for ExamTech
 * Tests application capacity for 10,000 concurrent users
 * 
 * Usage: node load-test.js
 * 
 * Prerequisites:
 * - Artillery installed: npm install -g artillery
 * - Application running on localhost:3001
 * - MongoDB running
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('./utils/logger');

class LoadTester {
  constructor() {
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001';
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      responseTimes: [],
      errors: []
    };
  }

  // Generate test data
  generateTestData() {
    return {
      users: Array.from({ length: 1000 }, (_, i) => ({
        email: `testuser${i}@example.com`,
        password: 'TestPassword123!',
        firstName: `Test${i}`,
        lastName: `User${i}`,
        role: 'student'
      })),
      exams: Array.from({ length: 10 }, (_, i) => ({
        title: `Load Test Exam ${i + 1}`,
        examCode: `LT${i + 1}`,
        totalDuration: 60,
        totalMarks: 100,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
        isPaid: false
      }))
    };
  }

  // Test user registration
  async testUserRegistration(userData) {
    try {
      const startTime = Date.now();
      const response = await axios.post(`${this.baseUrl}/api/auth/register`, userData, {
        timeout: 10000
      });
      const responseTime = Date.now() - startTime;
      
      this.recordResult(responseTime, true);
      return response.data;
    } catch (error) {
      this.recordResult(0, false, error.message);
      return null;
    }
  }

  // Test user login
  async testUserLogin(email, password) {
    try {
      const startTime = Date.now();
      const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
        email,
        password
      }, {
        timeout: 10000
      });
      const responseTime = Date.now() - startTime;
      
      this.recordResult(responseTime, true);
      return response.data.token;
    } catch (error) {
      this.recordResult(0, false, error.message);
      return null;
    }
  }

  // Test exam access
  async testExamAccess(token, examId) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/api/exams/${examId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      });
      const responseTime = Date.now() - startTime;
      
      this.recordResult(responseTime, true);
      return response.data;
    } catch (error) {
      this.recordResult(0, false, error.message);
      return null;
    }
  }

  // Test WebSocket connections
  async testWebSocketConnections(token, examId, count = 100) {
    const io = require('socket.io-client');
    const connections = [];
    const results = [];

    for (let i = 0; i < count; i++) {
      try {
        const startTime = Date.now();
        const socket = io(this.baseUrl, {
          auth: { token },
          transports: ['websocket']
        });

        socket.on('connect', () => {
          const responseTime = Date.now() - startTime;
          results.push({ success: true, responseTime });
          
          // Join exam room
          socket.emit('join-exam', examId);
          
          // Store connection for cleanup
          connections.push(socket);
        });

        socket.on('connect_error', (error) => {
          results.push({ success: false, error: error.message });
        });

      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    // Wait for all connections
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Cleanup connections
    connections.forEach(socket => socket.disconnect());

    return results;
  }

  // Test concurrent API requests
  async testConcurrentRequests(endpoint, method = 'GET', data = null, token = null, concurrency = 100) {
    const requests = [];
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    for (let i = 0; i < concurrency; i++) {
      requests.push(this.makeRequest(endpoint, method, data, headers));
    }

    const results = await Promise.allSettled(requests);
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
    );
  }

  // Make individual request
  async makeRequest(endpoint, method, data, headers) {
    try {
      const startTime = Date.now();
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data,
        headers,
        timeout: 10000
      });
      const responseTime = Date.now() - startTime;
      
      this.recordResult(responseTime, true);
      return { success: true, responseTime, data: response.data };
    } catch (error) {
      this.recordResult(0, false, error.message);
      return { success: false, error: error.message };
    }
  }

  // Record test result
  recordResult(responseTime, success, error = null) {
    this.results.totalRequests++;
    
    if (success) {
      this.results.successfulRequests++;
      this.results.responseTimes.push(responseTime);
      this.results.averageResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
      this.results.maxResponseTime = Math.max(this.results.maxResponseTime, responseTime);
      this.results.minResponseTime = Math.min(this.results.minResponseTime, responseTime);
    } else {
      this.results.failedRequests++;
      if (error) {
        this.results.errors.push(error);
      }
    }
  }

  // Test database performance
  async testDatabasePerformance() {
    console.log('🔍 Testing Database Performance...');
    
    const tests = [
      { name: 'Health Check', endpoint: '/health' },
      { name: 'Metrics', endpoint: '/metrics' },
      { name: 'Exams List', endpoint: '/api/exams' },
      { name: 'Users List', endpoint: '/api/users' }
    ];

    for (const test of tests) {
      const results = await this.testConcurrentRequests(test.endpoint, 'GET', null, null, 50);
      const successCount = results.filter(r => r.success).length;
      const avgResponseTime = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.responseTime, 0) / successCount || 0;

      console.log(`  ${test.name}: ${successCount}/50 successful, Avg: ${avgResponseTime.toFixed(2)}ms`);
    }
  }

  // Test authentication performance
  async testAuthenticationPerformance() {
    console.log('🔐 Testing Authentication Performance...');
    
    const testData = this.generateTestData();
    const tokens = [];

    // Register and login users
    for (let i = 0; i < 100; i++) {
      const user = testData.users[i];
      
      // Register user
      await this.testUserRegistration(user);
      
      // Login user
      const token = await this.testUserLogin(user.email, user.password);
      if (token) {
        tokens.push(token);
      }
    }

    console.log(`  Registered and logged in ${tokens.length} users`);

    // Test authenticated requests
    const authResults = await this.testConcurrentRequests('/api/auth/me', 'GET', null, tokens[0], 50);
    const successCount = authResults.filter(r => r.success).length;
    console.log(`  Authenticated requests: ${successCount}/50 successful`);
  }

  // Test WebSocket performance
  async testWebSocketPerformance() {
    console.log('🔌 Testing WebSocket Performance...');
    
    const testData = this.generateTestData();
    const token = await this.testUserLogin(testData.users[0].email, testData.users[0].password);
    
    if (!token) {
      console.log('  Failed to get authentication token');
      return;
    }

    const wsResults = await this.testWebSocketConnections(token, 'test-exam-id', 50);
    const successCount = wsResults.filter(r => r.success).length;
    const avgResponseTime = wsResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / successCount || 0;

    console.log(`  WebSocket connections: ${successCount}/50 successful, Avg: ${avgResponseTime.toFixed(2)}ms`);
  }

  // Test payment system performance
  async testPaymentSystemPerformance() {
    console.log('💳 Testing Payment System Performance...');
    
    const testData = this.generateTestData();
    const token = await this.testUserLogin(testData.users[0].email, testData.users[0].password);
    
    if (!token) {
      console.log('  Failed to get authentication token');
      return;
    }

    // Test payment access check
    const accessResults = await this.testConcurrentRequests('/api/payments/access/test-exam-id', 'GET', null, token, 50);
    const successCount = accessResults.filter(r => r.success).length;
    console.log(`  Payment access checks: ${successCount}/50 successful`);
  }

  // Run comprehensive load test
  async runLoadTest() {
    console.log('🚀 Starting Comprehensive Load Test for ExamTech');
    console.log('================================================');
    
    const startTime = Date.now();

    try {
      // Test 1: Database Performance
      await this.testDatabasePerformance();
      console.log('');

      // Test 2: Authentication Performance
      await this.testAuthenticationPerformance();
      console.log('');

      // Test 3: WebSocket Performance
      await this.testWebSocketPerformance();
      console.log('');

      // Test 4: Payment System Performance
      await this.testPaymentSystemPerformance();
      console.log('');

      // Test 5: High Concurrency Test
      console.log('⚡ Testing High Concurrency...');
      const highConcurrencyResults = await this.testConcurrentRequests('/health', 'GET', null, null, 1000);
      const successCount = highConcurrencyResults.filter(r => r.success).length;
      console.log(`  High concurrency test: ${successCount}/1000 successful`);

      const totalTime = Date.now() - startTime;
      
      // Print final results
      this.printResults(totalTime);

    } catch (error) {
      console.error('❌ Load test failed:', error.message);
      logger.error('Load test failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  // Print test results
  printResults(totalTime) {
    console.log('\n📊 Load Test Results');
    console.log('===================');
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful: ${this.results.successfulRequests}`);
    console.log(`Failed: ${this.results.failedRequests}`);
    console.log(`Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${this.results.minResponseTime}ms`);
    console.log(`Max Response Time: ${this.results.maxResponseTime}ms`);
    console.log(`Total Test Time: ${(totalTime / 1000).toFixed(2)}s`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.slice(0, 10).forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    // Performance assessment
    console.log('\n🎯 Performance Assessment:');
    if (this.results.averageResponseTime < 200) {
      console.log('✅ Response time: EXCELLENT (< 200ms)');
    } else if (this.results.averageResponseTime < 500) {
      console.log('⚠️  Response time: GOOD (200-500ms)');
    } else {
      console.log('❌ Response time: NEEDS IMPROVEMENT (> 500ms)');
    }

    if ((this.results.successfulRequests / this.results.totalRequests) > 0.95) {
      console.log('✅ Success rate: EXCELLENT (> 95%)');
    } else if ((this.results.successfulRequests / this.results.totalRequests) > 0.90) {
      console.log('⚠️  Success rate: GOOD (90-95%)');
    } else {
      console.log('❌ Success rate: NEEDS IMPROVEMENT (< 90%)');
    }

    // Capacity assessment
    const successRate = this.results.successfulRequests / this.results.totalRequests;
    if (successRate > 0.95 && this.results.averageResponseTime < 200) {
      console.log('\n🎉 CAPACITY ASSESSMENT: READY FOR 10,000 CONCURRENT USERS');
    } else if (successRate > 0.90 && this.results.averageResponseTime < 500) {
      console.log('\n⚠️  CAPACITY ASSESSMENT: NEEDS OPTIMIZATION FOR 10,000 USERS');
    } else {
      console.log('\n❌ CAPACITY ASSESSMENT: NOT READY FOR 10,000 USERS');
    }
  }
}

// Run load test if this script is executed directly
if (require.main === module) {
  const loadTester = new LoadTester();
  loadTester.runLoadTest().catch(console.error);
}

module.exports = LoadTester; 