module.exports = {
  // Cron schedule for automated import (every 24 hours at 2 AM IST)
  cronSchedule: "0 2 * * *",

  // Timezone for cron jobs
  timezone: "Asia/Kolkata",

  // Maximum products to fetch per API call
  maxProductsPerCall: 250,

  // Delay between API calls to avoid rate limiting (in milliseconds)
  apiCallDelay: 1000,

  // Retry attempts for failed imports
  maxRetries: 3,

  // Default category for imported products
  defaultCategory: "uncategorized",

  // Default currency
  defaultCurrency: "INR",

  // Product status to import
  productStatus: "active",

  // Fields to sync from Shopify
  syncFields: [
    "title",
    "body_html",
    "vendor",
    "product_type",
    "tags",
    "status",
    "published_at",
    "variants",
    "images",
    "options",
  ],

  // Variant fields to sync
  variantFields: [
    "id",
    "title",
    "price",
    "sku",
    "inventory_quantity",
    "weight",
    "weight_unit",
    "option1",
    "option2",
    "option3",
  ],
};



