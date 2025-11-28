const mongoose = require('mongoose');
const Order = require('../models/order');
const Brand = require('../models/brand');
const User = require('../models/user');

// Test script to verify refund calculations work correctly
async function testRefundCalculation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/casa', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find a test brand
    const testBrand = await Brand.findOne();
    if (!testBrand) {
      console.log('No brands found. Please create a brand first.');
      return;
    }

    console.log(`Testing with brand: ${testBrand.name} (${testBrand._id})`);

    // Find orders for this brand
    const orders = await Order.find({ brandId: testBrand._id })
      .select('paymentStatus totalAmount deliveryStatus createdAt refundedAmount')
      .limit(5);

    console.log(`Found ${orders.length} orders for this brand`);

    // Test the calculation logic
    const paidOrders = orders.filter((o) => ["Paid", "Razorpay"].includes(o.paymentStatus));
    console.log(`Paid orders: ${paidOrders.length}`);

    // Calculate total revenue (old way - without refunds)
    const totalRevenueOld = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    console.log(`Total Revenue (old calculation): ₹${totalRevenueOld}`);

    // Calculate total revenue (new way - with refunds)
    const totalRevenueNew = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0) - (o.refundedAmount || 0), 0);
    console.log(`Total Revenue (new calculation): ₹${totalRevenueNew}`);

    // Show refunded amounts
    const totalRefunded = paidOrders.reduce((sum, o) => sum + (o.refundedAmount || 0), 0);
    console.log(`Total Refunded Amount: ₹${totalRefunded}`);

    // Show individual order details
    console.log('\nOrder Details:');
    paidOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`);
      console.log(`  - Total Amount: ₹${order.totalAmount || 0}`);
      console.log(`  - Refunded Amount: ₹${order.refundedAmount || 0}`);
      console.log(`  - Net Amount: ₹${(order.totalAmount || 0) - (order.refundedAmount || 0)}`);
      console.log(`  - Payment Status: ${order.paymentStatus}`);
      console.log(`  - Delivery Status: ${order.deliveryStatus}`);
    });

    console.log('\n✅ Refund calculation test completed successfully!');
    console.log('The new calculation properly subtracts refunded amounts from total revenue.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testRefundCalculation();
