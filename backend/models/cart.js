const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  size: {
    type: String,
    default: "M", // Default size
  },
  color: {
    type: String,
    default: null, // Color for variant products
  },
  variant: {
    color: String,
    sizes: [
      {
        size: String,
        stock: Number,
      },
    ],
    price: mongoose.Schema.Types.Decimal128,
    images: [String],
    sku: String,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  // Store price at time of adding to cart (for price consistency)
  priceAtAdd: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
});

const cartSchema = new mongoose.Schema({
  // User identification (using email as primary identifier)
  email: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true,
  },

  // Cart items
  items: [cartItemSchema],

  // Cart metadata
  totalItems: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Last activity (for cart cleanup/expiry)
  lastActivity: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
cartSchema.index({ email: 1 });
cartSchema.index({ updatedAt: 1 });
cartSchema.index({ lastActivity: 1 });

// Pre-save middleware to update totals and timestamps
cartSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  this.lastActivity = new Date();

  // Calculate totals
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => {
    return sum + parseFloat(item.priceAtAdd.toString()) * item.quantity;
  }, 0);

  next();
});

// Instance methods
cartSchema.methods.addItem = function (
  productId,
  quantity = 1,
  size = "M",
  price,
  color = null,
  variant = null
) {
  const existingItemIndex = this.items.findIndex((item) => {
    if (!item.product) return false;
    const itemProductId = item.product._id
      ? item.product._id.toString()
      : item.product.toString();
    // Check for exact match including color for variant products
    return (
      itemProductId === productId.toString() &&
      item.size === size &&
      item.color === color
    );
  });

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    const newItem = {
      product: productId,
      quantity,
      size,
      priceAtAdd: price,
    };

    // Add variant data if provided
    if (color) {
      newItem.color = color;
    }
    if (variant) {
      newItem.variant = variant;
    }

    this.items.push(newItem);
  }

  return this.save();
};

cartSchema.methods.removeItem = function (productId, size = null) {
  if (size) {
    // Remove specific size
    this.items = this.items.filter((item) => {
      if (!item.product) return true; // Keep items with null products
      const itemProductId = item.product._id
        ? item.product._id.toString()
        : item.product.toString();
      return !(itemProductId === productId.toString() && item.size === size);
    });
  } else {
    // Remove all instances of product
    this.items = this.items.filter((item) => {
      if (!item.product) return true; // Keep items with null products
      const itemProductId = item.product._id
        ? item.product._id.toString()
        : item.product.toString();
      return itemProductId !== productId.toString();
    });
  }

  return this.save();
};

cartSchema.methods.updateQuantity = function (productId, size, newQuantity) {
  const item = this.items.find((item) => {
    if (!item.product) return false;
    const itemProductId = item.product._id
      ? item.product._id.toString()
      : item.product.toString();
    return itemProductId === productId.toString() && item.size === size;
  });

  if (item) {
    if (newQuantity <= 0) {
      return this.removeItem(productId, size);
    } else {
      item.quantity = newQuantity;
      return this.save();
    }
  }

  throw new Error("Item not found in cart");
};

cartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

// Static methods
cartSchema.statics.findByEmail = function (email) {
  return this.findOne({ email }).populate({
    path: "items.product",
    populate: [
      {
        path: "brand",
        select: "name logo_url",
      },
      {
        path: "assigned_coupon",
        select:
          "title coupon_code discount_type discount_value max_discount_amount min_order_value is_active start_date end_date usage_limit usage_count",
      },
    ],
  });
};

cartSchema.statics.createOrGetCart = async function (email) {
  let cart = await this.findByEmail(email);

  if (!cart) {
    cart = new this({ email });
    await cart.save();
  }

  return cart;
};

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
