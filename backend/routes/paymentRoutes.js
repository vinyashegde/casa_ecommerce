const express = require("express");
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  testRazorpayConfig,
  getAdminPaymentsSummary,
  getAdminBrandPayments,
  createAdminPayout,
  getBrandBalance,
} = require("../controllers/paymentController");

// Test Razorpay configuration
router.get("/test-config", testRazorpayConfig);

// Create Razorpay order
router.post("/create-order", createPaymentOrder);

// Verify payment
router.post("/verify", verifyPayment);

// Admin payments
router.get("/admin/summary", getAdminPaymentsSummary);
router.get("/admin/brand-payments", getAdminBrandPayments);
router.post("/admin/payout", createAdminPayout);

// Brand balance
router.get("/brand/:brandId/balance", getBrandBalance);

module.exports = router;
