const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examtech');

const Subject = require('./backend/models/Subject');
const Category = require('./backend/models/Category');
const User = require('./backend/models/User');

async function debugSubjects() {
  try {
    console.log('=== Debugging Subjects and Categories ===\n');

    // Check existing categories
    console.log('1. Existing Categories:');
    const categories = await Category.find({});
    console.log('Categories:', categories.map(c => ({ name: c.name, id: c._id })));

    // Check existing subjects
    console.log('\n2. Existing Subjects:');
    const subjects = await Subject.find({});
    console.log('Subjects:', subjects.map(s => ({ 
      name: s.name, 
      category: s.category, 
      id: s._id 
    })));

    // Check users with admin role
    console.log('\n3. Admin Users:');
    const adminUsers = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    console.log('Admin users:', adminUsers.map(u => ({ 
      email: u.email, 
      role: u.role, 
      name: u.getFullName() 
    })));

    // Test category validation
    console.log('\n4. Testing Category Validation:');
    const testCategories = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science'];
    testCategories.forEach(cat => {
      console.log(`Category "${cat}" - Valid: ${typeof cat === 'string' && cat.length > 0}`);
    });

  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugSubjects(); 