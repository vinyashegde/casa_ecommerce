const express = require("express");
const router = express.Router();
const { verifyBrandToken } = require("../middleware/brandAuth");
const orderController = require("../controllers/orderController");

// Destructure the main exported functions
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  updateOrder,
  deleteOrder,
  cancelOrder,
  updateShiprocketIds,
  getBrandSummary,
  requestRefund,
  getRefundRequests,
  respondRefund,
  getRefundApproved,
  getRefundedOrders,
  userCancelOrder,
  brandRespondToCancel,
  getCancelledOrders,
  refundOrder,
  brandRefundOrder,
} = orderController;

// Additional functions are available as properties of orderController

// Create a new order
router.post("/create", createOrder);

// Get all orders
router.get("/", getAllOrders);

// Get a specific order by ID
router.get("/id/:id", getOrderById);

// Get orders by user ID
router.get("/user/:userId", getOrdersByUserId);

// Update an order (e.g., deliveryStatus or paymentStatus)
router.put("/update/:id", updateOrder);

// Update Shiprocket IDs for an order
router.patch("/:id/shiprocket", updateShiprocketIds);

// Cancel an order
router.post("/cancel", cancelOrder);

// New cancellation/refund endpoints (non-breaking additions)
router.patch("/:id/cancel", userCancelOrder);
router.patch("/:id/brand-response", brandRespondToCancel);
router.patch("/:id/refund", refundOrder);
// Brand-initiated refund (deduct from brand balance directly)
router.patch("/:id/refund/brand", verifyBrandToken, brandRefundOrder);
// Refund request workflow
router.patch("/:id/refund-request", requestRefund);
router.get("/refund-requests", getRefundRequests);
router.patch("/:id/refund-response", respondRefund);
router.get("/refund-approved", getRefundApproved);
router.get("/refunded", getRefundedOrders);
router.get("/cancelled", getCancelledOrders);

// Delete an order
router.delete("/delete/:id", deleteOrder);

// Brand summary (products, orders, revenue)
router.get("/brand/:brandId/summary", getBrandSummary);

// Inventory management routes for orders
// UPDATE stock when order is placed (reserve stock)
router.post("/:orderId/update-stock", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { products } = req.body;

    if (!orderId || !products || !Array.isArray(products)) {
      return res.status(400).json({
        error: "Order ID and products array are required",
      });
    }

    const InventoryService = require("../services/inventoryService");
    const result = await InventoryService.updateStockOnOrder(orderId, products);

    res.json(result);
  } catch (error) {
    console.error("❌ Error updating stock for order:", error);
    res.status(500).json({ error: error.message });
  }
});

// RESERVE stock for pending order (optional - for better inventory management)
router.post("/:orderId/reserve-stock", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { products } = req.body;

    if (!orderId || !products || !Array.isArray(products)) {
      return res.status(400).json({
        error: "Order ID and products array are required",
      });
    }

    const InventoryService = require("../services/inventoryService");
    const result = await InventoryService.reserveStock(orderId, products);

    res.json(result);
  } catch (error) {
    console.error("❌ Error reserving stock:", error);
    res.status(500).json({ error: error.message });
  }
});

// RELEASE reserved stock (when order is cancelled)
router.post("/:orderId/release-stock", async (req, res) => {
  try {
    const { orderId } = req.params;

    const InventoryService = require("../services/inventoryService");
    const result = await InventoryService.releaseReservedStock(orderId);

    res.json(result);
  } catch (error) {
    console.error("❌ Error releasing reserved stock:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
