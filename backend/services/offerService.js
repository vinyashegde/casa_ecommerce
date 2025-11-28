const Offer = require("../models/offer");
const OfferClaim = require("../models/offerClaim");
const Product = require("../models/product");

class OfferService {
  /**
   * Generate a unique coupon code
   */
  static generateCouponCode(brandName, title) {
    const brandPrefix = brandName.substring(0, 3).toUpperCase();
    const titlePrefix = title.substring(0, 3).toUpperCase();
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();
    return `${brandPrefix}${titlePrefix}${randomSuffix}`;
  }

  /**
   * Create a new offer
   */
  static async createOffer(offerData) {
    try {
      // Generate coupon code if not provided
      if (!offerData.coupon_code) {
        const Brand = require("../models/brand");
        const brand = await Brand.findById(offerData.brand);
        const brandName = brand ? brand.name : "BRAND";
        offerData.coupon_code = this.generateCouponCode(
          brandName,
          offerData.title
        );
      }

      const offer = new Offer(offerData);
      await offer.save();
      return await this.getOfferById(offer._id);
    } catch (error) {
      throw new Error(`Failed to create offer: ${error.message}`);
    }
  }

  /**
   * Get all offers for a brand with optional filters
   */
  static async getBrandOffers(brandId, filters = {}) {
    try {
      const query = { brand: brandId };

      // By default, only return active offers unless explicitly requested
      if (filters.is_active !== undefined) {
        query.is_active = filters.is_active;
      } else if (filters.include_inactive) {
        // Include both active and inactive offers for expired filter
        // Don't set is_active filter, so it includes both
      } else {
        query.is_active = true; // Default to only active offers
      }

      if (filters.only_valid) {
        const now = new Date();
        query.start_date = { $lte: now };
        query.end_date = { $gte: now };
        query.is_active = true;
      }

      const offers = await Offer.find(query)
        .populate("brand", "name logo_url")
        .populate("selected_products", "name") // Only populate name for performance
        .sort({ created_at: -1 });

      // Convert to plain objects and add virtual fields
      const offersWithVirtuals = offers.map((offer) => {
        const offerObj = offer.toObject();
        offerObj.is_currently_valid = offer.is_currently_valid;
        return offerObj;
      });

      return offersWithVirtuals;
    } catch (error) {
      throw new Error(`Failed to get brand offers: ${error.message}`);
    }
  }

  /**
   * Get all active offers
   */
  static async getAllOffers() {
    try {
      const query = { is_active: true };

      const offers = await Offer.find(query)
        .populate("brand", "name logo_url")
        .populate("selected_products", "name")
        .sort({ created_at: -1 });

      // Convert to plain objects and add virtual fields
      const offersWithVirtuals = offers.map((offer) => {
        const offerObj = offer.toObject();
        offerObj.is_currently_valid = offer.is_currently_valid;
        return offerObj;
      });

      return offersWithVirtuals;
    } catch (error) {
      throw new Error(`Failed to get all offers: ${error.message}`);
    }
  }

  /**
   * Get offers applicable to a specific product
   */
  static async getOffersForProduct(productId) {
    try {
      const product = await Product.findById(productId).populate("brand");
      if (!product) {
        throw new Error("Product not found");
      }

      const now = new Date();

      // Find offers that apply to this product
      const offers = await Offer.find({
        brand: product.brand._id,
        is_active: true,
        start_date: { $lte: now },
        end_date: { $gte: now },
        $or: [
          { applies_to: "all_products" },
          {
            applies_to: "selected_products",
            selected_products: productId,
          },
        ],
      })
        .populate("brand", "name logo_url")
        .sort({ discount_value: -1 }); // Sort by highest discount first

      // Filter out offers that have reached usage limit
      const validOffers = offers.filter(
        (offer) =>
          offer.usage_limit === null || offer.usage_count < offer.usage_limit
      );

      // Calculate discount for each offer
      const price =
        typeof product.price === "object" && product.price.$numberDecimal
          ? parseFloat(product.price.$numberDecimal)
          : parseFloat(product.price);

      const offersWithCalculations = validOffers.map((offer) => {
        const calculation = offer.calculateDiscount(price);
        return {
          ...offer.toObject(),
          calculated_discount: calculation.discount,
          calculated_final_price: calculation.finalPrice,
          original_price: price,
        };
      });

      return {
        product: {
          _id: product._id,
          name: product.name,
          price: price,
          brand: product.brand,
        },
        offers: offersWithCalculations,
      };
    } catch (error) {
      throw new Error(`Failed to get offers for product: ${error.message}`);
    }
  }

  /**
   * Claim an offer for a user
   */
  static async claimOffer(userId, offerId) {
    try {
      // Check if offer exists and is valid
      const offer = await Offer.findById(offerId).populate("brand");
      if (!offer) {
        throw new Error("Offer not found");
      }

      if (!offer.is_currently_valid) {
        throw new Error("Offer is not currently valid");
      }

      // Check if user has already claimed this offer
      const existingClaim = await OfferClaim.findOne({
        user: userId,
        offer: offerId,
      });

      if (existingClaim) {
        throw new Error("You have already claimed this offer");
      }

      // Check usage limit
      if (offer.usage_limit && offer.usage_count >= offer.usage_limit) {
        throw new Error("Offer usage limit has been reached");
      }

      // Create the claim
      const claim = new OfferClaim({
        user: userId,
        offer: offerId,
        coupon_code: offer.coupon_code,
      });

      await claim.save();

      // Increment usage count
      await Offer.findByIdAndUpdate(offerId, {
        $inc: { usage_count: 1 },
      });

      // Return claim with populated offer details
      return await OfferClaim.findById(claim._id).populate({
        path: "offer",
        populate: {
          path: "brand",
          select: "name logo_url",
        },
      });
    } catch (error) {
      throw new Error(`Failed to claim offer: ${error.message}`);
    }
  }

