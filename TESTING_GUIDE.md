# ExamTech Testing Guide

## 🚀 Quick Start Testing

### Prerequisites
- Node.js 18+ installed
- MongoDB running
- Git (for cloning if needed)

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Set Up Environment Variables

```bash
# Copy environment files
cp env.example .env
cp backend/env.example backend/.env
```

**Edit `backend/.env` with your configuration:**
```env
# Basic Configuration
PORT=3001
MONGODB_URI=mongodb://localhost:27017/examtech
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# For Payment Testing (Optional)
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret
```

**Edit `.env` (frontend):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Step 3: Start MongoDB

```bash
# Start MongoDB (choose one method)

# Method 1: System MongoDB
mongod

# Method 2: Docker MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# Method 3: Docker Compose (includes all services)
docker-compose up -d mongodb
```

### Step 4: Start the Application

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
npm run dev
```

### Step 5: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api

## 🧪 Testing Scenarios

### 1. Basic Application Testing

#### A. User Registration and Login
1. **Visit**: http://localhost:3000
2. **Click**: "Get Started" or "Register"
3. **Fill in**:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "TestPassword123!"
   - Role: "student"
4. **Click**: "Register"
5. **Login** with the same credentials

#### B. Admin Account Creation
1. **Register** with role: "admin"
2. **Login** as admin
3. **Verify** admin dashboard access

### 2. Exam Management Testing

#### A. Create an Exam (Admin)
1. **Login** as admin
2. **Navigate** to "Create Exam"
3. **Fill in**:
   - Title: "Sample Math Test"
   - Duration: 60 minutes
   - Start Time: Set to future time
   - Total Marks: 40
   - **Payment Settings**:
     - Is Paid: true
     - Price: 500 (₹5.00)
     - Currency: INR
4. **Click**: "Create Exam"

#### B. Upload Questions
1. **Go to** exam details page
2. **Click**: "Upload Questions"
3. **Use** the sample CSV file: `sample-questions.csv`
4. **Upload** and verify questions

### 3. Payment Integration Testing

#### A. Test Payment Flow (Without Real Payment)
1. **Login** as a student
2. **Browse** available exams
3. **Click** on a paid exam
4. **Verify** payment requirement message
5. **Test** payment flow (will show Razorpay test interface)

#### B. Test Payment APIs (Using Postman/curl)

**Create Payment Order:**
```bash
curl -X POST http://localhost:3001/api/payments/create-order \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "examId": "EXAM_ID_HERE",
    "amount": 500,
    "currency": "INR"
  }'
```

**Check Payment Access:**
```bash
curl -X GET http://localhost:3001/api/payments/access/EXAM_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Payment History:**
```bash
curl -X GET http://localhost:3001/api/payments/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Real-time Features Testing

#### A. WebSocket Connection
1. **Open** browser console
2. **Check** for WebSocket connection logs
3. **Verify** real-time updates

#### B. Exam Interface
1. **Start** an exam as a student
2. **Verify** real-time countdown timer
3. **Test** question navigation
4. **Submit** answers and verify real-time updates

### 5. Proctoring Features Testing

#### A. Tab Switching Detection
1. **Start** an exam
2. **Switch** to another tab
3. **Verify** proctoring alert

#### B. Copy-Paste Prevention
1. **Try** to copy-paste in exam interface
2. **Verify** prevention works

## 🔧 Advanced Testing

### 1. Load Testing

```bash
# Install load testing dependencies
cd backend
npm install axios socket.io-client

# Run comprehensive load test
node load-test.js

# Run specific tests
node load-test.js --test=database
node load-test.js --test=auth
node load-test.js --test=websocket
node load-test.js --test=payment
```

### 2. Health Check Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test metrics endpoint
curl http://localhost:3001/metrics

# Test standalone health check
cd backend
node health-check.js
```

### 3. Payment Webhook Testing

**Set up webhook testing:**
1. **Use** ngrok for local webhook testing:
   ```bash
   ngrok http 3001
   ```

2. **Configure** Razorpay webhook URL:
   - URL: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
   - Events: `payment.captured`, `payment.failed`, `refund.processed`

