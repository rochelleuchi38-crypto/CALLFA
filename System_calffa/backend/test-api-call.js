const http = require('http');

const payload = JSON.stringify({
  booking_id: 25,
  collection_amount: 1000,
  collection_date: "2026-02-10",
  user_id: 23,
  payment_type: "partial",
  include_interest: true,
  interest_amount: 40,
  interest_season: 1,
  total_collection: 1040,
  receipt_number: "RCP001",
  remarks: "Test payment",
  payment_method: "cash"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/machinery-financial/collections',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

req.write(payload);
req.end();
