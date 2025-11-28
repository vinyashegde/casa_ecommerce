const Product = require("../models/product");
const Offer = require("../models/offer");

class InventoryValueService {
  /**
   * Calculate the total inventory value across all products with offers applied
   * @param {string} brandId - Optional brand ID to filter products
   * @returns {Object} - Object containing total value and breakdown
   */
  static async calculateTotalInventoryValue(brandId = null) {
    try {
      // Build query for products
      const productQuery = { is_active: true };
      if (brandId) {
        productQuery.brand = brandId;
      }

      // Get all active products with their brand information
      const products = await Product.find(productQuery)
        .populate("brand", "name")
        .lean();

      if (products.length === 0) {
        return {
          totalValue: 0,
          totalProducts: 0,
          breakdown: [],
          formattedTotal: "₹0",
        };
      }

      // Get all active offers
      const now = new Date();
      const offers = await Offer.find({
        is_active: true,
        start_date: { $lte: now },
        end_date: { $gte: now },
      }).lean();

      let totalValue = 0;
      const breakdown = [];

      for (const product of products) {
        const productValue = await this.calculateProductValue(product, offers);
        totalValue += productValue.effectiveValue;
        breakdown.push(productValue);
      }

      return {
        totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
        totalProducts: products.length,
        breakdown: breakdown,
        formattedTotal: this.formatCurrency(totalValue),
      };
    } catch (error) {
      console.error("Error calculating inventory value:", error);
      throw new Error(`Failed to calculate inventory value: ${error.message}`);
    }
  }

  /**
   * Calculate the effective value of a single product with offers applied
   * @param {Object} product - Product object
   * @param {Array} offers - Array of active offers
   * @returns {Object} - Product value breakdown
   */
  static async calculateProductValue(product, offers) {
    // Extract price from product (handle both number and Decimal128)
    const originalPrice = this.extractPrice(product.price);
    const stock = product.stock || 0;

    // Find applicable offers for this product
    const applicableOffers = this.findApplicableOffers(product, offers);

    // Calculate the best discount from applicable offers
    let bestDiscount = 0;
    let appliedOffer = null;

    for (const offer of applicableOffers) {
      const discount = this.calculateDiscount(originalPrice, offer);
      if (discount > bestDiscount) {
        bestDiscount = discount;
        appliedOffer = offer;
      }
    }

    // Calculate effective price (ensure it's never negative)
    const effectivePrice = Math.max(originalPrice - bestDiscount, 0);
    const effectiveValue = effectivePrice * stock;

    return {
      productId: product._id,
      productName: product.name,
      brandName: product.brand?.name || "Unknown Brand",
      originalPrice: originalPrice,
      stock: stock,
      discount: bestDiscount,
      effectivePrice: effectivePrice,
      effectiveValue: effectiveValue,
      appliedOffer: appliedOffer
        ? {
            title: appliedOffer.title,
            couponCode: appliedOffer.coupon_code,
            discountType: appliedOffer.discount_type,
            discountValue: appliedOffer.discount_value,
          }
        : null,
      formattedOriginalPrice: this.formatCurrency(originalPrice),
      formattedEffectivePrice: this.formatCurrency(effectivePrice),
      formattedEffectiveValue: this.formatCurrency(effectiveValue),
    };
  }

  /**
   * Find offers that apply to a specific product
   * @param {Object} product - Product object
   * @param {Array} offers - Array of active offers
   * @returns {Array} - Array of applicable offers
   */
  static findApplicableOffers(product, offers) {
    return offers.filter((offer) => {
      // Check if offer is for the same brand
      if (offer.brand.toString() !== product.brand._id.toString()) {
        return false;
      }

      // Check if offer applies to this product
      if (offer.applies_to === "all_products") {
        return true;
      }

      if (offer.applies_to === "selected_products") {
        return offer.selected_products.some(
          (productId) => productId.toString() === product._id.toString()
        );
      }

      return false;
    });
  }

  /**
   * Calculate discount amount for a given price and offer
   * @param {number} price - Original price
   * @param {Object} offer - Offer object
   * @returns {number} - Discount amount
   */
  static calculateDiscount(price, offer) {
    if (offer.discount_type === "percentage") {
      let discount = (price * offer.discount_value) / 100;

      // Apply max discount limit if specified
      if (offer.max_discount_amount && discount > offer.max_discount_amount) {
        discount = offer.max_discount_amount;
      }

      return discount;
    } else if (offer.discount_type === "fixed") {
      // For fixed discount, don't exceed the original price
      return Math.min(offer.discount_value, price);
    }

    return 0;
  }

  /**
   * Extract price from product price field (handles both number and Decimal128)
   * @param {number|Object} price - Price field from product
   * @returns {number} - Extracted price as number
   */
  static extractPrice(price) {
    if (typeof price === "number") {
      return price;
    } else if (typeof price === "object" && price !== null) {
      // Handle Decimal128 object
      if (price.$numberDecimal) {
        return parseFloat(price.$numberDecimal);
      }

      // Handle Decimal128 toString method
      if (typeof price.toString === "function") {
        return parseFloat(price.toString());
      }
    }

    return 0;
  }

  /**
   * Format currency value for display
   * @param {number} amount - Amount to format
   * @returns {string} - Formatted currency string
   */
  static formatCurrency(amount) {
    if (amount >= 10000000) {
      // 1 crore and above
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // 1 lakh and above
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      // 1 thousand and above
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${amount.toFixed(0)}`;
    }
  }

  /**
   * Get inventory value summary for dashboard
   * @param {string} brandId - Optional brand ID to filter products
   * @returns {Object} - Summary object for dashboard display
   */
  static async getInventorySummary(brandId = null) {
    try {
      const result = await this.calculateTotalInventoryValue(brandId);

      return {
        totalValue: result.totalValue,
        formattedTotal: result.formattedTotal,
        totalProducts: result.totalProducts,
        averageValuePerProduct:
          result.totalProducts > 0
            ? Math.round((result.totalValue / result.totalProducts) * 100) / 100
            : 0,
        formattedAverageValue:
          result.totalProducts > 0
            ? this.formatCurrency(result.totalValue / result.totalProducts)
            : "₹0",
      };
    } catch (error) {
      console.error("Error getting inventory summary:", error);
      throw new Error(`Failed to get inventory summary: ${error.message}`);
    }
  }
}

module.exports = InventoryValueService;
