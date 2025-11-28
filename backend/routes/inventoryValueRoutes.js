const express = require("express");
const InventoryValueController = require("../controllers/inventoryValueController");
const router = express.Router();

// Get total inventory value
router.get("/total", InventoryValueController.getTotalInventoryValue);

// Get inventory summary for dashboard
router.get("/summary", InventoryValueController.getInventorySummary);

// Get detailed breakdown with pagination
router.get("/breakdown", InventoryValueController.getInventoryBreakdown);

module.exports = router;
