const http = require('http');

const data = JSON.stringify({
  user_id: 5  // Using user ID 5 as an example
});

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

console.log('Sending test request to direct tickets endpoint...');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(`Found ${parsed.tickets ? parsed.tickets.length : 0} tickets`);
      if (parsed.tickets && parsed.tickets.length > 0) {
        console.log('First ticket:', parsed.tickets[0]);
      }
    } catch (e) {
      console.log('Error parsing response:', e);
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(data);
req.end(); 