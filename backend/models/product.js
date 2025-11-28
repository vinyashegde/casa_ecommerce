const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    // DEPRECATED: Use product_variants[].images instead
    // This field is kept for backward compatibility only
    images: {
      type: [String],
      default: [],
    },
    price: { type: mongoose.Schema.Types.Decimal128, required: true },
    currency: {
      type: String,
      default: "INR",
    },
    sizes: {
      type: [String],
      default: [],
    },
    fits: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    geo_tags: {
      type: [String],
      default: [],
    },
    gender: {
      type: String,
      enum: ["male", "female", "unisex"],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    // Offer field
    offerPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Assigned coupon field
    assigned_coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      default: null,
    },
    // Shopify integration fields
    shopify_id: { type: String },
    shopify_handle: { type: String },
    vendor: { type: String },
    product_type: { type: String },
    published_at: { type: Date },
    // Shopify integration variants (legacy)
    variants: [
      {
        shopify_variant_id: String,
        title: String,
        price: mongoose.Schema.Types.Decimal128,
        sku: String,
        inventory_quantity: Number,
        weight: Number,
        weight_unit: String,
      },
    ],
    // Product variants for color/size combinations
    product_variants: [
      {
        color: {
          type: String,
          required: true,
        },
        sizes: [
          {
            size: {
              type: String,
              required: true,
            },
            stock: {
              type: Number,
              required: true,
              min: 0,
            },
          },
        ],
        price: {
          type: mongoose.Schema.Types.Decimal128,
          required: true,
        },
        images: {
          type: [String],
          default: [],
        },
        sku: {
          type: String,
          sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
        },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Add unique compound index for shopify_id and brand (only when shopify_id exists and is a string)
productSchema.index(
  { shopify_id: 1, brand: 1 },
  {
    unique: true,
    partialFilterExpression: {
      shopify_id: { $exists: true, $type: "string" },
    },
  }
);

// Add index for gender queries with pagination
productSchema.index({ gender: 1, is_active: 1, created_at: -1 });

// Add compound index for SKU uniqueness within product variants
productSchema.index(
  { "product_variants.sku": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "product_variants.sku": { $exists: true, $ne: null },
    },
  }
);

productSchema.set("timestamps", {
  createdAt: "created_at",
  updatedAt: "updated_at",
});

// ✅ Avoid model overwrite
const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = Product;
