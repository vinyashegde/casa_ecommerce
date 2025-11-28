const express = require("express");
const OfferController = require("../controllers/offerController");
const router = express.Router();

// Create a new offer
router.post("/", OfferController.createOffer);

// Get all offers for a brand
router.get("/brand/:brandId", OfferController.getBrandOffers);

// Get all active offers
router.get("/", OfferController.getAllOffers);

// Get offers for a specific product
router.get("/product/:productId", OfferController.getOffersForProduct);

// Get offer by ID
router.get("/:offerId", OfferController.getOfferById);

// Update offer
router.put("/:offerId", OfferController.updateOffer);

// Delete offer (soft delete)
router.delete("/:offerId", OfferController.deleteOffer);

// Claim an offer
router.post("/:offerId/claim", OfferController.claimOffer);

// Get user's claimed offers
router.get("/user/:userId/claims", OfferController.getUserClaimedOffers);

// Validate coupon code
router.get("/coupon/:couponCode/validate", OfferController.validateCouponCode);

// Validate coupon code for cart (brand-specific validation)
router.post(
  "/coupon/:couponCode/validate-cart",
  OfferController.validateCouponForCart
);

// Use offer (mark as used)
router.post("/claims/:claimId/use", OfferController.useOffer);

module.exports = router;
