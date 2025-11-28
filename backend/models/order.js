// models/order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      originalPrice: {
        type: Number,
        required: true,
      },
      offerPercentage: {
        type: Number,
        default: 0,
      },
      discountedPrice: {
        type: Number,
        required: true,
      },
      size: {
        type: String,
        required: true,
      },
    },
  ],
  deliveryStatus: {
    required: true,
    type: String,
    enum: [
      "Pending",
      "Accepted",
      "Processing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Cancellation Requested",
    ],
    default: "Pending",
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  estimatedDelivery: {
    type: Date,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Razorpay"],
    default: "Pending",
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentId: {
    type: String,
    default: null,
  },
  // Extended cancellation/refund tracking (non-breaking alongside deliveryStatus)
  status: {
    type: String,
    enum: [
      "pending",
      "completed",
      "cancel_requested",
      "cancelled",
      "cancel_rejected",
      // refund workflow
      "refund_requested",
      "refund_approved",
      "refund_initiated",
      "refunded",
      "refund_rejected",
    ],
    default: "pending",
  },
  cancelRequestedBy: {
    type: String,
    default: null,
  },
  cancelApprovedBy: {
    type: String,
    default: null,
  },
  refundStatus: {
    type: String,
    enum: ["not_initiated", "initiated", "completed"],
    default: "not_initiated",
  },
  razorpayPaymentId: {
    type: String,
    default: null,
  },
  razorpayRefundId: {
    type: String,
    default: null,
  },
  refundedAmount: {
    type: Number,
    default: 0,
  },
  refundReason: {
    type: String,
    default: null,
  },
  // New: granular refund tracking (non-breaking additions)
  refunds: [
    {
      amount: { type: Number, required: true },
      initiatedBy: {
        type: String,
        enum: ["platform", "brand"],
        required: true,
      },
      razorpayPaymentId: { type: String, default: null },
      razorpayRefundId: { type: String, default: null },
      refundedAt: { type: Date, default: Date.now },
      notes: { type: String, default: null },
    },
  ],
  platformRefundedAmount: {
    type: Number,
    default: 0,
  },
  brandRefundedAmount: {
    type: Number,
    default: 0,
  },
  // Shiprocket integration fields
  sr_order_id: {
    type: Number,
    default: null,
  },
  sr_channel_id: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Inventory management fields
  stockUpdated: {
    type: Boolean,
    default: false,
  },
  stockUpdatedAt: {
    type: Date,
    default: null,
  },
  // Stock deduction on order creation
  stockDeducted: {
    type: Boolean,
    default: false,
  },
  stockDeductedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Order", orderSchema);
