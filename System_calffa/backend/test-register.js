// Quick test to verify registration endpoint works
const axios = require('axios');

const testData = {
  reference_number: 'TEST-REF-' + Date.now(),
  full_name: 'Test User',
  date_of_birth: '2000-01-15',
  address: 'Test Street',
  phone_number: '09876543210',
  password: 'TestPass123!',
  role: 'farmer',
  barangay_id: 67  // Camansihan
};

console.log('📤 Testing registration endpoint...\n');
console.log('Payload:', JSON.stringify(testData, null, 2));

axios.post('http://localhost:3000/api/farmers/register', testData)
  .then(response => {
    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.log('\n❌ ERROR!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response:', error.request);
    } else {
      console.log('Error:', error.message);
      console.log('Full error:', error);
    }
    process.exit(1);
  });
