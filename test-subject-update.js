const fetch = require('node-fetch');

async function testSubjectUpdate() {
  try {
    // Test data
    const testData = {
      name: "Test Subject",
      code: "TEST001",
      description: "Test description",
      category: "Science",
      difficulty: "Intermediate",
      icon: "🔬",
      color: "#3B82F6",
      order: 1
    };

    console.log('Testing subject update with data:', testData);

    // First, try to create a subject
    const createResponse = await fetch('http://localhost:3001/api/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      },
      body: JSON.stringify(testData)
    });

    console.log('Create response status:', createResponse.status);
    const createResult = await createResponse.json();
    console.log('Create response:', createResult);

    if (createResponse.ok && createResult.data) {
      const subjectId = createResult.data._id;
      
      // Now try to update the subject
      const updateData = {
        name: "Updated Test Subject",
        description: "Updated description"
      };

      console.log('Testing subject update with data:', updateData);

      const updateResponse = await fetch(`http://localhost:3001/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
        },
        body: JSON.stringify(updateData)
      });

      console.log('Update response status:', updateResponse.status);
      const updateResult = await updateResponse.json();
      console.log('Update response:', updateResult);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSubjectUpdate(); 