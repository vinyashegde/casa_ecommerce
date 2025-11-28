const StaticImage = require("../models/staticImage");
const {
  generateStaticImagesJson,
  getImagesFromJson,
  isStaticImagesJsonRecent,
} = require("../util/generateStaticImagesJson");

// In-memory cache for frequently accessed images
const imageCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache management functions
const setCache = (key, data) => {
  imageCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

const getCache = (key) => {
  const cached = imageCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  imageCache.delete(key);
  return null;
};

const clearCache = () => {
  imageCache.clear();
};

// Get all static images with filtering and pagination
const getAllImages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      device,
      isActive,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (device && device !== "all") {
      filter.device = device;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Get images with pagination
    const images = await StaticImage.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .lean();

    // Get total count for pagination
    const totalImages = await StaticImage.countDocuments(filter);
    const totalPages = Math.ceil(totalImages / parseInt(limit));

    res.json({
      success: true,
      images,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalImages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching static images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch static images",
      error: error.message,
    });
  }
};

// Get single static image by ID
const getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await StaticImage.findById(id)
      .populate("createdBy", "name email")
      .lean();

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Static image not found",
      });
    }

    res.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error("Error fetching static image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch static image",
      error: error.message,
    });
  }
};

// Create new static image
const createImage = async (req, res) => {
  try {
    const {
      name,
      description,
      url,
      tag,
      altText,
      category,
      device,
      position,
      isActive,
      displayPeriod,
      priority,
      metadata,
    } = req.body;

    // Validate required fields
    if (!name || !url || !category || !tag) {
      return res.status(400).json({
        success: false,
        message: "Name, URL, category, and tag are required",
      });
    }

    // Validate URL format - more flexible pattern
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid image URL",
      });
    }

    // Validate display period if provided
    if (displayPeriod) {
      if (displayPeriod.startDate && displayPeriod.endDate) {
        const startDate = new Date(displayPeriod.startDate);
        const endDate = new Date(displayPeriod.endDate);
        if (startDate >= endDate) {
          return res.status(400).json({
            success: false,
            message: "End date must be after start date",
          });
        }
      }
    }

    // Create new image
    const newImage = new StaticImage({
      name,
      description: description || "",
      url,
      tag,
      altText: altText || "",
      category,
      device: device || "all",
      position: position || "",
      displayPeriod: displayPeriod || { startDate: null, endDate: null },
      priority: priority || 0,
      metadata: metadata || {},
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id,
    });

    await newImage.save();

    // Populate the createdBy field
    await newImage.populate("createdBy", "name email");

    // Clear cache to ensure fresh data
    clearCache();

    // Generate static JSON file after creating image
    try {
      await generateStaticImagesJson();
    } catch (jsonError) {
      console.warn(
        "Warning: Failed to update staticImages.json:",
        jsonError.message
      );
    }

    res.status(201).json({
      success: true,
      message: "Static image created successfully",
      image: newImage,
    });
  } catch (error) {
    console.error("Error creating static image:", error);

    // Handle duplicate tag error
    if (error.code === 11000 && error.keyPattern?.tag) {
      return res.status(400).json({
        success: false,
        message:
          "An image with this tag already exists. Please use a different tag.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create static image",
      error: error.message,
    });
  }
};

// Update static image
const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData.createdAt;

    // Validate URL if provided
    if (updateData.url) {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(updateData.url)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid image URL",
        });
      }
    }

    const image = await StaticImage.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Static image not found",
      });
    }

    // Clear cache to ensure fresh data
    clearCache();

    // Generate static JSON file after updating image
    try {
      await generateStaticImagesJson();
    } catch (jsonError) {
      console.warn(
        "Warning: Failed to update staticImages.json:",
        jsonError.message
      );
    }

    res.json({
      success: true,
      message: "Static image updated successfully",
      image,
    });
  } catch (error) {
    console.error("Error updating static image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update static image",
      error: error.message,
    });
  }
};

// Delete static image
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await StaticImage.findByIdAndDelete(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Static image not found",
      });
    }

    // Clear cache to ensure fresh data
    clearCache();

    // Generate static JSON file after deleting image
    try {
      await generateStaticImagesJson();
    } catch (jsonError) {
      console.warn(
        "Warning: Failed to update staticImages.json:",
        jsonError.message
      );
    }

    res.json({
      success: true,
      message: "Static image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting static image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete static image",
      error: error.message,
    });
  }
};

// Toggle image active status
const toggleImageStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await StaticImage.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Static image not found",
      });
    }

    image.isActive = !image.isActive;
    await image.save();

    // Clear cache to ensure fresh data
    clearCache();

    // Generate static JSON file after toggling status
    try {
      await generateStaticImagesJson();
    } catch (jsonError) {
      console.warn(
        "Warning: Failed to update staticImages.json:",
        jsonError.message
      );
    }

    res.json({
      success: true,
      message: `Image ${
        image.isActive ? "activated" : "deactivated"
      } successfully`,
      image,
    });
  } catch (error) {
    console.error("Error toggling image status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle image status",
      error: error.message,
    });
  }
};

// Get images by category
const getImagesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { device, isActive = true } = req.query;

    const filter = { category, isActive: isActive === "true" };

    if (device && device !== "all") {
      filter.$or = [{ device: device }, { device: "all" }];
    }

    const images = await StaticImage.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .lean();

    res.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("Error fetching images by category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch images by category",
      error: error.message,
    });
  }
};

