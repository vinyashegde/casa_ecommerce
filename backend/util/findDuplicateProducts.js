const mongoose = require('mongoose');
const Product = require('../models/product');

//find duplicate products
async function findDuplicateProducts() {
  try {
    await mongoose.connect('mongodb+srv://jaylulia20:cb28jfBC719EiUGt@cluster0.akrbkak.mongodb.net/casa_app?retryWrites=true&w=majority&appName=Cluster0');

    const duplicates = await Product.aggregate([
      {
        $group: {
          _id: { name: "$name", brand: "$brand" },
          count: { $sum: 1 },
          productIds: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productIds',
          foreignField: '_id',
          as: 'duplicateProducts'
        }
      },
      {
        $project: {
          _id: 0,
          duplicateProducts: { name: 1 } // just include names
        }
      }
    ]);

    duplicates.forEach(group => {
      console.log('--- Duplicate Group ---');
      group.duplicateProducts.forEach(product => {
        console.log(product.name);
      });
    });

    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}
//find duplicate and delete duplicate
async function deleteDuplicateProducts() {
  try {
    await mongoose.connect('mongodb+srv://jaylulia20:cb28jfBC719EiUGt@cluster0.akrbkak.mongodb.net/casa_app?retryWrites=true&w=majority&appName=Cluster0');

    const duplicates = await Product.aggregate([
      {
        $group: {
          _id: { name: "$name", brand: "$brand" },
          count: { $sum: 1 },
          ids: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    let totalDeleted = 0;

    for (const group of duplicates) {
      const [keepId, ...deleteIds] = group.ids;
      const result = await Product.deleteMany({ _id: { $in: deleteIds } });
      totalDeleted += result.deletedCount;

      console.log(`🗑️ Deleted ${result.deletedCount} duplicates for "${group._id.name}"`);
    }

    console.log(`✅ Total deleted products: ${totalDeleted}`);
    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}