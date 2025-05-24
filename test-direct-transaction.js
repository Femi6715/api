const http = require('http');

const data = JSON.stringify({
  user_id: 1,
  amount_involved: 100,
  transaction_type: 'test',
  acct_balance: 1000,
  time_stamp: Date.now(),
  trans_date: '1-1-2023'
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/direct/transaction',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending test request to direct transaction endpoint...');

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
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(data);
req.end(); 