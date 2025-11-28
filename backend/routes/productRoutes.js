// backend/routes/productRoutes.js
const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  getProductByCategory,
  getAllProductsByBrand,
  getAllProductsByPrice,
  getProductsByGender,
  getProductsByTag,
  search,
  createProduct,
  deleteProduct,
  updateProduct,
  getProductSuggestions,
  getInventorySummary,
  updateProductStock,
  getProductStock,
} = require("../controllers/productController");

// CREATE product
router.post("/create", createProduct);

// GET all products by brand ID
router.get("/brand/:id", getAllProductsByBrand);

// GET all products (with pagination and exclusion)
router.get("/", getAllProducts);

// GET product by ID
router.get("/id/:id", getProductById);

// GET products by category (tag-based)
router.get("/category", getProductByCategory);

// GET products by price range
router.get("/price", getAllProductsByPrice);

// GET products by gender
router.get("/gender", getProductsByGender);

// GET products by tag
router.get("/tag", getProductsByTag);

// GET product suggestions for search
router.get("/suggestions", getProductSuggestions);

// SEARCH products
router.post("/search", search);

// UPDATE product by ID
router.put("/update/:id", updateProduct);

// DELETE product by ID
router.delete("/id/:id", deleteProduct);

// Inventory management routes
// GET inventory summary for a brand
router.get("/inventory/summary/:brandId", getInventorySummary);

// GET product stock details
router.get("/stock/:productId", getProductStock);

// UPDATE product stock manually
router.patch("/stock/:productId", updateProductStock);

// CHECK stock availability for multiple products (for order validation)
router.post("/stock/check", async (req, res) => {
  try {
    const { products } = req.body; // Array of {productId, quantity, size}

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: "Products array is required" });
    }

    const stockCheck = [];

    for (const item of products) {
      const { productId, quantity, size } = item;

      if (!productId || !quantity) {
        stockCheck.push({
          productId,
          available: false,
          error: "Product ID and quantity are required",
        });
        continue;
      }

      try {
        const Product = require("../models/product");
        const InventoryService = require("../services/inventoryService");

        const product = await Product.findById(productId);
        if (!product) {
          stockCheck.push({
            productId,
            available: false,
            error: "Product not found",
          });
          continue;
        }

        const currentStock = InventoryService.getProductStock(product, size);
        const available = currentStock >= quantity;

        stockCheck.push({
          productId,
          productName: product.name,
          size: size || "default",
          requestedQuantity: quantity,
          currentStock,
          available,
          error: available ? null : `Only ${currentStock} items available`,
        });
      } catch (error) {
        stockCheck.push({
          productId,
          available: false,
          error: `Error checking stock: ${error.message}`,
        });
      }
    }

    const allAvailable = stockCheck.every((item) => item.available);

    res.json({
      success: true,
      allAvailable,
      stockCheck,
    });
  } catch (error) {
    console.error("❌ Error checking stock availability:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
