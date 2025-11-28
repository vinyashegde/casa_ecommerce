const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  deleteCart,
} = require("../controllers/cartController");

/**
 * CART ROUTES
 * RESTful API for shopping cart functionality
 */

// === MAIN CART ROUTES ===

// Get cart by email
// GET /api/cart?email=user@example.com
router.get("/", getCart);

// Add product to cart
// POST /api/cart/add
// Body: { email: "user@example.com", productId: "64b5f301...", quantity: 2, size: "L" }
router.post("/add", addToCart);

// Update cart item quantity
// PUT /api/cart/update
// Body: { email: "user@example.com", productId: "64b5f301...", size: "L", quantity: 3 }
router.put("/update", updateQuantity);

// Remove item from cart
// DELETE /api/cart/remove
// Body: { email: "user@example.com", productId: "64b5f301...", size: "L" }
router.delete("/remove", removeFromCart);

// Clear entire cart
// DELETE /api/cart/clear
// Body: { email: "user@example.com" }
router.delete("/clear", clearCart);

// Delete entire cart
// DELETE /api/cart
// Body: { email: "user@example.com" }
router.delete("/", deleteCart);

module.exports = router;
