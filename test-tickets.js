const http = require('http');

const testData = {
  user_id: 1
};

console.log('Testing direct tickets endpoint with data:', testData);
console.log('-----------------------------------');

const data = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/direct/tickets',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Request sent, waiting for response...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    
    if (res.statusCode !== 200) {
      console.log('TICKETS REQUEST FAILED - Check server logs for more details');
    } else {
      console.log('TICKETS REQUEST SUCCESSFUL!');
      try {
        const parsedResponse = JSON.parse(responseData);
        if (parsedResponse.tickets && Array.isArray(parsedResponse.tickets)) {
          console.log(`Found ${parsedResponse.tickets.length} tickets for user ID ${testData.user_id}`);
        }
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end(); 