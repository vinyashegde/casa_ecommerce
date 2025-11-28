// models/cancelRequest.js
const mongoose = require("mongoose");

const cancelRequestSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false, // Optional for full order cancellation
  },
  productIndex: {
    type: Number,
    required: false, // Optional for full order cancellation
  },
  reason: {
    type: String,
    required: false,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    required: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  processedAt: {
    type: Date,
    required: false,
  },
  processedBy: {
    type: String,
    required: false, // Admin/brand user who processed the request
  },
  adminNotes: {
    type: String,
    required: false,
    maxlength: 500,
  },
  // Store order details at time of request for reference
  orderDetails: {
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: false,
    },
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
    },
    size: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
  },
});

// Index for efficient queries
cancelRequestSchema.index({ brandId: 1, status: 1 });
cancelRequestSchema.index({ orderId: 1 });
cancelRequestSchema.index({ userId: 1 });
cancelRequestSchema.index({ requestedAt: -1 });

module.exports = mongoose.model("CancelRequest", cancelRequestSchema);
