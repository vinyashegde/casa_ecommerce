const express = require("express");
const router = express.Router();
const {
  trackSwipe,
  getTrendingProducts,
  getRealTimeTrendingProducts,
  getUserSwipeHistory,
  getProductAnalytics,
} = require("../controllers/analyticsController");

// Track user swipe action (like/dislike)
router.post("/track-swipe", trackSwipe);

// Get trending products based on engagement score
router.get("/trending-products", getTrendingProducts);

// Get real-time trending products (for immediate updates)
router.get("/trending-realtime", getRealTimeTrendingProducts);

// Get user's swipe history
router.get("/user-history/:userId", getUserSwipeHistory);

// Get product analytics summary
router.get("/product-analytics/:productId", getProductAnalytics);

module.exports = router;
