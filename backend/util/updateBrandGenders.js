const mongoose = require("mongoose");
const Brand = require("../models/brand");

// MongoDB connection
mongoose.connect(
  "mongodb+srv://jaylulia20:cb28jfBC719EiUGt@cluster0.akrbkak.mongodb.net/casa_app?retryWrites=true&w=majority&appName=Cluster0"
);

async function updateBrandGenders() {
  try {
    // Get all brands
    const brands = await Brand.find({});

    for (const brand of brands) {
      let gender = "ALL"; // default

      // Assign gender based on brand name
      if (
        brand.name.toLowerCase().includes("lady") ||
        brand.name.toLowerCase().includes("diamond")
      ) {
        gender = "Female";
      } else if (
        brand.name.toLowerCase().includes("bear") ||
        brand.name.toLowerCase().includes("koala")
      ) {
        gender = "Male";
      } else {
        // Randomly assign gender for other brands
        gender = Math.random() > 0.5 ? "Male" : "Female";
      }

      // Update the brand with gender
      await Brand.findByIdAndUpdate(brand._id, { gender: gender });
    }
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error updating brand genders:", err);
    mongoose.disconnect();
  }
}

updateBrandGenders();
