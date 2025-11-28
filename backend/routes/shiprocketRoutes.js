const express = require("express");
const router = express.Router();
const shiprocket = require("../controllers/shiprocketController");

// GET /api/shiprocket/validate
router.get("/validate", shiprocket.validate);

// POST /api/shiprocket/orders
router.post("/orders", shiprocket.createOrder);

// POST /api/shiprocket/cancel-order
router.post("/cancel-order", shiprocket.cancelOrder);
// Utilities
router.get("/my-ip", shiprocket.myIp);
router.post("/login", shiprocket.login);

// Test endpoint for debugging
router.get("/test", shiprocket.test);

// Debug endpoint for configuration check
router.get("/debug", shiprocket.debug);

// Test connection endpoint
router.get("/test-connection", shiprocket.testConnection);

module.exports = router;
