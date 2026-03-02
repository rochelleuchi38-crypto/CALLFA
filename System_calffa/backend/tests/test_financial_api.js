// Test script for Financial Module API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testFinancialAPIs() {
  console.log('🧪 Testing Financial Module APIs\n');

  try {
    // Test 1: Get contributions stats
    console.log('1. Testing GET /api/contributions/stats');
    const contribStats = await axios.get(`${BASE_URL}/contributions/stats`);
    console.log('✅ Contributions Stats:', JSON.stringify(contribStats.data, null, 2));
    
    // Test 2: Get loan stats
    console.log('\n2. Testing GET /api/loans/stats/summary');
    const loanStats = await axios.get(`${BASE_URL}/loans/stats/summary`);
    console.log('✅ Loan Stats:', JSON.stringify(loanStats.data, null, 2));
    
    // Test 3: Get all contributions
    console.log('\n3. Testing GET /api/contributions');
    const contributions = await axios.get(`${BASE_URL}/contributions`);
    console.log(`✅ Retrieved ${contributions.data.length} contributions`);
    
    // Test 4: Get all loans
    console.log('\n4. Testing GET /api/loans');
    const loans = await axios.get(`${BASE_URL}/loans`);
    console.log(`✅ Retrieved ${loans.data.length} loans`);
    
    console.log('\n✅ All API endpoints are working correctly!');
  } catch (error) {
    console.error('❌ Error testing APIs:', error.response?.data || error.message);
    process.exit(1);
  }
}

testFinancialAPIs();
