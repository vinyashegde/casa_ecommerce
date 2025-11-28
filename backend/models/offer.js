const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    discount_type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discount_value: {
      type: Number,
      required: true,
      min: 0,
    },
    max_discount_amount: {
      type: Number,
      min: 0,
    },
    min_order_value: {
      type: Number,
      default: 0,
      min: 0,
    },
    coupon_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    applies_to: {
      type: String,
      enum: ["all_products", "selected_products"],
      default: "all_products",
    },
    selected_products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    usage_limit: {
      type: Number,
      default: null, // null means unlimited
    },
    usage_count: {
      type: Number,
      default: 0,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    created_by: {
      type: String, // Brand user email or admin email
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add indexes for better query performance
offerSchema.index({ brand: 1, is_active: 1, start_date: 1, end_date: 1 });
offerSchema.index({ coupon_code: 1 });
offerSchema.index({ selected_products: 1 });

// Virtual field to check if offer is currently valid
offerSchema.virtual("is_currently_valid").get(function () {
  const now = new Date();
  return (
    this.is_active &&
    now >= this.start_date &&
    now <= this.end_date &&
    (this.usage_limit === null || this.usage_count < this.usage_limit)
  );
});

// Method to calculate discount for a given price
offerSchema.methods.calculateDiscount = function (price) {
  if (!this.is_currently_valid) {
    return { discount: 0, finalPrice: price };
  }

  let discount = 0;
  if (this.discount_type === "percentage") {
    discount = (price * this.discount_value) / 100;
    if (this.max_discount_amount && discount > this.max_discount_amount) {
      discount = this.max_discount_amount;
    }
  } else {
    discount = Math.min(this.discount_value, price);
  }

  const finalPrice = Math.max(0, price - discount);
  return {
    discount: Math.round(discount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
  };
};

// Method to check if offer applies to a product
offerSchema.methods.appliesTo = function (productId) {
  if (this.applies_to === "all_products") {
    return true;
  }
  return this.selected_products.some(
    (id) => id.toString() === productId.toString()
  );
};

const Offer = mongoose.models.Offer || mongoose.model("Offer", offerSchema);

module.exports = Offer;