  /**
   * Get all claimed offers for a user
   */
  static async getUserClaimedOffers(userId, filters = {}) {
    try {
      const query = { user: userId };

      if (filters.is_used !== undefined) {
        query.is_used = filters.is_used;
      }

      const claims = await OfferClaim.find(query)
        .populate({
          path: "offer",
          populate: {
            path: "brand",
            select: "name logo_url",
          },
        })
        .sort({ claimed_at: -1 });

      return claims;
    } catch (error) {
      throw new Error(`Failed to get user claimed offers: ${error.message}`);
    }
  }

  /**
   * Get offer by ID
   */
  static async getOfferById(offerId) {
    try {
      const offer = await Offer.findById(offerId)
        .populate("brand", "name logo_url")
        .populate("selected_products", "name price images");

      if (!offer) {
        throw new Error("Offer not found");
      }

      return offer;
    } catch (error) {
      throw new Error(`Failed to get offer: ${error.message}`);
    }
  }

  /**
   * Update an offer
   */
  static async updateOffer(offerId, updateData) {
    try {
      const offer = await Offer.findByIdAndUpdate(
        offerId,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate("brand", "name logo_url")
        .populate("selected_products", "name price images");

      if (!offer) {
        throw new Error("Offer not found");
      }

      return offer;
    } catch (error) {
      throw new Error(`Failed to update offer: ${error.message}`);
    }
  }

  /**
   * Delete an offer (soft delete by setting is_active to false)
   */
  static async deleteOffer(offerId) {
    try {
      const offer = await Offer.findByIdAndUpdate(
        offerId,
        { is_active: false, updated_at: new Date() },
        { new: true }
      );

      if (!offer) {
        throw new Error("Offer not found");
      }

      return offer;
    } catch (error) {
      throw new Error(`Failed to delete offer: ${error.message}`);
    }
  }

  /**
   * Validate coupon code and return offer details
   */
  static async validateCouponCode(couponCode, userId = null) {
    try {
      const offer = await Offer.findOne({
        coupon_code: couponCode.toUpperCase(),
        is_active: true,
      }).populate("brand", "name logo_url");

      if (!offer) {
        throw new Error("Invalid coupon code");
      }

      if (!offer.is_currently_valid) {
        throw new Error("Coupon has expired or is not yet active");
      }

      // If userId provided, check if user has claimed this offer
      let userClaim = null;
      if (userId) {
        userClaim = await OfferClaim.findOne({
          user: userId,
          offer: offer._id,
        });
      }

      return {
        offer: offer,
        userHasClaimed: !!userClaim,
        claim: userClaim,
      };
    } catch (error) {
      throw new Error(`Failed to validate coupon code: ${error.message}`);
    }
  }

  /**
   * Validate coupon code for specific cart items (brand-specific validation)
   */
  static async validateCouponForCart(couponCode, cartItems, userId = null) {
    try {
      const offer = await Offer.findOne({
        coupon_code: couponCode.toUpperCase(),
        is_active: true,
      }).populate("brand", "name logo_url");

      if (!offer) {
        throw new Error("Invalid coupon code");
      }

      if (!offer.is_currently_valid) {
        throw new Error("Coupon has expired or is not yet active");
      }

      // Check if coupon is valid for the brands in the cart
      const cartBrands = new Set();
      cartItems.forEach((item) => {
        if (item.product && item.product.brand) {
          const brandId =
            typeof item.product.brand === "string"
              ? item.product.brand
              : item.product.brand._id || item.product.brand;
          cartBrands.add(brandId.toString());
        }
      });

      // Check if the coupon's brand matches any brand in the cart
      const offerBrandId = offer.brand._id.toString();
      if (!cartBrands.has(offerBrandId)) {
        throw new Error("This coupon is not valid for this brand");
      }

      // If userId provided, check if user has claimed this offer
      let userClaim = null;
      if (userId) {
        userClaim = await OfferClaim.findOne({
          user: userId,
          offer: offer._id,
        });
      }

      return {
        offer: offer,
        userHasClaimed: !!userClaim,
        claim: userClaim,
        isValidForCart: true,
      };
    } catch (error) {
      throw new Error(`Failed to validate coupon code: ${error.message}`);
    }
  }

  /**
   * Use a claimed offer (mark as used)
   */
  static async useOffer(claimId, orderData = {}) {
    try {
      const claim = await OfferClaim.findById(claimId)
        .populate("offer")
        .populate("user");

      if (!claim) {
        throw new Error("Offer claim not found");
      }

      if (claim.is_used) {
        throw new Error("Offer has already been used");
      }

      // Update claim as used
      claim.is_used = true;
      claim.used_at = new Date();

      if (orderData.order_id) {
        claim.order_id = orderData.order_id;
      }
      if (orderData.discount_amount) {
        claim.discount_amount = orderData.discount_amount;
      }
      if (orderData.original_price) {
        claim.original_price = orderData.original_price;
      }
      if (orderData.final_price) {
        claim.final_price = orderData.final_price;
      }

      await claim.save();

      return claim;
    } catch (error) {
      throw new Error(`Failed to use offer: ${error.message}`);
    }
  }
}

module.exports = OfferService;
