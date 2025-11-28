const cron = require("node-cron");
const axios = require("axios");
const Brand = require("../models/brand");
const Category = require("../models/category");
const Product = require("../models/product");

class ShopifyAutoImport {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncStatus = "idle";
    this.errorLog = [];
  }

  // Start the automated import service
  start() {
    // Get schedule from environment variables
    const schedule = process.env.SHOPIFY_SYNC_TIME || "02:00";
    const timezone = process.env.SHOPIFY_TIMEZONE || "Asia/Kolkata";

    // Parse schedule (format: "02:00" -> "0 2")
    const [hour, minute] = schedule.split(":");
    const cronSchedule = `${minute || 0} ${hour || 2} * * *`;

    cron.schedule(
      cronSchedule,
      () => {
        this.runAutoImport();
      },
      {
        scheduled: true,
        timezone: timezone,
      }
    );

    // Also run on server startup (optional)
    setTimeout(() => {
      this.runAutoImport();
    }, 30000); // Wait 30 seconds after server starts
  }

  // Main automated import function
  async runAutoImport() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.syncStatus = "running";
    this.lastSyncTime = new Date();

    try {
      // Get all brands that have Shopify integration enabled
      const brands = await Brand.find({
        "shopify_integration.enabled": true,
        "shopify_integration.domain": { $exists: true, $ne: "" },
      });

      if (brands.length === 0) {
        this.syncStatus = "no_integrations";
        return;
      }

      for (const brand of brands) {
        try {
          await this.importBrandProducts(brand);
        } catch (error) {
          console.error(
            `❌ Error importing products for brand ${brand.name}:`,
            error.message
          );
          this.errorLog.push({
            brand: brand.name,
            error: error.message,
            timestamp: new Date(),
          });
        }
      }

      this.syncStatus = "completed";
    } catch (error) {
      console.error("❌ Automated import failed:", error);
      this.syncStatus = "failed";
      this.errorLog.push({
        brand: "SYSTEM",
        error: error.message,
        timestamp: new Date(),
      });
    } finally {
      this.isRunning = false;
    }
  }

  // Import products for a specific brand
  async importBrandProducts(brand) {
    const { domain } = brand.shopify_integration;

    // Use Admin API for more comprehensive data
    const adminEndpoint = `https://${domain}/admin/api/2024-07/products.json`;

    try {
      const response = await axios.get(adminEndpoint, {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN,
          "Content-Type": "application/json",
        },
        params: {
          limit: 250, // Maximum allowed by Shopify
          status: "active",
        },
      });

      const products = response.data.products;

      if (products.length === 0) {
        return;
      }

      // Process and save products
      await this.processAndSaveProducts(products, brand);

      // Update brand's last sync time
      await Brand.findByIdAndUpdate(brand._id, {
        "shopify_integration.last_sync": new Date(),
        "shopify_integration.products_count": products.length,
      });
    } catch (error) {
      throw new Error(
        `Shopify API error: ${error.response?.data?.errors || error.message}`
      );
    }
  }

  // Process and save products to database
  async processAndSaveProducts(shopifyProducts, brand) {
    const defaultCategoryName = "uncategorized";

    // Find or create default category
    let categoryDoc = await Category.findOne({ name: defaultCategoryName });
    if (!categoryDoc) {
      categoryDoc = new Category({
        name: defaultCategoryName,
        image: "https://via.placeholder.com/150",
      });
      await categoryDoc.save();
    }

    // Prepare product documents with enhanced data
    const productDocs = shopifyProducts.map((product) => ({
      name: product.title,
      description: product.body_html || "No description available.",
      price: product.variants?.[0]?.price || 0,
      brand: brand._id,
      images: product.images?.map((img) => img.src) || [],
      currency: "INR", // Default currency
      category: [categoryDoc._id],
      stock:
        product.variants?.reduce(
          (total, variant) => total + (variant.inventory_quantity || 0),
          0
        ) || 0,
      is_active: product.status === "active",
      tags:
        product.tags
          ?.split(",")
          .map((tag) => tag.trim())
          .filter(Boolean) || [],
      sizes:
        product.variants?.map((variant) => variant.title).filter(Boolean) || [],
      fits: [],
      geo_tags: [],
      gender: this.determineGender(product),
      shopify_id: product.id,
      shopify_handle: product.handle,
      vendor: product.vendor,
      product_type: product.product_type,
      published_at: product.published_at,
      variants:
        product.variants?.map((variant) => ({
          shopify_variant_id: variant.id,
          title: variant.title,
          price: variant.price,
          sku: variant.sku,
          inventory_quantity: variant.inventory_quantity,
          weight: variant.weight,
          weight_unit: variant.weight_unit,
        })) || [],
    }));

    // Check for existing products and update or create
    for (const productDoc of productDocs) {
      const existingProduct = await Product.findOne({
        brand: brand._id,
        shopify_id: productDoc.shopify_id,
      });

      if (existingProduct) {
        // Update existing product
        await Product.findByIdAndUpdate(existingProduct._id, {
          ...productDoc,
          updated_at: new Date(),
        });
      } else {
        // Create new product
        await Product.create(productDoc);
      }
    }
  }

  // Determine gender from product data
  determineGender(product) {
    const title = product.title?.toLowerCase() || "";
    const tags = product.tags?.toLowerCase() || "";
    const productType = product.product_type?.toLowerCase() || "";

    if (
      title.includes("men") ||
      tags.includes("men") ||
      productType.includes("men")
    ) {
      return "male";
    } else if (
      title.includes("women") ||
      tags.includes("women") ||
      productType.includes("women")
    ) {
      return "female";
    } else if (
      title.includes("unisex") ||
      tags.includes("unisex") ||
      productType.includes("unisex")
    ) {
      return "unisex";
    }

    return "unisex"; // Default
  }

  // Get sync status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      syncStatus: this.syncStatus,
      errorLog: this.errorLog.slice(-10), // Last 10 errors
    };
  }

  // Manual trigger for testing
  async manualTrigger() {
    await this.runAutoImport();
  }

  // Stop the service
  stop() {
    // Cron will continue running, but we can mark as stopped
    this.syncStatus = "stopped";
  }
}

module.exports = new ShopifyAutoImport();
