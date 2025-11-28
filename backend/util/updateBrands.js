const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const Brand = require('../models/brand'); // Adjust if needed

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const brands = await Brand.find();

    for (const brand of brands) {
      if (brand.email && brand.password) continue;

      // Assign default email if missing
      if (!brand.email) {
        brand.email = `${brand.name.toLowerCase().replace(/\s+/g, '')}@brand.com`;
      }

      // Assign default password ("123") if missing
      if (!brand.password) {
        const hashedPassword = await bcrypt.hash('123', 10);
        brand.password = hashedPassword;
      }

      await brand.save();
    }
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err);
    mongoose.disconnect();
  }
})();
