const mongoose = require("mongoose");

const offerClaimSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },
    coupon_code: {
      type: String,
      required: true,
    },
    claimed_at: {
      type: Date,
      default: Date.now,
    },
    used_at: {
      type: Date,
      default: null,
    },
    is_used: {
      type: Boolean,
      default: false,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    original_price: {
      type: Number,
      default: 0,
    },
    final_price: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Ensure a user can only claim the same offer once
offerClaimSchema.index({ user: 1, offer: 1 }, { unique: true });

// Add indexes for better query performance
offerClaimSchema.index({ user: 1, is_used: 1 });
offerClaimSchema.index({ offer: 1, claimed_at: -1 });
offerClaimSchema.index({ coupon_code: 1 });

const OfferClaim =
  mongoose.models.OfferClaim || mongoose.model("OfferClaim", offerClaimSchema);

module.exports = OfferClaim;