3. **Test** webhook events using Razorpay dashboard

### 4. Security Testing

#### A. Authentication Testing
```bash
# Test invalid token
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer invalid_token"

# Test expired token
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer expired_token"
```

#### B. Rate Limiting Testing
```bash
# Test rate limiting
for i in {1..110}; do
  curl -X GET http://localhost:3001/health
done
```

#### C. Input Validation Testing
```bash
# Test invalid exam ID
curl -X GET http://localhost:3001/api/exams/invalid_id

# Test invalid payment data
curl -X POST http://localhost:3001/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

## 📊 Performance Testing

### 1. Database Performance
```bash
# Test database queries
curl -X GET http://localhost:3001/api/exams
curl -X GET http://localhost:3001/api/users
```

### 2. API Performance
```bash
# Test API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/health
```

### 3. WebSocket Performance
```bash
# Test WebSocket connections
node backend/load-test.js --test=websocket
```

## 🐳 Docker Testing

### 1. Full Stack Testing
```bash
# Start all services with Docker
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 2. Individual Service Testing
```bash
# Test backend only
docker-compose up backend

# Test frontend only
docker-compose up frontend

# Test with monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

## 🔍 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check MongoDB connection
mongo --eval "db.adminCommand('ping')"
```

#### 2. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Kill the process
kill -9 <PID>
```

#### 3. Node Modules Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### 4. Payment Integration Issues
```bash
# Check Razorpay configuration
echo $RAZORPAY_KEY_ID
echo $RAZORPAY_KEY_SECRET

# Test Razorpay connection
curl -X GET https://api.razorpay.com/v1/orders \
  -u "rzp_test_YOUR_KEY:YOUR_SECRET"
```

### Debug Mode

#### 1. Enable Debug Logging
```bash
# Set debug environment variable
export DEBUG=examtech:*

# Start application with debug
DEBUG=examtech:* npm run dev
```

#### 2. Check Application Logs
```bash
# Backend logs
cd backend
tail -f logs/app.log
tail -f logs/error.log

# Docker logs
docker-compose logs -f backend
```

## 📋 Test Checklist

### Basic Functionality
- [ ] User registration and login
- [ ] Admin dashboard access
- [ ] Exam creation and management
- [ ] Question upload and management
- [ ] Student exam access
- [ ] Real-time exam interface
- [ ] Answer submission and scoring

### Payment Integration
- [ ] Payment order creation
- [ ] Payment verification
- [ ] Access control enforcement
- [ ] Payment history tracking
- [ ] Refund processing (admin)
- [ ] Webhook handling

### Security Features
- [ ] JWT authentication
- [ ] Role-based access control
- [ ] Rate limiting
- [ ] Input validation
- [ ] Proctoring features
- [ ] Payment signature verification

### Performance Features
- [ ] Health check endpoints
- [ ] Metrics collection
- [ ] Load testing
- [ ] Error handling
- [ ] Logging system

## 🎯 Success Criteria

### Application is working correctly if:
- ✅ **Frontend loads** at http://localhost:3000
- ✅ **Backend responds** at http://localhost:3001/health
- ✅ **User registration** and login works
- ✅ **Exam creation** and management works
- ✅ **Payment integration** responds correctly
- ✅ **Real-time features** work without lag
- ✅ **Security features** block unauthorized access
- ✅ **Load testing** shows good performance

### Payment Integration is working if:
- ✅ **Payment orders** can be created
- ✅ **Access control** blocks unpaid users
- ✅ **Payment verification** works
- ✅ **Webhook handling** processes events
- ✅ **Refund processing** works for admins
- ✅ **Payment history** is tracked

## 🚀 Next Steps After Testing

1. **Configure production environment** variables
2. **Set up Razorpay production** account
3. **Deploy to production** server
4. **Set up monitoring** and alerting
5. **Begin scalability** implementation
6. **Conduct load testing** with real users

---

**Happy Testing! 🎉**

The application is now ready for comprehensive testing of both basic functionality and the new payment integration features. 