const OfferService = require("../services/offerService");
const mongoose = require("mongoose");

class OfferController {
  // Create a new offer
  static async createOffer(req, res) {
    try {
      const offer = await OfferService.createOffer(req.body);

      res.status(201).json({
        success: true,
        message: "Offer created successfully",
        data: offer,
      });
    } catch (error) {
      console.error("❌ Error creating offer:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create offer",
      });
    }
  }

  // Get all offers for a brand
  static async getBrandOffers(req, res) {
    try {
      const { brandId } = req.params;

      // Check if brandId is a valid ObjectId, if not, try to find by name
      let actualBrandId = brandId;
      if (!mongoose.Types.ObjectId.isValid(brandId)) {
        const Brand = require("../models/brand");
        const brand = await Brand.findOne({ name: brandId });
        if (!brand) {
          return res.status(404).json({
            success: false,
            message: "Brand not found",
          });
        }
        actualBrandId = brand._id;
      }

      const filters = {};

      if (req.query.filter === "active") {
        filters.only_valid = true;
      } else if (req.query.filter === "expired") {
        // For expired filter, we want to show both expired and deleted offers
        filters.include_inactive = true;
      }

      const offers = await OfferService.getBrandOffers(actualBrandId, filters);

      res.json({
        success: true,
        data: offers,
      });
    } catch (error) {
      console.error("❌ Error fetching brand offers:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch offers",
      });
    }
  }

  // Get all active offers
  static async getAllOffers(req, res) {
    try {
      const offers = await OfferService.getAllOffers();

      res.json({
        success: true,
        data: offers,
      });
    } catch (error) {
      console.error("❌ Error fetching all offers:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch offers",
      });
    }
  }

  // Get offers for a specific product
  static async getOffersForProduct(req, res) {
    try {
      const { productId } = req.params;
      const result = await OfferService.getOffersForProduct(productId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching product offers:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch product offers",
      });
    }
  }

  // Claim an offer
  static async claimOffer(req, res) {
    try {
      const { offerId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const claim = await OfferService.claimOffer(userId, offerId);

      res.json({
        success: true,
        message: "Offer claimed successfully",
        data: claim,
      });
    } catch (error) {
      console.error("Error claiming offer:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to claim offer",
      });
    }
  }

  // Get user's claimed offers
  static async getUserClaimedOffers(req, res) {
    try {
      const { userId } = req.params;
      const filters = {};

      if (req.query.is_used !== undefined) {
        filters.is_used = req.query.is_used === "true";
      }

      const claims = await OfferService.getUserClaimedOffers(userId, filters);

      res.json({
        success: true,
        data: claims,
      });
    } catch (error) {
      console.error("Error fetching user claimed offers:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch claimed offers",
      });
    }
  }

  // Get offer by ID
  static async getOfferById(req, res) {
    try {
      const { offerId } = req.params;
      const offer = await OfferService.getOfferById(offerId);

      res.json({
        success: true,
        data: offer,
      });
    } catch (error) {
      console.error("Error fetching offer:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Offer not found",
      });
    }
  }

  // Update offer
  static async updateOffer(req, res) {
    try {
      const { offerId } = req.params;
      const updateData = req.body;

      const offer = await OfferService.updateOffer(offerId, updateData);

      res.json({
        success: true,
        message: "Offer updated successfully",
        data: offer,
      });
    } catch (error) {
      console.error("❌ Error updating offer:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update offer",
      });
    }
  }

  // Delete offer (soft delete)
  static async deleteOffer(req, res) {
    try {
      const { offerId } = req.params;

      const offer = await OfferService.deleteOffer(offerId);

      res.json({
        success: true,
        message: "Offer deleted successfully",
        data: offer,
      });
    } catch (error) {
      console.error("❌ Error deleting offer:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete offer",
      });
    }
  }

  // Validate coupon code
  static async validateCouponCode(req, res) {
    try {
      const { couponCode } = req.params;
      const { userId } = req.query;

      const result = await OfferService.validateCouponCode(couponCode, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error validating coupon code:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Invalid coupon code",
      });
    }
  }

  // Validate coupon code for cart (brand-specific validation)
  static async validateCouponForCart(req, res) {
    try {
      const { couponCode } = req.params;
      const { userId, cartItems } = req.body;

      if (!cartItems || !Array.isArray(cartItems)) {
        return res.status(400).json({
          success: false,
          message: "Cart items are required",
        });
      }

      const result = await OfferService.validateCouponForCart(
        couponCode,
        cartItems,
        userId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error validating coupon for cart:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Invalid coupon code",
      });
    }
  }

  // Use offer (mark as used)
  static async useOffer(req, res) {
    try {
      const { claimId } = req.params;
      const orderData = req.body;

      const claim = await OfferService.useOffer(claimId, orderData);

      res.json({
        success: true,
        message: "Offer used successfully",
        data: claim,
      });
    } catch (error) {
      console.error("Error using offer:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to use offer",
      });
    }
  }
}

module.exports = OfferController;
