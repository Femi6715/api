const http = require('http');

const testData = {
  user_id: 1
};

console.log('Testing direct tickets endpoint with data:', testData);

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

console.log('Sending request...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();

console.log('Request sent.'); 