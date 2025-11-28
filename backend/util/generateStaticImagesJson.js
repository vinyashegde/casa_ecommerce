const fs = require("fs");
const path = require("path");
const StaticImage = require("../models/staticImage");

/**
 * Generate staticImages.json file from database
 * This file will be served statically to reduce backend load
 */
const generateStaticImagesJson = async () => {
  try {
    console.log("🔄 Generating staticImages.json...");

    // Fetch all active images from database
    const images = await StaticImage.find({ isActive: true })
      .select(
        "name description url category device position isActive createdAt updatedAt"
      )
      .sort({ category: 1, createdAt: -1 })
      .lean();

    // Group images by category for better organization
    const imagesByCategory = {
      hero: [],
      trends: [],
      products: [],
      brands: [],
      ui: [],
    };

    // Group images by device for better filtering
    const imagesByDevice = {
      desktop: [],
      mobile: [],
      tablet: [],
      all: [],
    };

    // Process images
    images.forEach((image) => {
      // Add to category groups
      if (imagesByCategory[image.category]) {
        imagesByCategory[image.category].push(image);
      }

      // Add to device groups
      if (image.device === "all") {
        imagesByDevice.desktop.push(image);
        imagesByDevice.mobile.push(image);
        imagesByDevice.tablet.push(image);
        imagesByDevice.all.push(image);
      } else if (imagesByDevice[image.device]) {
        imagesByDevice[image.device].push(image);
        imagesByDevice.all.push(image);
      }
    });

    // Create the JSON structure
    const staticImagesData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalImages: images.length,
        version: "1.0.0",
      },
      images: images,
      imagesByCategory: imagesByCategory,
      imagesByDevice: imagesByDevice,
      categories: Object.keys(imagesByCategory),
      devices: Object.keys(imagesByDevice),
    };

    // Ensure the public directory exists
    const publicDir = path.join(__dirname, "../public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write to public directory for static serving
    const filePath = path.join(publicDir, "staticImages.json");
    fs.writeFileSync(filePath, JSON.stringify(staticImagesData, null, 2));

    // Also write to frontend public directory if it exists
    const frontendPublicDir = path.join(__dirname, "../../frontend/public");
    if (fs.existsSync(frontendPublicDir)) {
      const frontendFilePath = path.join(
        frontendPublicDir,
        "staticImages.json"
      );
      fs.writeFileSync(
        frontendFilePath,
        JSON.stringify(staticImagesData, null, 2)
      );
      console.log("✅ staticImages.json generated in frontend/public/");
    }

    console.log(
      `✅ staticImages.json generated successfully with ${images.length} images`
    );
    console.log(`📁 File location: ${filePath}`);

    return {
      success: true,
      totalImages: images.length,
      filePath: filePath,
      categories: Object.keys(imagesByCategory),
      devices: Object.keys(imagesByDevice),
    };
  } catch (error) {
    console.error("❌ Error generating staticImages.json:", error);
    throw error;
  }
};

/**
 * Get images from static JSON file (fallback method)
 */
const getImagesFromJson = (category = null, device = null) => {
  try {
    const filePath = path.join(__dirname, "../public/staticImages.json");

    if (!fs.existsSync(filePath)) {
      console.warn("⚠️ staticImages.json not found, returning empty array");
      return [];
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    let images = data.images || [];

    // Filter by category if specified
    if (category && category !== "all" && data.imagesByCategory[category]) {
      images = data.imagesByCategory[category];
    }

    // Filter by device if specified
    if (device && device !== "all" && data.imagesByDevice[device]) {
      images = images.filter(
        (img) => img.device === device || img.device === "all"
      );
    }

    return images;
  } catch (error) {
    console.error("❌ Error reading staticImages.json:", error);
    return [];
  }
};

/**
 * Check if staticImages.json exists and is recent (less than 1 hour old)
 */
const isStaticImagesJsonRecent = () => {
  try {
    const filePath = path.join(__dirname, "../public/staticImages.json");

    if (!fs.existsSync(filePath)) {
      return false;
    }

    const stats = fs.statSync(filePath);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return stats.mtime > oneHourAgo;
  } catch (error) {
    console.error("❌ Error checking staticImages.json age:", error);
    return false;
  }
};

module.exports = {
  generateStaticImagesJson,
  getImagesFromJson,
  isStaticImagesJsonRecent,
};
