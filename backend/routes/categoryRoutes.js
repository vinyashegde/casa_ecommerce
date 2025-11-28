const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Get all categories
router.get("/", categoryController.getAllCategories);

// Get main categories (exact match first)
router.get("/main", categoryController.getMainCategories);

// Get subcategories (specific route with parameter)
router.get("/:parentId/subcategories", categoryController.getSubcategories);

// Get categories by gender
router.get("/gender/:gender", categoryController.getCategoriesByGender);

// Admin CRUD operations
router.post("/admin", categoryController.createCategory);
router.put("/admin/:id", categoryController.updateCategory);
router.delete("/admin/:id", categoryController.deleteCategory);
router.get("/admin/all", categoryController.getAllCategoriesForAdmin);

// Get category by ID (generic route last to avoid conflicts)
router.get("/:id", categoryController.getCategoryById);

module.exports = router;
