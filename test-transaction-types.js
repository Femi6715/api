const http = require('http');

// Test all valid transaction types
const validTypes = ['deposit', 'withdrawal', 'winning', 'ticket_purchase'];

// Test an invalid transaction type
const testInvalidType = () => {
  const data = JSON.stringify({
    user_id: 1,
    amount_involved: 100,
    transaction_type: 'INVALID_TYPE',
    acct_balance: 1000,
    time_stamp: Date.now(),
    trans_date: '1-1-2023'
  });

  sendRequest(data, 'Testing invalid transaction type');
};

// Test each valid transaction type
const testValidTypes = () => {
  validTypes.forEach((type, index) => {
    setTimeout(() => {
      // Create complete transaction data with all required fields
      const data = JSON.stringify({
        user_id: 1,
        amount_involved: 100,
        transaction_type: type,
        acct_balance: 1000,
        time_stamp: Date.now(),
        trans_date: '1-1-2023'
      });

      sendRequest(data, `Testing valid transaction type: ${type}`);
    }, index * 1000); // Stagger requests by 1 second
  });
};

const sendRequest = (data, message) => {
  console.log(message);
  
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
      console.log('-----------------------------------');
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(data);
  req.end();
};

// Run the tests
console.log('Starting transaction type validation tests...');
console.log('-----------------------------------');

// First test invalid type
testInvalidType();

// Then after 2 seconds, test all valid types
setTimeout(testValidTypes, 2000); 