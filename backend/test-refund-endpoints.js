// Test script to verify refund endpoints are working
const axios = require('axios');

const API_BASE = 'http://localhost:5002/api';

async function testRefundEndpoints() {
  console.log('🧪 Testing Refund Endpoints...\n');

  try {
    // Test 1: Get refund requests
    console.log('1. Testing GET /orders/refund-requests');
    const refundRequests = await axios.get(`${API_BASE}/orders/refund-requests`);
    console.log('✅ Refund requests endpoint working');
    console.log(`   Found ${refundRequests.data.orders?.length || 0} refund requests\n`);

    // Test 2: Get refund approved orders
    console.log('2. Testing GET /orders/refund-approved');
    const refundApproved = await axios.get(`${API_BASE}/orders/refund-approved`);
    console.log('✅ Refund approved endpoint working');
    console.log(`   Found ${refundApproved.data.orders?.length || 0} approved refunds\n`);

    // Test 3: Get cancelled orders
    console.log('3. Testing GET /orders/cancelled');
    const cancelledOrders = await axios.get(`${API_BASE}/orders/cancelled`);
    console.log('✅ Cancelled orders endpoint working');
    console.log(`   Found ${cancelledOrders.data.orders?.length || 0} cancelled orders\n`);

    console.log('🎉 All refund endpoints are working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.response?.data || error.message);
  }
}

// Run the test
testRefundEndpoints();
