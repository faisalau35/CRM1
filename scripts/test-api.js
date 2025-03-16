const fetch = require('node-fetch');

async function testApi() {
  try {
    // Test the customers API endpoint
    const response = await fetch('http://localhost:3000/api/customers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=your_session_token_here' // You'll need to replace this with a valid session token
      }
    });

    const data = await response.json();
    console.log('API Response:', data);
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi(); 