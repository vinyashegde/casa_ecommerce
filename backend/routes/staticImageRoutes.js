const express = require("express");
const router = express.Router();
const {
  getAllImages,
  getImageById,
  createImage,
  updateImage,
  deleteImage,
  toggleImageStatus,
  getImagesByCategory,
  getImageStats,
  generateStaticJson,
  getImagesFromStaticJson,
  getImagesByTag,
  getCurrentImagesByTag,
  getImagesByCampaign,
  getSeasonalImages,
  clearImageCache,
} = require("../controllers/staticImageController");

// Middleware to verify admin authentication
const { verifyToken } = require("../util/verifyToken");

// Apply admin authentication to all routes
router.use(verifyToken);

// Get all static images with filtering and pagination
router.get("/", getAllImages);

// Get image statistics
router.get("/stats", getImageStats);

// Generate static images JSON file
router.post("/generate-json", generateStaticJson);

// Get images from static JSON (optimized endpoint)
router.get("/static", getImagesFromStaticJson);

// Get images by category
router.get("/category/:category", getImagesByCategory);

// Get single static image by ID
router.get("/:id", getImageById);

// Create new static image
router.post("/", createImage);

// Update static image
router.put("/:id", updateImage);

// Toggle image active status
router.patch("/:id/toggle", toggleImageStatus);

// Delete static image
router.delete("/:id", deleteImage);

// Clear image cache (admin only)
router.post("/clear-cache", clearImageCache);

module.exports = router;
