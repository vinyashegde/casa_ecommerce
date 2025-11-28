const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import models
const Brand = require('../models/brand');
const Category = require('../models/category');

// Update brands with gender
const updateBrands = async () => {
  try {
    console.log('🔄 Updating brands with gender...');
    
    const brands = await Brand.find({});
    
    for (const brand of brands) {
      // Set gender based on brand name or default to 'ALL'
      let gender = 'ALL';
      
      if (brand.name.toLowerCase().includes('essentials') || brand.name.toLowerCase().includes('fear of god')) {
        gender = 'Unisex';
      } else if (brand.name.toLowerCase().includes('bluorng') || brand.name.toLowerCase().includes('deadbear')) {
        gender = 'Male';
      } else if (brand.name.toLowerCase().includes('evemen')) {
        gender = 'Female';
      }
      
      await Brand.findByIdAndUpdate(brand._id, { gender });
      console.log(`✅ Updated ${brand.name} with gender: ${gender}`);
    }
    
    console.log('✅ All brands updated successfully');
  } catch (error) {
    console.error('❌ Error updating brands:', error);
  }
};

// Update categories with images
const updateCategories = async () => {
  try {
    console.log('🔄 Updating categories with images...');
    
    const categoryImages = {
      'Shirts': 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=100',
      'Pants': 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=100',
      'T-Shirts': 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
      'Hoodies': 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=100',
      'Shorts': 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
      'Jackets': 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=100'
    };
    
    for (const [categoryName, imageUrl] of Object.entries(categoryImages)) {
      await Category.findOneAndUpdate(
        { name: categoryName },
        { image: imageUrl },
        { upsert: true }
      );
      console.log(`✅ Updated category ${categoryName} with image`);
    }
    
    console.log('✅ All categories updated successfully');
  } catch (error) {
    console.error('❌ Error updating categories:', error);
  }
};

// Run updates
const runUpdates = async () => {
  try {
    await updateBrands();
    await updateCategories();
    console.log('🎉 All updates completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running updates:', error);
    process.exit(1);
  }
};

runUpdates();
