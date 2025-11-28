const Category = require("../models/category");

// @desc    Get all categories
// @route   GET /api/categories

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "products", // collection name of Product
          localField: "_id", // match category._id
          foreignField: "category", // inside Product.category array
          as: "products",
        },
      },
      {
        $addFields: {
          productCount: { $size: "$products" },
        },
      },
      {
        $match: { productCount: { $gt: 0 } }, // exclude categories with 0 products
      },
      {
        $sort: { productCount: -1 }, // sort by number of products (desc)
      },
      {
        $project: {
          products: 0, // don’t return all product docs
        },
      },
    ]);

    // ✅ Deduplicate by name (case-insensitive)
    const uniqueCategories = [];
    const seenNames = new Set();

    categories.forEach((cat) => {
      const lowerName = cat.name.toLowerCase();
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        uniqueCategories.push(cat);
      }
    });

    res.json(uniqueCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// @desc    Get Main Categories (parentCategory == null)
// @route   GET /api/categories/main
exports.getMainCategories = async (req, res) => {
  try {
    const mainCategories = await Category.find({ parentCategory: null });
    res.json(mainCategories);
  } catch (error) {
    console.error("Error fetching main categories:", error);
    res.status(500).json({
      message: "Error fetching main categories",
      error: error.message,
    });
  }
};

// @desc    Get Subcategories of a Parent Category
// @route   GET /api/categories/:parentId/subcategories
exports.getSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { gender } = req.query;
    const Product = require("../models/product");

    let subcategories = await Category.find({ parentCategory: parentId });

    // If gender filter is specified, filter subcategories that have products with that gender
    if (gender && gender !== "ALL") {
      const filteredSubcategories = [];

      for (const subcategory of subcategories) {
        let genderQuery = {};
        if (gender === "MALE") {
          genderQuery = { gender: { $in: ["male", "Unisex", "unisex"] } };
        } else if (gender === "FEMALE") {
          genderQuery = { gender: { $in: ["female", "Unisex", "unisex"] } };
        } else if (gender === "UNISEX") {
          genderQuery = { gender: { $in: ["Unisex", "unisex"] } };
        }

        const productCount = await Product.countDocuments({
          category: subcategory._id,
          is_active: true,
          ...genderQuery,
        });

        if (productCount > 0) {
          filteredSubcategories.push({
            ...subcategory.toObject(),
            productCount,
          });
        }
      }

      subcategories = filteredSubcategories;
    }

    res.json(subcategories);
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res
      .status(500)
      .json({ message: "Error fetching subcategories", error: error.message });
  }
};

// @desc    Get Category by ID
// @route   GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    res
      .status(500)
      .json({ message: "Error fetching category", error: error.message });
  }
};

// @desc    Get categories by gender (based on products in those categories)
// @route   GET /api/categories/gender/:gender
exports.getCategoriesByGender = async (req, res) => {
  try {
    const { gender } = req.params;
    const Product = require("../models/product");

    // Validate gender parameter
    const validGenders = [
      "male",
      "female",
      "unisex",
      "MALE",
      "FEMALE",
      "UNISEX",
    ];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({
        message:
          "Invalid gender parameter. Must be one of: male, female, unisex",
      });
    }

    // Normalize gender for database query
    let genderQuery = {};
    if (gender.toUpperCase() === "MALE") {
      genderQuery = { gender: { $in: ["male", "unisex"] } };
    } else if (gender.toUpperCase() === "FEMALE") {
      genderQuery = { gender: { $in: ["female", "unisex"] } };
    } else if (gender.toUpperCase() === "UNISEX") {
      genderQuery = { gender: { $in: ["unisex"] } };
    }

    // Get all subcategories (categories with parentCategory) that have products with the specified gender
    const categories = await Category.aggregate([
      {
        $match: { parentCategory: { $ne: null } } // Only subcategories
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "subcategory",
          as: "products",
        },
      },
      {
        $addFields: {
          productCount: { $size: "$products" },
          unisexProductCount: {
            $size: {
              $filter: {
                input: "$products",
                cond: {
                  $in: ["$$this.gender", ["unisex"]],
                },
              },
            },
          },
          maleProductCount: {
            $size: {
              $filter: {
                input: "$products",
                cond: { $eq: ["$$this.gender", "male"] },
              },
            },
          },
          femaleProductCount: {
            $size: {
              $filter: {
                input: "$products",
                cond: { $eq: ["$$this.gender", "female"] },
              },
            },
          },
        },
      },
      {
        $match: {
          $and: [
            { productCount: { $gt: 0 } },
            {
              $or: [
                { unisexProductCount: { $gt: 0 } },
                { maleProductCount: { $gt: 0 } },
                { femaleProductCount: { $gt: 0 } },
              ],
            },
          ],
        },
      },
      {
        $project: {
          products: 0,
        },
      },
      {
        $sort: { productCount: -1 },
      },
    ]);

    // Filter categories based on gender requirements
    const filteredCategories = categories.filter((category) => {
      if (gender.toUpperCase() === "MALE") {
        return category.maleProductCount > 0;
      } else if (gender.toUpperCase() === "FEMALE") {
        return category.femaleProductCount > 0;
      } else if (gender.toUpperCase() === "UNISEX") {
        return category.unisexProductCount > 0;
      }
      return true;
    });

    res.json(filteredCategories);
  } catch (error) {
    console.error("Error fetching categories by gender:", error);
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
};

// @desc    Get all categories for admin (including those with 0 products)
// @route   GET /api/categories/admin/all
exports.getAllCategoriesForAdmin = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate("parentCategory", "name")
      .sort({ name: 1 });

    res.json(categories);
  } catch (error) {
    console.error("Error fetching all categories for admin:", error);
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
};

// @desc    Create a new category
// @route   POST /api/categories/admin
exports.createCategory = async (req, res) => {
  try {
    const { name, image, parentCategory } = req.body;

    // Validate required fields
    if (!name || !image) {
      return res.status(400).json({
        message: "Name and image are required",
      });
    }

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      parentCategory: parentCategory || null,
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "Category with this name already exists at this level",
      });
    }

    const category = new Category({
      name,
      image,
      parentCategory: parentCategory || null,
    });

    const savedCategory = await category.save();
    await savedCategory.populate("parentCategory", "name");

    res.status(201).json({
      message: "Category created successfully",
      category: savedCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res
      .status(500)
      .json({ message: "Error creating category", error: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/admin/:id
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, parentCategory } = req.body;

    // Validate required fields
    if (!name || !image) {
      return res.status(400).json({
        message: "Name and image are required",
      });
    }

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if another category with same name exists at this level
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      parentCategory: parentCategory || null,
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "Another category with this name already exists at this level",
      });
    }

    // Update category
    category.name = name;
    category.image = image;
    category.parentCategory = parentCategory || null;

    const updatedCategory = await category.save();
    await updatedCategory.populate("parentCategory", "name");

    res.json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res
      .status(500)
      .json({ message: "Error updating category", error: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/admin/:id
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if category has subcategories
    const subcategories = await Category.find({ parentCategory: id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete category with subcategories. Please delete subcategories first.",
      });
    }

    // Check if category has products
    const Product = require("../models/product");
    const products = await Product.find({ category: id });
    if (products.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete category with products. Please reassign or delete products first.",
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res
      .status(500)
      .json({ message: "Error deleting category", error: error.message });
  }
};
