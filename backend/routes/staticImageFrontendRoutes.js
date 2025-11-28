const express = require("express");
const router = express.Router();
const {
  getImagesByTag,
  getCurrentImagesByTag,
  getImagesByCampaign,
  getSeasonalImages,
  getImagesFromStaticJson,
} = require("../controllers/staticImageController");

// Frontend consumption routes (no authentication required)
// Get images by tag
router.get("/tag/:tag", getImagesByTag);

// Get current active image by tag (optimized for frontend)
router.get("/current/:tag", getCurrentImagesByTag);

// Get images by campaign
router.get("/campaign/:campaignId", getImagesByCampaign);

// Get seasonal/event images
router.get("/seasonal/all", getSeasonalImages);

// Get images from static JSON (optimized endpoint for frontend)
router.get("/static", getImagesFromStaticJson);

module.exports = router;

