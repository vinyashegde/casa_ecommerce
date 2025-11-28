const mongoose = require('mongoose');
const Product = require('../models/product');
const Brand = require('../models/brand');
const Category = require('../models/category');

// Replace with your MongoDB connection string
mongoose.connect('mongodb+srv://jaylulia20:cb28jfBC719EiUGt@cluster0.akrbkak.mongodb.net/casa_app?retryWrites=true&w=majority&appName=Cluster0');

const womenData = require('./dummy_products_women.json');
const menData = require('./dummy_products_men.json');
const data = [...womenData, ...menData];

async function insertProducts() {
  try {
    for (const item of data) {
      // Get or create brand
      let brandDoc = await Brand.findOne({ name: item.brand });
      if (!brandDoc) {
        brandDoc = await Brand.create({ name: item.brand });
      }

      // Get existing categories only
      let categoryIds = [];
      if (Array.isArray(item.category)) {
        for (const catName of item.category) {
          let categoryDoc = await Category.findOne({ name: catName });
          if (categoryDoc) {
            categoryIds.push(categoryDoc._id);
          }
        }
      } else if (typeof item.category === 'string') {
        let categoryDoc = await Category.findOne({ name: item.category });
        if (categoryDoc) {
          categoryIds.push(categoryDoc._id);
        }
      }

      // Insert product with references
      const product = new Product({
        ...item,
        brand: brandDoc._id,
        category: categoryIds,
      });

      await product.save();
      console.log(`Inserted: ${item.name}`);
    }

    console.log('✅ All products inserted!');
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error inserting products:', err);
    mongoose.disconnect();
  }
}

insertProducts();
