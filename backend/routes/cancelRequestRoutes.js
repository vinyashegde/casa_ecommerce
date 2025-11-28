const express = require("express");
const router = express.Router();
const {
  createCancelRequest,
  getCancelRequestsByBrand,
  approveCancelRequest,
  rejectCancelRequest,
  getCancelRequestById,
} = require("../controllers/cancelRequestController");

// Create a new cancellation request
router.post("/create", createCancelRequest);

// Get cancellation requests by brand
router.get("/brand/:brandId", getCancelRequestsByBrand);

// Get specific cancellation request by ID
router.get("/:requestId", getCancelRequestById);

// Approve cancellation request
router.put("/:requestId/approve", approveCancelRequest);

// Reject cancellation request
router.put("/:requestId/reject", rejectCancelRequest);

module.exports = router;
