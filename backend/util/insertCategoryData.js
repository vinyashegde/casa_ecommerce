const mongoose = require('mongoose');
const Category = require('../models/category');

// MongoDB connection
mongoose.connect('mongodb+srv://jaylulia20:cb28jfBC719EiUGt@cluster0.akrbkak.mongodb.net/casa_app?retryWrites=true&w=majority&appName=Cluster0');

const womencategoryData = require('./dummy_category_women.json');
const mencategoryData = require('./dummy_category_men.json');

const allCategories = [...womencategoryData, ...mencategoryData];

async function insertCategories() {
  try {
    for (const item of allCategories) {
      const existing = await Category.findOne({ name: item.name });
      if (!existing) {
        await Category.create({
          name: item.name,
          image: item.image
        });
        console.log(`✅ Inserted category: ${item.name}`);
      } else {
        console.log(`⚠️ Category already exists: ${item.name}`);
      }
    }

    console.log('🎉 All category data inserted!');
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error inserting categories:', err);
    mongoose.disconnect();
  }
}

insertCategories();