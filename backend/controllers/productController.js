const Product = require("../models/product");
const Category = require("../models/category");
const Brand = require("../models/brand");
const mongoose = require("mongoose");
const InventoryService = require("../services/inventoryService");

// GET all products with pagination support and exclusion
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const excludeParam = req.query.exclude;
    let excludeIds = [];

    if (excludeParam) {
      excludeIds = excludeParam
        .split(",")
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
    }

    // Build query with additional filters
    const query = {
      is_active: true,
      ...(excludeIds.length > 0 && { _id: { $nin: excludeIds } }),
    };

    // Add price filters if provided
    if (req.query.minPrice) {
      query.price = { $gte: parseInt(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      if (query.price) {
        query.price.$lte = parseInt(req.query.maxPrice);
      } else {
        query.price = { $lte: parseInt(req.query.maxPrice) };
      }
    }

    // Add gender filter if provided
    if (req.query.gender) {
      query.gender = req.query.gender;
    }

    let productsQuery = Product.find(query)
      .populate("brand", "name")
      .populate("category", "name")
      .populate({
        path: "assigned_coupon",
        select:
          "title coupon_code discount_type discount_value max_discount_amount min_order_value is_active start_date end_date usage_limit usage_count",
      })
      .sort({ created_at: -1 });

    if (excludeIds.length === 0) {
      productsQuery = productsQuery.skip(skip).limit(limit);
    } else {
      productsQuery = productsQuery.limit(limit); // Skip removed for swipe-mode
    }

    const products = await productsQuery;

    if (products.length === 0) {
      // Let's also check what products exist in the database
      const totalProducts = await Product.countDocuments({});
      const productsWithPrice = await Product.countDocuments({
        price: { $exists: true },
      });
      const productsWithGender = await Product.countDocuments({
        gender: { $exists: true },
      });
    }

    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET product by ID
const getProductById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(id)
      .populate("brand category")
      .populate({
        path: "assigned_coupon",
        select:
          "title coupon_code discount_type discount_value max_discount_amount min_order_value is_active start_date end_date usage_limit usage_count",
      });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET products by category (using category field) or subcategory
const getProductByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    console.log("category: ", category);
    if (!category) {
      return res.status(400).json({ error: "Category parameter is required" });
    }

    let query;

    if (mongoose.Types.ObjectId.isValid(category)) {
      // If category is a valid ObjectId, check if it's a parent category or subcategory
      const categoryDoc = await Category.findById(category);

      if (!categoryDoc) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Check if this is a parent category (no parentCategory) or subcategory (has parentCategory)
      if (categoryDoc.parentCategory) {
        // This is a subcategory - search in subcategory field
        query = { subcategory: category };
      } else {
        // This is a parent category - search in category array field
        query = { category: category };
      }
    } else {
      // If category is a string, find the category by name first
      const categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Check if this is a parent category or subcategory
      if (categoryDoc.parentCategory) {
        // This is a subcategory - search in subcategory field
        query = { subcategory: categoryDoc._id };
      } else {
        // This is a parent category - search in category array field
        query = { category: categoryDoc._id };
      }
    }

    console.log("query", query);

    const products = await Product.find(query)
      .populate("brand", "name logo_url")
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate({
        path: "assigned_coupon",
        select:
          "title coupon_code discount_type discount_value max_discount_amount min_order_value is_active start_date end_date usage_limit usage_count",
      });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET all products by brand ID
const getAllProductsByBrand = async (req, res) => {
  try {
    const brandId = req.params.id;

    if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
      return res
        .status(400)
        .json({ error: "Valid brand ID is required in params" });
    }

    // Build query
    let query = { brand: brandId };

    // Add gender filter if provided
    if (req.query.gender) {
      const genders = req.query.gender.split(",");
      query.gender = { $in: genders };
    }

    const products = await Product.find(query)
      .populate("brand category")
      .populate({
        path: "assigned_coupon",
        select:
          "title coupon_code discount_type discount_value max_discount_amount min_order_value is_active start_date end_date usage_limit usage_count",
      });

    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching brand products:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET products by price range
const getAllProductsByPrice = async (req, res) => {
  const { min, max } = req.query;
  try {
    const products = await Product.find({
      price: {
        $gte: min ? parseFloat(min) : 0,
        $lte: max ? parseFloat(max) : Infinity,
      },
    })
      .populate("brand", "name logo_url")
      .populate("category", "name")
      .populate({
        path: "assigned_coupon",
        select:
          "title coupon_code discount_type discount_value max_discount_amount min_order_value is_active start_date end_date usage_limit usage_count",
      });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET products by gender
const getProductsByGender = async (req, res) => {
  try {
    const { gender, page = 1, limit = 20, exclude } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build query with gender filter
    const query = {
      gender: { $regex: `^${gender}$`, $options: "i" },
      is_active: true,
    };

    // Add exclusion logic for swipe
    if (exclude) {
      const excludeIds = exclude
        .split(",")
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (excludeIds.length > 0) {
        query._id = { $nin: excludeIds };
      }
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .populate("brand", "name logo_url")
      .populate("category", "name")
      .populate({
        path: "assigned_coupon",
        select:
          "title coupon_code discount_type discount_value max_discount_amount min_order_value is_active start_date end_date usage_limit usage_count",
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination info
    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        hasMore: skip + products.length < total,
      },
    });
  } catch (err) {
    console.error("❌ Error in getProductsByGender:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET products by tag
const getProductsByTag = async (req, res) => {
  try {
    const { tag } = req.query;

    if (!tag) {
      return res.status(400).json({ error: "Tag parameter is required" });
    }

    const products = await Product.find({ tags: tag })
      .populate("brand", "name logo_url")
      .populate("category", "name")
      .populate({
        path: "assigned_coupon",
        select:
          "title coupon_code discount_type discount_value max_discount_amount min_order_value is_active start_date end_date usage_limit usage_count",
      });

    res.json(products);
  } catch (err) {
    console.error(`❌ Error fetching products by tag "${req.query.tag}":`, err);
    res.status(500).json({ error: err.message });
  }
};

// SEARCH products by name
const search = async (req, res) => {
  const { query } = req.body;
  try {
    const result = await Product.find({
      name: { $regex: query, $options: "i" },
    })
      .populate("brand", "name logo_url")
      .populate("category", "name")
      .populate({
        path: "assigned_coupon",
        select:
          "title coupon_code discount_type discount_value max_discount_amount min_order_value is_active start_date end_date usage_limit usage_count",
      });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
};

// CREATE product
const createProduct = async (req, res) => {
  try {
    let {
      name,
      description,
      images,
      price,
      currency,
      sizes,
      fits,
      tags,
      stock,
      geo_tags,
      gender,
      brand,
      category,
      subcategory,
      offerPercentage,
      product_variants, // New field for variants
    } = req.body;

    const foundBrand = await Brand.findOne({ name: brand });
    if (!foundBrand) {
      return res.status(400).json({ error: `Brand "${brand}" not found` });
    }
    let foundCategory;
    if (mongoose.Types.ObjectId.isValid(category)) {
      // If category is a valid ObjectId, search by category ID
      foundCategory = await Category.findById(category);
    } else {
      // If category is a string, find the category by name first
      foundCategory = await Category.findOne({ name: category });
    }

    if (!foundCategory) {
      // Debug: Check what categories exist in the database
      const allCategories = await Category.find({}, "_id name").limit(10);

      return res
        .status(400)
        .json({ error: `Category "${category}" not found` });
    }

    // Handle subcategory validation if provided
    let foundSubcategory = null;
    if (subcategory) {
      if (mongoose.Types.ObjectId.isValid(subcategory)) {
        // If subcategory is a valid ObjectId, search by subcategory ID
        foundSubcategory = await Category.findById(subcategory);
      } else {
        // If subcategory is a string, find the subcategory by name first
        foundSubcategory = await Category.findOne({ name: subcategory });
      }

      if (!foundSubcategory) {
        return res
          .status(400)
          .json({ error: `Subcategory "${subcategory}" not found` });
      }
    }

    const newProduct = new Product({
      name,
      description,
      images,
      price,
      currency,
      sizes,
      fits,
      tags,
      stock,
      geo_tags,
      gender: gender ? gender.toLowerCase() : gender,
      brand: foundBrand._id,
      category: [foundCategory._id],
      subcategory: foundSubcategory ? foundSubcategory._id : undefined,
      offerPercentage: offerPercentage || 0,
      assigned_coupon: req.body.assigned_coupon || null,
      product_variants: product_variants || [], // Add variants if provided
    });

    const saved = await newProduct.save();

    // If a coupon is assigned to this product, update the coupon to be product-specific
    if (req.body.assigned_coupon) {
      try {
        const Offer = require("../models/offer");
        await Offer.findByIdAndUpdate(req.body.assigned_coupon, {
          applies_to: "selected_products",
          $addToSet: { selected_products: saved._id },
        });
      } catch (error) {
        console.error(
          "❌ Error updating coupon to be product-specific:",
          error
        );
        // Don't fail the product creation if coupon update fails
      }
    }

    res.status(201).json({ data: saved });
  } catch (err) {
    console.error("❌ Error saving product:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE product by ID
const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE product by ID
const updateProduct = async (req, res) => {
  try {
    // Handle brand lookup (by name)
    const brand = await Brand.findOne({ name: req.body.brand });

    // Handle category lookup (by ID or name)
    let category;
    if (mongoose.Types.ObjectId.isValid(req.body.category)) {
      // If category is a valid ObjectId, search by category ID
      category = await Category.findById(req.body.category);
    } else {
      // If category is a string, find the category by name first
      category = await Category.findOne({ name: req.body.category });
    }

    if (!brand || !category) {
      return res.status(400).json({ message: "Invalid brand or category" });
    }

    // Handle subcategory lookup if provided
    let subcategory = null;
    if (req.body.subcategory) {
      if (mongoose.Types.ObjectId.isValid(req.body.subcategory)) {
        // If subcategory is a valid ObjectId, search by subcategory ID
        subcategory = await Category.findById(req.body.subcategory);
      } else {
        // If subcategory is a string, find the subcategory by name first
        subcategory = await Category.findOne({ name: req.body.subcategory });
      }

      if (!subcategory) {
        return res.status(400).json({ message: "Invalid subcategory" });
      }
    }

    const product = {
      ...req.body,
      brand: brand._id,
      category: [category._id],
      subcategory: subcategory ? subcategory._id : undefined,
      offerPercentage: req.body.offerPercentage || 0,
      assigned_coupon: req.body.assigned_coupon || null,
      product_variants: req.body.product_variants || [], // Add variants if provided
    };

    const updated = await Product.findByIdAndUpdate(req.params.id, product, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Product not found" });

    // Handle coupon assignment changes
    try {
      const Offer = require("../models/offer");

      // Get the old product to check for previous coupon assignment
      const oldProduct = await Product.findById(req.params.id);

      // If there was a previous coupon assigned, remove this product from its selected_products
      if (
        oldProduct &&
        oldProduct.assigned_coupon &&
        oldProduct.assigned_coupon.toString() !== req.body.assigned_coupon
      ) {
        await Offer.findByIdAndUpdate(oldProduct.assigned_coupon, {
          $pull: { selected_products: updated._id },
        });
      }

      // If a new coupon is assigned to this product, update the coupon to be product-specific
      if (req.body.assigned_coupon) {
        await Offer.findByIdAndUpdate(req.body.assigned_coupon, {
          applies_to: "selected_products",
          $addToSet: { selected_products: updated._id },
        });
      }
    } catch (error) {
      console.error("❌ Error updating coupon assignments:", error);
      // Don't fail the product update if coupon update fails
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductSuggestions = async (req, res) => {
  try {
    const { gender } = req.query;

    // Build query with gender filter if provided
    let query = { is_active: true };
    if (gender) {
      query.gender = { $regex: `^${gender}$`, $options: "i" };
    }

    // Get popular product names, categories, and tags for search suggestions
    const products = await Product.find(query)
      .select("name category tags")
      .limit(100);

    const suggestions = new Set();

    // Add product names
    products.forEach((product) => {
      if (product.name) {
        // Split product name into words and add meaningful ones
        const words = product.name.split(" ").filter((word) => word.length > 2);
        words.forEach((word) => suggestions.add(word));
      }
    });

    // Add categories
    products.forEach((product) => {
      if (product.category) {
        suggestions.add(product.category);
      }
    });

    // Add tags
    products.forEach((product) => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag) => suggestions.add(tag));
      }
    });

    // Convert to array and limit to 8 suggestions
    const suggestionsArray = Array.from(suggestions).slice(0, 8);

    res.json(suggestionsArray);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET inventory summary for a brand
const getInventorySummary = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ error: "Valid brand ID is required" });
    }

    const summary = await InventoryService.getInventorySummary(brandId);
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error("❌ Error fetching inventory summary:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE product stock manually
const updateProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, size, operation = "add" } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Valid product ID is required" });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Valid quantity is required" });
    }

    let updatedProduct;

    if (operation === "add") {
      updatedProduct = await InventoryService.addProductStock(
        productId,
        quantity,
        size
      );
    } else if (operation === "reduce") {
      updatedProduct = await InventoryService.reduceProductStock(
        productId,
        quantity,
        size
      );
    } else {
      return res
        .status(400)
        .json({ error: "Operation must be 'add' or 'reduce'" });
    }

    const currentStock = InventoryService.getProductStock(updatedProduct, size);

    res.json({
      success: true,
      message: `Stock ${
        operation === "add" ? "added" : "reduced"
      } successfully`,
      product: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        currentStock: currentStock,
        operation: operation,
        quantity: quantity,
        size: size,
      },
    });
  } catch (err) {
    console.error("❌ Error updating product stock:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET product stock details
const getProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size } = req.query;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Valid product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const stock = InventoryService.getProductStock(product, size);

    res.json({
      success: true,
      data: {
        productId: product._id,
        productName: product.name,
        currentStock: stock,
        size: size || "all",
        hasVariants:
          product.product_variants && product.product_variants.length > 0,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching product stock:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
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
};
