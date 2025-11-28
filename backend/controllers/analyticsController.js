const mongoose = require("mongoose");
const UserPreferences = require("../models/userPreferences");
const Product = require("../models/product");

// Track user swipe action (like/dislike)
const trackSwipe = async (req, res) => {
  try {
    const { userId, productId, action, sessionId, deviceInfo } = req.body;

    if (!userId || !productId || !action) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, productId, action",
      });
    }

    if (!["like", "dislike"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "like" or "dislike"',
      });
    }

    // Check if user already has a preference for this product
    const existingPreference = await UserPreferences.findOne({
      user: userId,
      product: productId,
    });

    if (existingPreference) {
      // Update existing preference
      existingPreference.action = action;
      existingPreference.timestamp = new Date();
      if (sessionId) existingPreference.session_id = sessionId;
      if (deviceInfo) existingPreference.device_info = deviceInfo;

      await existingPreference.save();
    } else {
      // Create new preference
      await UserPreferences.create({
        user: userId,
        product: productId,
        action,
        session_id: sessionId,
        device_info: deviceInfo,
      });
    }

    res.status(200).json({
      success: true,
      message: `Product ${action}d successfully`,
      data: { userId, productId, action },
    });
  } catch (error) {
    console.error("Error tracking swipe:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get trending products based on engagement score
const getTrendingProducts = async (req, res) => {
  try {
    const { gender, limit = 20, timeWindow = "7d" } = req.query;

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
        $limit: parseInt(limit),
      },
    ]);

    // Get product details for trending products
    const productIds = trendingProducts.map((item) => item._id);

    // Handle gender filtering with case-insensitive matching
    let genderFilter = {};
    if (gender) {
      if (gender === "M") {
        genderFilter = {
          gender: {
            $in: ["Male", "male", "M", "m", "Unisex", "unisex", "Uni", "uni"],
          },
        };
      } else if (gender === "W") {
        genderFilter = {
          gender: {
            $in: [
              "Female",
              "female",
              "F",
              "f",
              "W",
              "w",
              "Unisex",
              "unisex",
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
    })
      .populate("brand", "name")
      .populate("category", "name");

    // Merge product details with analytics data
    const trendingProductsWithDetails = trendingProducts
      .map((analytics) => {
        const product = products.find(
          (p) => p._id.toString() === analytics._id.toString()
        );
        if (product) {
          return {
            ...analytics,
            product: {
              _id: product._id,
              name: product.name,
              description: product.description,
              images: product.images,
              price: product.price,
              currency: product.currency,
              brand: product.brand,
              category: product.category,
              tags: product.tags,
              gender: product.gender,
            },
          };
        }
        return null;
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      data: {
        trendingProducts: trendingProductsWithDetails,
        timeWindow,
        totalProducts: trendingProductsWithDetails.length,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error getting trending products:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get user's swipe history
const getUserSwipeHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const preferences = await UserPreferences.find({ user: userId })
      .populate("product", "name images price currency brand category")
      .populate("product.brand", "name")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await UserPreferences.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: {
        preferences,
        totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error getting user swipe history:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get product analytics summary
const getProductAnalytics = async (req, res) => {
  try {
    const { productId } = req.params;
    const { timeWindow = "7d" } = req.query;

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

    const analytics = await UserPreferences.aggregate([
      {
        $match: {
          product: mongoose.Types.ObjectId(productId),
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
    ]);

    const likes = analytics.find((item) => item._id === "like")?.count || 0;
    const dislikes =
      analytics.find((item) => item._id === "dislike")?.count || 0;
    const totalSwipes = likes + dislikes;
    const engagementScore = likes - dislikes;
    const engagementRate = totalSwipes > 0 ? engagementScore / totalSwipes : 0;

    res.status(200).json({
      success: true,
      data: {
        productId,
        timeWindow,
        likes,
        dislikes,
        totalSwipes,
        engagementScore,
        engagementRate,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error getting product analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get real-time trending products (optimized for immediate updates)
const getRealTimeTrendingProducts = async (req, res) => {
  try {
    const { gender, limit = 20 } = req.query;

    // Get trending products without time window for real-time updates
    const trendingProducts = await UserPreferences.aggregate([
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
        },
      },
      {
        $sort: { engagementScore: -1, totalSwipes: -1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    // Get product details
    const productIds = trendingProducts.map((item) => item._id);

    let genderFilter = {};
    if (gender) {
      if (gender === "M") {
        genderFilter = {
          gender: {
            $in: ["Male", "male", "M", "m", "Unisex", "unisex", "Uni", "uni"],
          },
        };
      } else if (gender === "W") {
        genderFilter = {
          gender: {
            $in: [
              "Female",
              "female",
              "F",
              "f",
              "W",
              "w",
              "Unisex",
              "unisex",
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
    })
      .populate("brand", "name")
      .populate("category", "name");

    const trendingProductsWithDetails = trendingProducts
      .map((analytics) => {
        const product = products.find(
          (p) => p._id.toString() === analytics._id.toString()
        );
        if (product) {
          return {
            ...analytics,
            product: {
              _id: product._id,
              name: product.name,
              description: product.description,
              images: product.images,
              price: product.price,
              currency: product.currency,
              brand: product.brand,
              category: product.category,
              tags: product.tags,
              gender: product.gender,
            },
          };
        }
        return null;
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      data: {
        trendingProducts: trendingProductsWithDetails,
        totalProducts: trendingProductsWithDetails.length,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error getting real-time trending products:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  trackSwipe,
  getTrendingProducts,
  getRealTimeTrendingProducts,
  getUserSwipeHistory,
  getProductAnalytics,
};
