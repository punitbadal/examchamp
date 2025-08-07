const mongoose = require('mongoose');
const Topic = require('./backend/models/Topic');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/examtech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkTopics() {
  try {
    console.log('Checking topics under "Mechanical properties of Solids"...\n');
    
    // Find all topics under this chapter
    const topics = await Topic.find({
      chapterName: { $regex: /Mechanical properties of Solids/i }
    }).sort({ topicNumber: 1 });
    
    console.log(`Found ${topics.length} topics under "Mechanical properties of Solids":\n`);
    
    topics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic.name} (${topic.code})`);
      console.log(`   Topic Number: ${topic.topicNumber}`);
      console.log(`   Difficulty: ${topic.difficulty}`);
      console.log(`   Weightage: ${topic.weightage}%`);
      console.log(`   Estimated Hours: ${topic.estimatedHours}`);
      console.log(`   Active: ${topic.isActive}`);
      console.log(`   Subject: ${topic.subjectName}`);
      console.log(`   Chapter: ${topic.chapterName}`);
      console.log('');
    });
    
    // Also check for any variations in chapter name
    const allTopics = await Topic.find({});
    const chapterNames = [...new Set(allTopics.map(t => t.chapterName))];
    const mechanicalChapters = chapterNames.filter(name => 
      name.toLowerCase().includes('mechanical') || 
      name.toLowerCase().includes('solids') ||
      name.toLowerCase().includes('elasticity')
    );
    
    if (mechanicalChapters.length > 0) {
      console.log('Found similar chapter names:');
      mechanicalChapters.forEach(name => {
        console.log(`- ${name}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkTopics(); 