// Get image statistics
const getImageStats = async (req, res) => {
  try {
    const stats = await StaticImage.aggregate([
      {
        $group: {
          _id: null,
          totalImages: { $sum: 1 },
          activeImages: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          inactiveImages: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
          },
        },
      },
    ]);

    const categoryStats = await StaticImage.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const deviceStats = await StaticImage.aggregate([
      {
        $group: {
          _id: "$device",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalImages: 0,
        activeImages: 0,
        inactiveImages: 0,
      },
      categoryStats,
      deviceStats,
    });
  } catch (error) {
    console.error("Error fetching image statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch image statistics",
      error: error.message,
    });
  }
};

// Generate staticImages.json file
const generateStaticJson = async (req, res) => {
  try {
    const result = await generateStaticImagesJson();

    res.json({
      success: true,
      message: "Static images JSON generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error generating static images JSON:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate static images JSON",
      error: error.message,
    });
  }
};

// Get images from static JSON (optimized endpoint)
const getImagesFromStaticJson = async (req, res) => {
  try {
    const { category, device } = req.query;

    // Check if we should use static JSON or fallback to database
    const useStaticJson = isStaticImagesJsonRecent();

    let images = [];

    if (useStaticJson) {
      // Use static JSON file
      images = getImagesFromJson(category, device);
    } else {
      // Fallback to database query
      const filter = { isActive: true };

      if (category && category !== "all") {
        filter.category = category;
      }

      if (device && device !== "all") {
        filter.$or = [{ device: device }, { device: "all" }];
      }

      images = await StaticImage.find(filter)
        .select(
          "name description url category device position isActive createdAt updatedAt"
        )
        .sort({ category: 1, createdAt: -1 })
        .lean();
    }

    res.json({
      success: true,
      images,
      source: useStaticJson ? "static-json" : "database",
      generatedAt: useStaticJson ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error("Error fetching images from static JSON:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch images from static JSON",
      error: error.message,
    });
  }
};

// Get images by tag (for frontend consumption)
const getImagesByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const { device = "all", includeInactive = false } = req.query;

    // Check cache first
    const cacheKey = `tag:${tag}:${device}:${includeInactive}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        images: cached,
        source: "cache",
      });
    }

    const now = new Date();
    const filter = {
      tag,
      isActive: includeInactive === "true" ? { $in: [true, false] } : true,
      $or: [{ device: device }, { device: "all" }],
    };

    // Add display period filter for active images
    if (includeInactive !== "true") {
      filter.$and = [
        {
          $or: [
            { "displayPeriod.startDate": null },
            { "displayPeriod.startDate": { $lte: now } },
          ],
        },
        {
          $or: [
            { "displayPeriod.endDate": null },
            { "displayPeriod.endDate": { $gte: now } },
          ],
        },
      ];
    }

    const images = await StaticImage.find(filter)
      .select(
        "name description url tag altText category device position priority metadata isActive createdAt updatedAt"
      )
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    // Cache the result
    setCache(cacheKey, images);

    res.json({
      success: true,
      images,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching images by tag:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch images by tag",
      error: error.message,
    });
  }
};

// Get current active images by tag (optimized for frontend)
const getCurrentImagesByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const { device = "all" } = req.query;

    // Check cache first
    const cacheKey = `current:${tag}:${device}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        image: cached,
        source: "cache",
      });
    }

    const now = new Date();
    const image = await StaticImage.findOne({
      tag,
      isActive: true,
      $or: [{ device: device }, { device: "all" }],
      $and: [
        {
          $or: [
            { "displayPeriod.startDate": null },
            { "displayPeriod.startDate": { $lte: now } },
          ],
        },
        {
          $or: [
            { "displayPeriod.endDate": null },
            { "displayPeriod.endDate": { $gte: now } },
          ],
        },
      ],
    })
      .select(
        "name description url tag altText category device position priority metadata isActive createdAt updatedAt"
      )
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    // Cache the result
    setCache(cacheKey, image);

    res.json({
      success: true,
      image,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching current image by tag:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch current image by tag",
      error: error.message,
    });
  }
};

// Get images by campaign/event
const getImagesByCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { device = "all", includeInactive = false } = req.query;

    const filter = {
      "metadata.campaignId": campaignId,
      isActive: includeInactive === "true" ? { $in: [true, false] } : true,
      $or: [{ device: device }, { device: "all" }],
    };

    const images = await StaticImage.find(filter)
      .select(
        "name description url tag altText category device position priority metadata isActive createdAt updatedAt"
      )
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("Error fetching images by campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch images by campaign",
      error: error.message,
    });
  }
};

// Get seasonal/event images (images with display periods)
const getSeasonalImages = async (req, res) => {
  try {
    const { device = "all" } = req.query;
    const now = new Date();

    const images = await StaticImage.find({
      isActive: true,
      $or: [{ device: device }, { device: "all" }],
      $and: [
        { "displayPeriod.startDate": { $ne: null } },
        { "displayPeriod.endDate": { $ne: null } },
        { "displayPeriod.startDate": { $lte: now } },
        { "displayPeriod.endDate": { $gte: now } },
      ],
    })
      .select(
        "name description url tag altText category device position priority metadata displayPeriod isActive createdAt updatedAt"
      )
      .sort({ priority: -1, "displayPeriod.startDate": 1 })
      .lean();

    res.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("Error fetching seasonal images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch seasonal images",
      error: error.message,
    });
  }
};

// Clear image cache (admin endpoint)
const clearImageCache = async (req, res) => {
  try {
    clearCache();
    res.json({
      success: true,
      message: "Image cache cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing image cache:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear image cache",
      error: error.message,
    });
  }
};

module.exports = {
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
};
