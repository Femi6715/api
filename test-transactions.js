const http = require('http');

const data = JSON.stringify({
  user_id: 1
});

const options = {
  hostname: '127.0.0.1',
  port: 8080,
  path: '/api/direct/transactions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending test request to direct transactions endpoint...');

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
      console.log(`Found ${parsed.transactions ? parsed.transactions.length : 0} transactions`);
      if (parsed.transactions && parsed.transactions.length > 0) {
        console.log('First transaction:', parsed.transactions[0]);
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