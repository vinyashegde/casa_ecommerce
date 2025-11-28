// backend/controllers/brandController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Brand = require("../models/brand");
const Order = require("../models/order");
const mongoose = require("mongoose");

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// GET brand by ID
const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.json(brand);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET brand by name (case-insensitive search)
const getBrandByName = async (req, res) => {
  try {
    const { name } = req.body;
    const brand = await Brand.findOne({ name });

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.json(brand);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// GET all brands
const getAllBrands = async (req, res) => {
  try {
    const { gender, category, page = 1, limit = 12 } = req.query;
    const Product = require("../models/product");

    let brands = [];

    // Filter by gender if specified
    if (gender && gender !== "ALL") {
      if (gender === "MALE") {
        // Get brands that have male or unisex products
        const brandsWithMaleProducts = await Product.find({
          gender: { $in: ["male", "Unisex", "unisex"] },
          is_active: true,
        }).distinct("brand");

        brands = await Brand.find({
          _id: { $in: brandsWithMaleProducts },
          is_active: true,
        }).select("name logo_url gender is_active created_at");
      } else if (gender === "FEMALE") {
        // Get brands that have female or unisex products
        const brandsWithFemaleProducts = await Product.find({
          gender: { $in: ["female", "Unisex", "unisex"] },
          is_active: true,
        }).distinct("brand");

        brands = await Brand.find({
          _id: { $in: brandsWithFemaleProducts },
          is_active: true,
        }).select("name logo_url gender is_active created_at");
      } else if (gender === "UNISEX") {
        // Get brands that have unisex products only
        const brandsWithUnisexProducts = await Product.find({
          gender: { $in: ["Unisex", "unisex"] },
          is_active: true,
        }).distinct("brand");

        brands = await Brand.find({
          _id: { $in: brandsWithUnisexProducts },
          is_active: true,
        }).select("name logo_url gender is_active created_at");
      }
    } else {
      // For 'ALL', get all active brands
      brands = await Brand.find({ is_active: true }).select(
        "name logo_url gender is_active created_at"
      );
    }

    // If category is specified, get brands that have products in that category
    if (category && category !== "Brands") {
      const Category = require("../models/category");

      // Find category ID
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        // Get brands that have products in this category
        const productsInCategory = await Product.find({
          category: categoryDoc._id,
          is_active: true,
        }).distinct("brand");

        // Filter brands to only those with products in the category
        brands = brands.filter((brand) =>
          productsInCategory.some(
            (productBrand) => productBrand.toString() === brand._id.toString()
          )
        );
      }
    }

    // Add product count for each brand
    const brandsWithCounts = await Promise.all(
      brands.map(async (brand) => {
        const productCount = await Product.countDocuments({
          brand: brand._id,
          is_active: true,
        });

        return {
          ...brand.toObject(),
          productCount,
        };
      })
    );

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedBrands = brandsWithCounts.slice(startIndex, endIndex);

    res.json(paginatedBrands);
  } catch (error) {
    console.error("❌ Error fetching brands:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST create a new brand
const createBrand = async (req, res) => {
  try {
    const {
      name,
      logo_url,
      description,
      website,
      domain,
      social_links,
      email,
      password,
      crm_user_ids,
      inventory_sync_status,
      is_active,
      store_addresses,
      emergency_contact,
      bank_details,
      return_policy,
      shipping_policy,
      store_policy,
    } = req.body;

    // Check if domain is missing
    if (!domain) {
      return res.status(400).json({
        message: "Domain field is required",
        receivedData: req.body,
      });
    }

    // Optional: Hash password if you're allowing password creation here
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    // Generate default values for required fields if not provided
    const brandName = name || email.split("@")[0];
    const defaultLogoUrl =
      logo_url ||
      `https://via.placeholder.com/150x150/6366f1/ffffff?text=${encodeURIComponent(
        brandName.charAt(0).toUpperCase()
      )}`;
    // Don't set default values for onboarding fields - let them be empty to trigger onboarding
    const defaultEmergencyContact = emergency_contact || {
      name: "",
      email: email,
      number: "",
      working_hours: "",
    };
    const defaultBankDetails = bank_details || {
      account_number: "",
      ifsc_code: "",
      upi_id: "",
    };

    const brandData = {
      name,
      logo_url: defaultLogoUrl,
      description: description || `Brand created for ${email}`,
      website: website || "",
      domain,
      social_links: social_links || [],
      email,
      password: hashedPassword,
      crm_user_ids: crm_user_ids || [],
      inventory_sync_status: inventory_sync_status || "pending",
      is_active: is_active !== undefined ? is_active : true,
      store_addresses: store_addresses || [],
      emergency_contact: defaultEmergencyContact,
      bank_details: defaultBankDetails,
      return_policy: return_policy || "",
      shipping_policy: shipping_policy || "",
      store_policy: store_policy || "",
      is_onboarded: false, // New brands need onboarding
    };

    // Force domain to be set if it's missing
    if (!brandData.domain) {
      brandData.domain = "default-domain-" + Date.now();
    }

    const brand = new Brand(brandData);

    // Validate the brand before saving
    try {
      await brand.validate();
    } catch (validationError) {
      console.error("❌ Brand validation failed:", validationError.message);
      console.error("❌ Validation errors:", validationError.errors);
      return res.status(400).json({
        message: "Brand validation failed",
        error: validationError.message,
        details: validationError.errors,
      });
    }

    const savedBrand = await brand.save();
    res.status(201).json(savedBrand);
  } catch (error) {
    console.error("❌ Error creating brand:", error);
    console.error("❌ Error details:", error);
    res
      .status(400)
      .json({ message: "Failed to create brand", error: error.message });
  }
};

// DELETE brand by ID
const deleteBrand = async (req, res) => {
  try {
    const deleted = await Brand.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Brand not found" });
    res.json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE brand by ID
const updateBrand = async (req, res) => {
  try {
    const updated = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Brand not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// REGISTER BRAND
const registerBrand = async (req, res) => {
  try {
    const {
      name,
      logo_url,
      description,
      website,
      social_links,
      email,
      password,
    } = req.body;

    const existing = await Brand.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newBrand = new Brand({
      name,
      logo_url,
      description,
      website,
      social_links,
      email,
      password: hashedPassword,
    });

    await newBrand.save();

    res
      .status(201)
      .json({ message: "Brand registered successfully", brand: newBrand });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.name) {
      return res.status(400).json({ error: "Brand name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

const loginBrand = async (req, res) => {
  try {
    const { email, password } = req.body;

    const brand = await Brand.findOne({ email });
    if (!brand) return res.status(404).json({ error: "Brand not found" });

    const isMatch = await bcrypt.compare(password, brand.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      {
        brandId: brand._id,
        email: brand.email,
        type: "brand",
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remove password from response
    const brandData = brand.toObject();
    delete brandData.password;

    res.status(200).json({
      success: true,
      brand: brandData,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBrandSales = async (req, res) => {
  const brandId = req.params.id;

  try {
    const sales = await Order.aggregate([
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $match: {
          "productDetails.brand": new mongoose.Types.ObjectId(brandId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 0,
          product_name: "$productDetails.name",
          quantity: "$products.quantity",
          size: "$products.size",
          order_date: "$createdAt",
          delivery_status: "$deliveryStatus",
          payment_status: "$paymentStatus",
          order_id: "$_id",
          user: {
            email: "$userDetails.email",
            phone: "$userDetails.phone",
            display_name: "$userDetails.display_name",
          },
        },
      },
      { $sort: { order_date: -1 } },
    ]);

    res.status(200).json({ success: true, data: sales });
  } catch (error) {
    console.error("Error fetching brand sales:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getLatestBrandsByGender = async (req, res) => {
  try {
    const { limit = 4 } = req.query;

    // Get latest brands by creation date, limited to specified count (no gender filter)
    const brands = await Brand.find({ is_active: true })
      .select("name logo_url gender is_active created_at")
      .sort({ created_at: -1 })
      .limit(parseInt(limit));

    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get trending brands based on trending products
const getTrendingBrands = async (req, res) => {
  try {
    const { gender, limit = 4, timeWindow = "7d" } = req.query;

    // Calculate time window
    const now = new Date();
    let startDate;

    switch (timeWindow) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get trending products first
    const UserPreferences = require("../models/userPreferences");
    const Product = require("../models/product");

    // Aggregate preferences to calculate engagement scores
    const trendingProducts = await UserPreferences.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$product",
          likes: {
            $sum: { $cond: [{ $eq: ["$action", "like"] }, 1, 0] },
          },
          dislikes: {
            $sum: { $cond: [{ $eq: ["$action", "dislike"] }, 1, 0] },
          },
          totalSwipes: { $sum: 1 },
        },
      },
      {
        $addFields: {
          engagementScore: { $subtract: ["$likes", "$dislikes"] },
          engagementRate: {
            $cond: [
              { $gt: ["$totalSwipes", 0] },
              {
                $divide: [
                  { $subtract: ["$likes", "$dislikes"] },
                  "$totalSwipes",
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: {
          engagementScore: -1,
          engagementRate: -1,
          totalSwipes: -1,
        },
      },
      {
        $limit: 50, // Get more products to ensure we have enough brands
      },
    ]);

    // Get product details for trending products
    const productIds = trendingProducts.map((item) => item._id);

    // Handle gender filtering
    let genderFilter = {};
    if (gender) {
      if (gender === "male" || gender === "M") {
        genderFilter = {
          gender: {
            $in: ["male", "Male", "M", "m", "unisex", "Unisex", "Uni", "uni"],
          },
        };
      } else if (gender === "female" || gender === "W") {
        genderFilter = {
          gender: {
            $in: [
              "female",
              "Female",
              "F",
              "f",
              "W",
              "w",
              "unisex",
              "Unisex",
              "Uni",
              "uni",
            ],
          },
        };
      }
    }

    const products = await Product.find({
      _id: { $in: productIds },
      is_active: true,
      ...genderFilter,
    }).populate("brand", "name logo_url gender is_active created_at");

    // Extract brands from trending products and calculate brand scores
    const brandScores = {};
    products.forEach((product) => {
      if (product.brand && product.brand.is_active) {
        const brandId = product.brand._id.toString();
        if (!brandScores[brandId]) {
          brandScores[brandId] = {
            brand: product.brand,
            totalScore: 0,
            productCount: 0,
          };
        }

        // Find the analytics data for this product
        const analytics = trendingProducts.find(
          (item) => item._id.toString() === product._id.toString()
        );

        if (analytics) {
          brandScores[brandId].totalScore += analytics.engagementScore;
          brandScores[brandId].productCount += 1;
        }
      }
    });

    // Convert to array and sort by score
    const trendingBrands = Object.values(brandScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, parseInt(limit))
      .map((item) => item.brand);

    res.status(200).json({
      success: true,
      data: trendingBrands,
      count: trendingBrands.length,
    });
  } catch (error) {
    console.error("Error getting trending brands:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ADMIN FUNCTIONS
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple admin credentials check - in production, use proper admin table
    const adminCredentials = {
      email: "admin@casa.com",
      password: "admin123", // In production, hash this password
    };

    if (
      email === adminCredentials.email &&
      password === adminCredentials.password
    ) {
      // Generate JWT token for admin
      const token = jwt.sign(
        {
          adminId: "admin-1",
          email: adminCredentials.email,
          role: "admin",
        },
        JWT_SECRET,
        { expiresIn: "24h" } // Admin token lasts 24 hours
      );

      res.status(200).json({
        success: true,
        admin: {
          id: "admin-1",
          email: adminCredentials.email,
          role: "admin",
        },
        token: token,
      });
    } else {
      res.status(401).json({ error: "Invalid admin credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllBrandsForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "joining_date",
      order = "desc",
      status = "all",
      // New granular filters
      name: nameFilter,
      location: locationFilter,
      email: emailFilter,
      brandId: brandIdFilter,
      onboardingDate: onboardingDateRange,
      onboardingDateStart,
      onboardingDateEnd,
    } = req.query;

    console.log("🔍 Admin brands request:", {
      page,
      limit,
      search,
      sortBy,
      order,
      status,
    });

    // Build search and filter query (match stage)
    let searchQuery = {};
    const andConditions = [];

    // Text search across common fields
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { website: { $regex: search, $options: "i" } },
          { "emergency_contact.name": { $regex: search, $options: "i" } },
          { "emergency_contact.email": { $regex: search, $options: "i" } },
          { "store_addresses.city": { $regex: search, $options: "i" } },
          { "store_addresses.state": { $regex: search, $options: "i" } },
          { "store_addresses.country": { $regex: search, $options: "i" } },
        ],
      });
    }

    // Specific filters
    if (nameFilter) {
      andConditions.push({ name: { $regex: nameFilter, $options: "i" } });
    }

    if (emailFilter) {
      andConditions.push({
        $or: [
          { email: { $regex: emailFilter, $options: "i" } },
          { "emergency_contact.email": { $regex: emailFilter, $options: "i" } },
        ],
      });
    }

    if (locationFilter) {
      andConditions.push({
        $or: [
          { "store_addresses.city": { $regex: locationFilter, $options: "i" } },
          { "store_addresses.state": { $regex: locationFilter, $options: "i" } },
          { "store_addresses.country": { $regex: locationFilter, $options: "i" } },
        ],
      });
    }

    if (brandIdFilter) {
      // Support partial match on ObjectId string
      andConditions.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: brandIdFilter,
            options: "i",
          },
        },
      });
    }

    // Onboarding/Joined date range on created_at
    let startDate = null;
    let endDate = null;
    if (onboardingDateStart || onboardingDateEnd) {
      startDate = onboardingDateStart ? new Date(onboardingDateStart) : null;
      // include full end day
      endDate = onboardingDateEnd ? new Date(onboardingDateEnd) : null;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (onboardingDateRange) {
      // support comma-separated range: YYYY-MM-DD,YYYY-MM-DD
      const parts = String(onboardingDateRange).split(",");
      if (parts[0]) startDate = new Date(parts[0]);
      if (parts[1]) {
        endDate = new Date(parts[1]);
        endDate.setHours(23, 59, 59, 999);
      }
    }
    if (startDate || endDate) {
      const createdAtRange = {};
      if (startDate) createdAtRange.$gte = startDate;
      if (endDate) createdAtRange.$lte = endDate;
      andConditions.push({ created_at: createdAtRange });
    }

    // Add status filter
    if (status && status !== "all") {
      andConditions.push({ is_active: status === "active" });
      console.log(
        "✅ Status filter applied:",
        status,
        "-> is_active:",
        status === "active"
      );
    }

    if (andConditions.length > 0) {
      searchQuery = { $and: andConditions };
    }

    const Product = require("../models/product");
    const Order = require("../models/order");

    // Use aggregation pipeline for better performance and sorting
    const pipeline = [
      // Match brands based on search criteria
      { $match: searchQuery },

      // Lookup products for each brand
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "brand",
          as: "products",
          pipeline: [{ $match: { is_active: true } }],
        },
      },

      // Add product count field
      {
        $addFields: {
          productCount: { $size: "$products" },
        },
      },

      // Lookup orders to compute total orders for the brand
      {
        $lookup: {
          from: "orders",
          let: { brandId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$brandId", "$$brandId"] },
              },
            },
          ],
          as: "orders",
        },
      },
      {
        $addFields: {
          totalOrders: { $size: "$orders" },
          contactPerson: "$emergency_contact.name",
          contactEmail: "$emergency_contact.email",
          joinedDate: "$created_at",
          policies: {
            $ifNull: [
              "$return_policy",
              {
                $ifNull: [
                  "$shipping_policy",
                  { $ifNull: ["$store_policy", ""] },
                ],
              },
            ],
          },
          // Build a simple location string from first store address
          location: {
            $let: {
              vars: { addr: { $arrayElemAt: ["$store_addresses", 0] } },
              in: {
                $trim: {
                  input: {
                    $replaceAll: {
                      input: {
                        $concat: [
                          { $ifNull: ["$$addr.city", ""] },
                          ", ",
                          { $ifNull: ["$$addr.state", ""] },
                          ", ",
                          { $ifNull: ["$$addr.country", ""] },
                        ],
                      },
                      find: ", , ",
                      replacement: "",
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Remove products array to keep response clean
      {
        $project: {
          products: 0,
          orders: 0,
          password: 0,
        },
      },
    ];

    // Apply sorting
    let sortField = {};
    if (sortBy === "product_count") {
      sortField.productCount = order === "asc" ? 1 : -1;
    } else if (sortBy === "joining_date") {
      sortField.created_at = order === "asc" ? 1 : -1;
    } else {
      // Default sort by joining date desc
      sortField.created_at = -1;
    }

    pipeline.push({ $sort: sortField });

    console.log("🔄 Sort applied:", sortField);

    // Get total count for pagination (before pagination)
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Brand.aggregate(countPipeline);
    const totalBrands = countResult.length > 0 ? countResult[0].total : 0;

    console.log("📊 Total brands found:", totalBrands);

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    pipeline.push({ $skip: skip }, { $limit: limitNum });

    console.log("📄 Pagination:", { page: pageNum, limit: limitNum, skip });

    // Execute aggregation
    const brands = await Brand.aggregate(pipeline);

    console.log("✅ Brands returned:", brands.length);

    // Map to extended response shape without breaking existing consumers
    const responseBrands = brands.map((b) => ({
      ...b,
      // Additional aliasing to match requested API example
      brandId: b._id, // expose as brandId (stringified by JSON)
      brandName: b.name,
      email: b.email,
      contactPerson: b.contactPerson || (b.emergency_contact?.name ?? undefined),
      contactEmail: b.contactEmail || (b.emergency_contact?.email ?? undefined),
      status: b.is_active ? "Active" : "Inactive",
      joinedDate: b.joinedDate,
      totalOrders: b.totalOrders ?? 0,
      policies: b.policies || "",
      location: b.location || "",
    }));

    res.json({
      brands: responseBrands,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalBrands / limitNum),
        totalBrands,
        hasNext: pageNum < Math.ceil(totalBrands / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching brands for admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deactivateBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Brand.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.json({
      message: "Brand deactivated successfully",
      brand: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const activateBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Brand.findByIdAndUpdate(
      id,
      { is_active: true },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.json({
      message: "Brand activated successfully",
      brand: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ONBOARDING FUNCTIONS

// Check if brand needs onboarding
const checkOnboardingStatus = async (req, res) => {
  try {
    const brandId = req.brandId; // From JWT token

    const brand = await Brand.findById(brandId).select(
      "is_onboarded store_addresses emergency_contact bank_details return_policy shipping_policy store_policy"
    );

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Check if all mandatory fields are filled
    const hasStoreAddresses =
      brand.store_addresses && brand.store_addresses.length > 0;
    const hasEmergencyContact =
      brand.emergency_contact &&
      brand.emergency_contact.name &&
      brand.emergency_contact.email &&
      brand.emergency_contact.number &&
      brand.emergency_contact.working_hours;
    const hasBankDetails =
      brand.bank_details &&
      brand.bank_details.account_number &&
      brand.bank_details.ifsc_code &&
      brand.bank_details.upi_id;
    const hasPolicies =
      brand.return_policy && brand.shipping_policy && brand.store_policy;

    const isComplete =
      hasStoreAddresses && hasEmergencyContact && hasBankDetails && hasPolicies;

    res.json({
      is_onboarded: brand.is_onboarded,
      is_complete: isComplete,
      missing_fields: {
        store_addresses: !hasStoreAddresses,
        emergency_contact: !hasEmergencyContact,
        bank_details: !hasBankDetails,
        policies: !hasPolicies,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Save onboarding data (draft or complete)
const saveOnboardingData = async (req, res) => {
  try {
    const brandId = req.brandId; // From JWT token
    const {
      store_addresses,
      emergency_contact,
      bank_details,
      return_policy,
      shipping_policy,
      store_policy,
      is_draft = false,
    } = req.body;

    const updateData = {
      updated_at: new Date(),
    };

    // Only update provided fields
    if (store_addresses !== undefined)
      updateData.store_addresses = store_addresses;
    if (emergency_contact !== undefined)
      updateData.emergency_contact = emergency_contact;
    if (bank_details !== undefined) updateData.bank_details = bank_details;
    if (return_policy !== undefined) updateData.return_policy = return_policy;
    if (shipping_policy !== undefined)
      updateData.shipping_policy = shipping_policy;
    if (store_policy !== undefined) updateData.store_policy = store_policy;

    // If not a draft, validate all required fields
    if (!is_draft) {
      const validationErrors = [];

      if (!store_addresses || store_addresses.length === 0) {
        validationErrors.push("At least one store address is required");
      }

      if (
        !emergency_contact ||
        !emergency_contact.name ||
        !emergency_contact.email ||
        !emergency_contact.number ||
        !emergency_contact.working_hours
      ) {
        validationErrors.push(
          "Complete emergency contact information is required"
        );
      }

      if (
        !bank_details ||
        !bank_details.account_number ||
        !bank_details.ifsc_code ||
        !bank_details.upi_id
      ) {
        validationErrors.push("Complete bank details are required");
      }

      if (!return_policy || !shipping_policy || !store_policy) {
        validationErrors.push(
          "All policies (return, shipping, store) are required"
        );
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      // Mark as onboarded if all validations pass
      updateData.is_onboarded = true;
    }

    const updatedBrand = await Brand.findByIdAndUpdate(brandId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Remove password from response
    const brandData = updatedBrand.toObject();
    delete brandData.password;

    res.json({
      message: is_draft
        ? "Draft saved successfully"
        : "Onboarding completed successfully",
      brand: brandData,
      is_onboarded: updatedBrand.is_onboarded,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get onboarding data
const getOnboardingData = async (req, res) => {
  try {
    const brandId = req.brandId; // From JWT token

    const brand = await Brand.findById(brandId).select(
      "store_addresses emergency_contact bank_details return_policy shipping_policy store_policy is_onboarded"
    );

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.json({
      store_addresses: brand.store_addresses || [],
      emergency_contact: brand.emergency_contact || {},
      bank_details: brand.bank_details || {},
      return_policy: brand.return_policy || "",
      shipping_policy: brand.shipping_policy || "",
      store_policy: brand.store_policy || "",
      is_onboarded: brand.is_onboarded,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PROFILE FUNCTIONS

// Get brand profile data
const getBrandProfile = async (req, res) => {
  try {
    const brandId = req.brandId; // From JWT token

    if (!brandId) {
      return res.status(401).json({ message: "Brand ID not found in request" });
    }

    const brand = await Brand.findById(brandId).select("-password");

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.json(brand);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update brand profile
const updateBrandProfile = async (req, res) => {
  try {
    const brandId = req.brandId; // From JWT token
    const updateData = {
      ...req.body,
      updated_at: new Date(),
    };

    // Validate required fields
    const validationErrors = [];

    if (updateData.name && !updateData.name.trim()) {
      validationErrors.push("Brand name is required");
    }

    if (updateData.logo_url && !updateData.logo_url.trim()) {
      validationErrors.push("Logo URL is required");
    }

    if (updateData.domain && !updateData.domain.trim()) {
      validationErrors.push("Domain is required");
    }

    if (updateData.email && !updateData.email.trim()) {
      validationErrors.push("Email is required");
    }

    if (updateData.store_addresses && updateData.store_addresses.length === 0) {
      validationErrors.push("At least one store address is required");
    }

    if (updateData.emergency_contact) {
      const { name, email, number, working_hours } =
        updateData.emergency_contact;
      if (!name || !email || !number || !working_hours) {
        validationErrors.push(
          "Complete emergency contact information is required"
        );
      }
    }

    if (updateData.bank_details) {
      const { account_number, ifsc_code, upi_id } = updateData.bank_details;
      if (!account_number || !ifsc_code || !upi_id) {
        validationErrors.push("Complete bank details are required");
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const updatedBrand = await Brand.findByIdAndUpdate(brandId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Remove password from response
    const brandData = updatedBrand.toObject();
    delete brandData.password;

    res.json({
      message: "Profile updated successfully",
      brand: brandData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getBrandById,
  getBrandByName,
  getAllBrands,
  getBrandSales,
  createBrand,
  deleteBrand,
  updateBrand,
  registerBrand,
  loginBrand,
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
};
