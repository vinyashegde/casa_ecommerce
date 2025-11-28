const mongoose = require('mongoose');
require('dotenv').config(); // ✅ Load .env

const User = require('../models/user'); // ✅ Import Mongoose model
const userData = require('./dummy_users.json'); // ✅ Dummy data

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('❌ MONGO_URI not found in .env');
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('🔴 MongoDB connection error:', err);
    process.exit(1);
  });

async function insertUsers() {
  try {
    for (const item of userData) {
      const existing = await User.findOne({ email: item.email });
      if (!existing) {
        await User.create(item);
        console.log(`✅ Inserted user: ${item.email}`);
      } else {
        console.log(`⚠️ User already exists: ${item.email}`);
      }
    }
    console.log('🎉 All users processed!');
  } catch (err) {
    console.error('❌ Error inserting users:', err);
  } finally {
    mongoose.disconnect();
  }
}

async function deleteUsers() {
  try {
    const result = await User.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} users`);
  } catch (err) {
    console.error('❌ Error deleting users:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Uncomment one of these to run:
// insertUsers();
// deleteUsers(); *******DANGER