# ExamTech - Live Online Examination Platform

A comprehensive, production-ready online examination platform designed for competitive exams like JEE, CAT, and other major assessments. Built with modern technologies and advanced features for secure, scalable, and insightful exam administration.

## 🚀 Features

### Phase 1 (MVP) - Core Features
- ✅ **Multiple Question Types**: MCQ (Single/Multiple), True/False, Integer, Numerical
- ✅ **Advanced Marking Schemes**: Partial scoring for MCQ_Multiple, flexible positive/negative marking
- ✅ **Real-time Exam Interface**: Live countdown, question navigation, mark for review
- ✅ **Comprehensive Admin Panel**: Exam creation, user management, CSV import
- ✅ **Student Dashboard**: Upcoming exams, past results, performance tracking
- ✅ **Secure Authentication**: JWT-based auth with role-based access control
- ✅ **Real-time Communication**: WebSocket connections for live updates

### Phase 2 (Enhanced) - Advanced Features
- ✅ **Exam Sectioning**: Multiple sections with different time limits and scoring
- ✅ **Advanced Randomization**: Question and option randomization per section
- ✅ **In-Exam Tools**: Calculator, scratchpad, highlighter
- ✅ **Enhanced Analytics**: Detailed performance analysis, predictive insights
- ✅ **Advanced Proctoring**: Tab switching detection, copy-paste prevention
- ✅ **Comprehensive Reporting**: Custom reports, data export, trend analysis

### Phase 3 (Advanced) - Enterprise Features
- ✅ **AI-Powered Proctoring**: Webcam monitoring, suspicious activity detection
- ✅ **Multi-Monitor Detection**: Advanced screen monitoring and analysis
- ✅ **Predictive Analytics**: Student performance prediction, risk assessment
- ✅ **Advanced Security**: Browser lockdown, IP monitoring, device fingerprinting
- ✅ **Real-time Monitoring**: Live admin dashboard with proctoring alerts
- ✅ **Comprehensive Analytics**: Question analysis, difficulty assessment, discrimination index

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt hashing
- **Real-time**: WebSocket connections for live updates
- **File Upload**: Multer for CSV processing
- **Security**: Helmet, CORS, rate limiting

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐             │
         └──────────────►│  Socket.IO     │◄────────────┘
                        │  (Real-time)   │
                        └─────────────────┘
```

## 📊 Advanced Features

### Question Types & Scoring

#### MCQ_Single
- Single correct answer selection
- Standard positive/negative marking

#### MCQ_Multiple
- Multiple correct answers
- **Advanced Partial Scoring**:
  - All correct: +4 marks
  - 3 out of 4 correct: +3 marks
  - 2 out of 3+ correct: +2 marks
  - 1 out of 2+ correct: +1 mark
  - Any incorrect: -2 marks

#### True/False
- Boolean answer type
- Standard marking scheme

#### Integer
- Non-negative integer input
- Exact match required

#### Numerical
- Decimal number input
- **Configurable tolerance** (default: ±0.01)
- Rounded to specified decimal places

### Advanced Proctoring System

#### Real-time Monitoring
- **Tab Switching Detection**: Monitors browser focus and tab changes
- **Copy-Paste Prevention**: Blocks keyboard shortcuts and context menu
- **Multi-Monitor Detection**: Identifies multiple display setups
- **IP Address Monitoring**: Tracks IP changes during exam
- **Device Fingerprinting**: Unique device identification

#### AI-Powered Analysis
- **Webcam Monitoring**: Face detection and movement analysis
- **Suspicious Activity Detection**: AI-based behavior analysis
- **Risk Scoring**: Dynamic risk assessment (0-100 scale)
- **Automatic Actions**: Warn, flag, or terminate based on risk level

#### Proctoring Events
```javascript
// Event types supported
- tab_switch: Browser tab switching
- copy_paste: Copy/paste attempts
- browser_focus: Browser window focus
- webcam_off: Webcam disconnection
- microphone_off: Microphone disconnection
- suspicious_activity: AI-detected suspicious behavior
- ip_change: IP address changes
- multi_monitor: Multiple monitor detection
```

### Advanced Analytics

#### Performance Analytics
- **Individual Performance**: Detailed student analysis
- **Question Analysis**: Difficulty rating, discrimination index
- **Section-wise Analysis**: Performance by exam sections
- **Time Analysis**: Time spent per question/section
- **Predictive Insights**: Performance prediction based on history

#### Exam Analytics
- **Score Distribution**: Histogram of exam scores
- **Question Statistics**: Success rate, average time per question
- **Difficulty Analysis**: Easy/Medium/Hard question performance
- **Trend Analysis**: Performance trends over time
- **Comparative Analysis**: Compare with previous exams

#### Real-time Analytics
- **Live Dashboard**: Real-time exam progress
- **Active Sessions**: Current exam participants
- **Proctoring Alerts**: Suspicious activity notifications
- **Performance Metrics**: Live score calculations

### Enhanced Admin Features

#### Exam Management
- **Section Configuration**: Multiple sections with different settings
- **Advanced Scheduling**: Flexible start/end times with check-in windows
- **Question Bank**: Comprehensive question management
- **CSV Import**: Bulk question upload with validation
- **Randomization**: Question and option randomization

#### User Management
- **Role-based Access**: Student, Admin, Super Admin roles
- **Bulk Operations**: Mass user import/export
- **Activity Tracking**: Login history, exam attempts
- **Account Management**: Password reset, account activation

#### Reporting & Analytics
- **Custom Reports**: Configurable report generation
- **Data Export**: CSV, PDF, Excel export options
- **Performance Insights**: Detailed analytics and recommendations
- **Trend Analysis**: Historical performance tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 5+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ExamTech
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp env.example .env
   cp backend/env.example backend/.env
   
   # Configure environment variables
   # Edit .env and backend/.env files
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Start backend
   cd backend && npm run dev
   
   # Terminal 2: Start frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure

```
ExamTech/
├── app/                    # Next.js frontend
│   ├── components/        # React components
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── backend/              # Express.js backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── middleware/       # Custom middleware
│   └── socket/           # WebSocket handlers
├── components/           # Shared components
├── lib/                 # Utility functions
├── sample-questions-advanced.csv  # Enhanced sample data
├── docker-compose.yml    # Docker configuration
├── install.sh           # Installation script
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

