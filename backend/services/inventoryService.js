const Product = require("../models/product");
const Order = require("../models/order");

class InventoryService {
  /**
   * Update product stock when an order is delivered
   * @param {string} orderId - The order ID
   * @param {string} brandId - The brand ID (for security)
   */
  static async updateStockOnDelivery(orderId, brandId) {
    try {
      console.log(`🔄 Updating stock for delivered order: ${orderId}`);

      // Find the order and verify it belongs to the brand
      const order = await Order.findById(orderId).populate("products.product");

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.brandId.toString() !== brandId.toString()) {
        throw new Error(`Order ${orderId} does not belong to brand ${brandId}`);
      }

      if (order.deliveryStatus !== "Delivered") {
        console.log(
          `⚠️ Order ${orderId} is not delivered yet, skipping stock update`
        );
        return;
      }

      // Check if stock has already been updated for this order
      if (order.stockUpdated) {
        console.log(`ℹ️ Stock already updated for order ${orderId}`);
        return;
      }

      // Check if stock was already deducted on order creation
      if (order.stockDeducted) {
        console.log(`ℹ️ Stock was already deducted on order creation for ${orderId}, marking as updated`);
        // Just mark as updated since stock was already deducted
        order.stockUpdated = true;
        order.stockUpdatedAt = new Date();
        await order.save();
        return {
          success: true,
          orderId: orderId,
          message: "Stock already deducted on order creation",
          stockUpdates: [],
          updatedAt: new Date(),
        };
      }

      const stockUpdates = [];

      // Process each product in the order
      for (const orderProduct of order.products) {
        const product = orderProduct.product;
        const quantity = orderProduct.quantity || 1;
        const size = orderProduct.size;

        if (!product) {
          console.warn(
            `⚠️ Product not found for order item: ${orderProduct.product}`
          );
          continue;
        }

        // Update product stock
        const updatedProduct = await this.reduceProductStock(
          product._id,
          quantity,
          size
        );

        if (updatedProduct) {
          stockUpdates.push({
            productId: product._id,
            productName: product.name,
            size: size,
            quantityReduced: quantity,
            newStock: this.getProductStock(updatedProduct, size),
          });
        }
      }

      // Mark order as having stock updated
      order.stockUpdated = true;
      order.stockUpdatedAt = new Date();
      await order.save();

      console.log(`✅ Stock updated for order ${orderId}:`, stockUpdates);

      return {
        success: true,
        orderId: orderId,
        stockUpdates: stockUpdates,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error(`❌ Error updating stock for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Update product stock immediately when an order is created
   * @param {string} orderId - The order ID
   * @param {string} brandId - The brand ID (for security)
   */
  static async updateStockOnOrderCreation(orderId, brandId) {
    try {
      console.log(`🔄 Deducting stock for new order: ${orderId}`);

      // Find the order and verify it belongs to the brand
      const order = await Order.findById(orderId).populate("products.product");

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.brandId.toString() !== brandId.toString()) {
        throw new Error(`Order ${orderId} does not belong to brand ${brandId}`);
      }

      // Check if stock has already been deducted for this order
      if (order.stockDeducted) {
        console.log(`ℹ️ Stock already deducted for order ${orderId}`);
        return {
          success: true,
          message: "Stock already deducted",
          orderId: orderId,
        };
      }

      const stockUpdates = [];

      // Process each product in the order
      for (const orderProduct of order.products) {
        const product = orderProduct.product;
        const quantity = orderProduct.quantity || 1;
        const size = orderProduct.size;

        if (!product) {
          console.warn(
            `⚠️ Product not found for order item: ${orderProduct.product}`
          );
          continue;
        }

        // Update product stock
        const updatedProduct = await this.reduceProductStock(
          product._id,
          quantity,
          size
        );

        if (updatedProduct) {
          stockUpdates.push({
            productId: product._id,
            productName: product.name,
            size: size,
            quantityReduced: quantity,
            newStock: this.getProductStock(updatedProduct, size),
          });
        }
      }

      // Mark order as having stock deducted
      order.stockDeducted = true;
      order.stockDeductedAt = new Date();
      await order.save();

      console.log(`✅ Stock deducted for order ${orderId}:`, stockUpdates);

      return {
        success: true,
        orderId: orderId,
        stockUpdates: stockUpdates,
        deductedAt: new Date(),
      };
    } catch (error) {
      console.error(`❌ Error deducting stock for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Reduce stock for a specific product
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to reduce
   * @param {string} size - Size (for variants)
   */
  static async reduceProductStock(productId, quantity, size = null) {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // If product has variants, update variant stock
      if (product.product_variants && product.product_variants.length > 0) {
        return await this.updateVariantStock(product, quantity, size);
      } else {
        // Update main stock field
        const currentStock = product.stock || 0;
        const newStock = Math.max(0, currentStock - quantity);

        product.stock = newStock;
        await product.save();

        console.log(
          `📦 Updated main stock for ${product.name}: ${currentStock} → ${newStock}`
        );
        return product;
      }
    } catch (error) {
      console.error(`❌ Error reducing stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Update stock for product variants
   * @param {Object} product - Product document
   * @param {number} quantity - Quantity to reduce
   * @param {string} size - Size to update
   */
  static async updateVariantStock(product, quantity, size) {
    try {
      let updated = false;

      // Find the variant with the matching size
      for (const variant of product.product_variants) {
        for (const sizeObj of variant.sizes) {
          if (sizeObj.size === size) {
            const currentStock = sizeObj.stock || 0;
            const newStock = Math.max(0, currentStock - quantity);
            sizeObj.stock = newStock;
            updated = true;

            console.log(
              `📦 Updated variant stock for ${product.name} (${variant.color}, ${size}): ${currentStock} → ${newStock}`
            );
            break;
          }
        }
        if (updated) break;
      }

      if (!updated) {
        console.warn(
          `⚠️ Size ${size} not found in variants for product ${product.name}`
        );
        // Fallback to main stock if variant not found
        const currentStock = product.stock || 0;
        const newStock = Math.max(0, currentStock - quantity);
        product.stock = newStock;
      }

      await product.save();
      return product;
    } catch (error) {
      console.error(`❌ Error updating variant stock:`, error);
      throw error;
    }
  }

  /**
   * Get current stock for a product
   * @param {Object} product - Product document
   * @param {string} size - Size (for variants)
   */
  static getProductStock(product, size = null) {
    if (product.product_variants && product.product_variants.length > 0) {
      // Calculate total stock from variants
      let totalStock = 0;
      for (const variant of product.product_variants) {
        for (const sizeObj of variant.sizes) {
          if (!size || sizeObj.size === size) {
            totalStock += sizeObj.stock || 0;
          }
        }
      }
      return totalStock;
    } else {
      return product.stock || 0;
    }
  }

  /**
   * Add stock to a product (for manual stock updates)
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @param {string} size - Size (for variants)
   */
  static async addProductStock(productId, quantity, size = null) {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      if (product.product_variants && product.product_variants.length > 0) {
        // Add to variant stock
        for (const variant of product.product_variants) {
          for (const sizeObj of variant.sizes) {
            if (!size || sizeObj.size === size) {
              sizeObj.stock = (sizeObj.stock || 0) + quantity;
            }
          }
        }
      } else {
        // Add to main stock
        product.stock = (product.stock || 0) + quantity;
      }

      await product.save();
      console.log(`📦 Added ${quantity} stock to ${product.name}`);
      return product;
    } catch (error) {
      console.error(`❌ Error adding stock to product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get inventory summary for a brand
   * @param {string} brandId - Brand ID
   */
  static async getInventorySummary(brandId) {
    try {
      const products = await Product.find({ brand: brandId });

      let totalStock = 0;
      let lowStockProducts = [];
      let outOfStockProducts = [];

      for (const product of products) {
        const stock = this.getProductStock(product);
        totalStock += stock;

        if (stock === 0) {
          outOfStockProducts.push({
            id: product._id,
            name: product.name,
            stock: stock,
          });
        } else if (stock <= 5) {
          // Consider low stock if 5 or fewer items
          lowStockProducts.push({
            id: product._id,
            name: product.name,
            stock: stock,
          });
        }
      }

      return {
        totalProducts: products.length,
        totalStock: totalStock,
        lowStockProducts: lowStockProducts,
        outOfStockProducts: outOfStockProducts,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      };
    } catch (error) {
      console.error(
        `❌ Error getting inventory summary for brand ${brandId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update product stock when an order is placed
   * @param {string} orderId - The order ID
   * @param {Array} products - Array of products with quantities
   */
  static async updateStockOnOrder(orderId, products) {
    try {
      console.log(`🔄 Updating stock for new order: ${orderId}`);

      const stockUpdates = [];

      // Process each product in the order
      for (const orderProduct of products) {
        const { productId, quantity, size } = orderProduct;

        // Update product stock
        const product = await Product.findById(productId);

        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        // Check if there's enough stock
        const currentStock = this.getProductStock(product, size);
        if (currentStock < quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }

        const updatedProduct = await this.reduceProductStock(
          productId,
          quantity,
          size
        );

        if (updatedProduct) {
          stockUpdates.push({
            productId: product._id,
            productName: product.name,
            size: size,
            quantityReduced: quantity,
            newStock: this.getProductStock(updatedProduct, size),
          });
        }
      }

      console.log(`✅ Stock updated for order ${orderId}:`, stockUpdates);

      return {
        success: true,
        orderId: orderId,
        stockUpdates: stockUpdates,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error(`❌ Error updating stock for order ${orderId}:`, error);
      throw error;
    }
  }
}

module.exports = InventoryService;
