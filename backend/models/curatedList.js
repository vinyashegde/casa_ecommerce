const mongoose = require("mongoose");

const curatedListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  name: {
    type: String,
    default: "My Curated List",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CuratedList = mongoose.models.CuratedList || mongoose.model("CuratedList", curatedListSchema);
module.exports = CuratedList;
