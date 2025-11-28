const {
  generateStaticImagesJson,
} = require("../util/generateStaticImagesJson");
const mongoose = require("mongoose");

// Load environment variables
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/casa";

async function setupStaticImages() {
  try {
    console.log("🚀 Setting up static images optimization...");

    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Generate initial staticImages.json
    console.log("📁 Generating initial staticImages.json...");
    const result = await generateStaticImagesJson();

    console.log("✅ Setup completed successfully!");
    console.log(`📊 Generated ${result.totalImages} images`);
    console.log(`📁 File location: ${result.filePath}`);
    console.log(`📂 Categories: ${result.categories.join(", ")}`);
    console.log(`📱 Devices: ${result.devices.join(", ")}`);

    console.log("\n🎉 Your static images optimization is ready!");
    console.log("💡 Benefits:");
    console.log("   - Faster image loading (served from static JSON)");
    console.log("   - Reduced backend load");
    console.log("   - Automatic updates when images change");
    console.log("   - Fallback to API if JSON is not available");

    console.log("\n📋 Next steps:");
    console.log('   1. Use the "Generate Static JSON" button in CRM');
    console.log("   2. Update your frontend to use optimizedImageService");
    console.log("   3. Test the performance improvement!");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
  }
}

// Run the setup
setupStaticImages();

