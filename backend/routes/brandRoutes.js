// backend/routes/brandRoutes.js
const express = require("express");
const router = express.Router();
const {
  getBrandById,
  getBrandByName,
  getAllBrands,
  createBrand,
  deleteBrand,
  updateBrand,
  loginBrand,
  getBrandSales,
  getLatestBrandsByGender,
  getTrendingBrands,
  // Admin functions
  adminLogin,
  getAllBrandsForAdmin,
  deactivateBrand,
  activateBrand,
  // Onboarding functions
  checkOnboardingStatus,
  saveOnboardingData,
  getOnboardingData,
  // Profile functions
  getBrandProfile,
  updateBrandProfile,
} = require("../controllers/brandController");
const { verifyBrandToken } = require("../middleware/brandAuth");

// Public routes (no authentication required)
router.post("/create", createBrand);
router.post("/login", loginBrand);

// GET latest brands by gender
router.get("/latest", getLatestBrandsByGender);

// GET trending brands based on trending products
router.get("/trending", getTrendingBrands);

// GET all brands
router.get("/", getAllBrands);

// GET brand by name
router.get("/name/:name", getBrandByName);

// Profile routes (require authentication) - MUST come before /:id routes
router.get("/profile", verifyBrandToken, getBrandProfile);
router.put("/profile", verifyBrandToken, updateBrandProfile);

// Onboarding routes (require authentication) - MUST come before /:id routes
router.get("/onboarding/status", verifyBrandToken, checkOnboardingStatus);
router.get("/onboarding/data", verifyBrandToken, getOnboardingData);
router.post("/onboarding/save", verifyBrandToken, saveOnboardingData);

// GET brand by ID - MUST come after specific routes like /profile
router.get("/:id", getBrandById);

// Protected routes (require JWT authentication)
router.get("/sales/:id", verifyBrandToken, getBrandSales);

// Update brand by ID (requires authentication)
router.put("/:id", verifyBrandToken, updateBrand);

// Delete brand by ID (requires authentication)
router.delete("/:id", verifyBrandToken, deleteBrand);

// Admin routes
router.post("/admin/login", adminLogin);
router.get("/admin/brands", getAllBrandsForAdmin);
router.put("/admin/brands/:id/deactivate", deactivateBrand);
router.put("/admin/brands/:id/activate", activateBrand);
router.delete("/admin/brands/:id", deleteBrand);

module.exports = router;