#### Backend (backend/.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/examtech
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Database Schema

#### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student/admin/super_admin),
  status: String (active/inactive),
  lastLogin: Date
}
```

#### Exam Model
```javascript
{
  title: String,
  examCode: String (unique),
  sections: [SectionSchema],
  totalDuration: Number,
  totalMarks: Number,
  startTime: Date,
  endTime: Date,
  proctoring: ProctoringConfig,
  settings: ExamSettings,
  analytics: AnalyticsData
}
```

#### Question Model
```javascript
{
  questionNumber: Number,
  questionText: String,
  questionType: String,
  options: [String],
  correctAnswer: Mixed,
  marksPerQuestion: Number,
  negativeMarksPerQuestion: Number,
  partialScoring: Boolean,
  tolerance: Number (for numerical)
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Exams
- `GET /api/exams` - List all exams
- `POST /api/exams` - Create new exam
- `GET /api/exams/:id` - Get exam details
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `POST /api/exams/:id/questions/upload` - Upload questions via CSV

### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/exam/:id` - Exam analytics
- `GET /api/analytics/student/:id` - Student analytics
- `GET /api/analytics/question/:id` - Question analytics
- `GET /api/analytics/predictive/:studentId/:examId` - Predictive insights
- `GET /api/analytics/report/:examId` - Comprehensive report

### Proctoring
- `POST /api/proctoring/session/initialize` - Initialize proctoring session
- `POST /api/proctoring/event` - Report proctoring event
- `GET /api/proctoring/session/:id` - Get session status
- `GET /api/proctoring/sessions` - List active sessions
- `GET /api/proctoring/alerts` - Get proctoring alerts

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Session management
- Rate limiting on auth endpoints

### Proctoring Security
- Browser lockdown capabilities
- Tab switching detection
- Copy-paste prevention
- Multi-monitor detection
- IP address monitoring
- Device fingerprinting

### Data Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure headers with Helmet

## 📈 Performance & Scalability

### Optimization Features
- Database indexing for fast queries
- Caching for analytics data
- Compression middleware
- Efficient WebSocket connections
- Optimized image handling

### Scalability Considerations
- Microservices-ready architecture
- Horizontal scaling support
- Load balancing compatible
- Database connection pooling
- Async/await for non-blocking operations

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
npm test

# Backend tests
cd backend && npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
- Unit tests for models and services
- Integration tests for API endpoints
- E2E tests for critical user flows
- Proctoring system tests

## 🚀 Deployment

### Production Deployment
1. Set environment variables for production
2. Build frontend: `npm run build`
3. Start backend: `npm start`
4. Configure reverse proxy (Nginx)
5. Set up SSL certificates
6. Configure MongoDB for production

### Docker Deployment
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

## 🔄 Version History

### v2.0.0 (Phase 3)
- Advanced AI-powered proctoring
- Predictive analytics
- Multi-monitor detection
- Comprehensive reporting

### v1.5.0 (Phase 2)
- Exam sectioning
- Advanced analytics
- Enhanced proctoring
- In-exam tools

### v1.0.0 (Phase 1)
- Core exam functionality
- Basic proctoring
- Real-time features
- Admin dashboard

---

**ExamTech** - Empowering education through technology 