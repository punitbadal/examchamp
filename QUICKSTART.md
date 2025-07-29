# ExamTech Quick Start Guide

Get ExamTech up and running in minutes!

## 🚀 Quick Setup

### Option 1: Automated Installation (Recommended)

```bash
# Run the installation script
./install.sh
```

### Option 2: Manual Setup

1. **Install Dependencies**
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

2. **Setup Environment**
```bash
# Copy environment files
cp env.example .env
cp backend/env.example backend/.env
```

3. **Start MongoDB**
```bash
# Using system MongoDB
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0
```

4. **Start the Application**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

## 🐳 Docker Setup (Alternative)

```bash
# Start all services with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## 🧪 Testing the Platform

### 1. Create Admin Account

1. Visit http://localhost:3000
2. Click "Get Started" to register
3. Use role: "admin" for admin access

### 2. Create an Exam

1. Login as admin
2. Navigate to "Create Exam"
3. Fill in exam details:
   - Title: "Sample Math Test"
   - Duration: 60 minutes
   - Start Time: Set to future time
   - Total Marks: 40

### 3. Upload Questions

1. Go to the exam details page
2. Click "Upload Questions"
3. Use the sample CSV file: `sample-questions.csv`
4. Upload and verify questions

### 4. Test Student Experience

1. Register a new student account
2. Browse available exams
3. Start an exam attempt
4. Answer questions and submit

## 📊 Sample Data

### Sample Questions CSV
The `sample-questions.csv` file contains 10 sample questions covering:
- Mathematics (Arithmetic, Algebra, Geometry)
- Geography (Countries, Cities, Basic facts)
- Multiple question types (MCQ, True/False, Integer, Numerical)

### Sample Exam Configuration
- **Duration**: 60 minutes
- **Questions**: 10 questions
- **Total Marks**: 40
- **Negative Marking**: Enabled
- **Question Types**: Mixed

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**Backend (backend/.env)**
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/examtech
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Database Connection

The application will automatically create the database and collections on first run.

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Check if MongoDB is running
   sudo systemctl status mongod
   
   # Start MongoDB
   sudo systemctl start mongod
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :3001
   
   # Kill the process
   kill -9 <PID>
   ```

3. **Node Modules Issues**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Backend
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Docker Issues**
   ```bash
   # Stop and remove containers
   docker-compose down
   
   # Remove volumes
   docker-compose down -v
   
   # Rebuild
   docker-compose up --build
   ```

### Logs

**Backend Logs**
```bash
cd backend
npm run dev
```

**Docker Logs**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📱 Features to Test

### Admin Features
- [ ] User registration and management
- [ ] Exam creation and configuration
- [ ] CSV question upload
- [ ] Exam scheduling
- [ ] Result analytics
- [ ] User bulk upload

### Student Features
- [ ] Exam discovery and enrollment
- [ ] Pre-exam check-in
- [ ] Real-time exam interface
- [ ] Question navigation
- [ ] Answer submission
- [ ] Result viewing
- [ ] Leaderboard access

### Real-time Features
- [ ] Live countdown timer
- [ ] Real-time answer submission
- [ ] Proctoring events
- [ ] Admin monitoring
- [ ] Instant result publishing

## 🔒 Security Testing

### Authentication
- [ ] JWT token validation
- [ ] Role-based access control
- [ ] Password hashing
- [ ] Session management

### Proctoring
- [ ] Tab switching detection
- [ ] Copy-paste prevention
- [ ] Suspicious activity monitoring
- [ ] Webcam integration (if enabled)

## 📈 Performance Testing

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Test API endpoints
artillery quick --count 100 --num 10 http://localhost:3001/api/health
```

### Database Performance
- Monitor MongoDB performance
- Check query execution times
- Verify index usage

## 🎯 Next Steps

1. **Customize the Platform**
   - Modify branding and styling
   - Add custom question types
   - Implement additional proctoring features

2. **Production Deployment**
   - Set up production environment variables
   - Configure SSL certificates
   - Set up monitoring and logging

3. **Integration**
   - Connect with external LMS systems
   - Implement email notifications
   - Add payment processing

4. **Scaling**
   - Set up load balancers
   - Implement caching strategies
   - Configure auto-scaling

## 📞 Support

- **Documentation**: See README.md for detailed documentation
- **Issues**: Report bugs and feature requests
- **Community**: Join our community for discussions

---

**Happy Testing! 🎉** 