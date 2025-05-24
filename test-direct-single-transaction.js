const http = require('http');

// Create a single transaction with valid data
const testTransaction = {
  user_id: 1,
  amount_involved: 100,
  transaction_type: 'ticket_purchase',
  acct_balance: 1000,
  time_stamp: Date.now(),
  trans_date: '1-1-2023'
};

console.log('Testing transaction with data:', testTransaction);
console.log('-----------------------------------');

const data = JSON.stringify(testTransaction);

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

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    
    if (res.statusCode !== 200) {
      console.log('TRANSACTION FAILED - Check server logs for more details');
    } else {
      console.log('TRANSACTION SUCCESSFUL!');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();

console.log('Request sent, waiting for response...');
console.log('-----------------------------------'); 