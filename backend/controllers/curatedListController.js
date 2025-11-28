const mongoose = require("mongoose");
const CuratedList = require("../models/curatedList");

// GET all curated lists
const getAllCuratedLists = async (req, res) => {
  try {
    const lists = await CuratedList.find().populate("userId").populate("products");
    res.status(200).json(lists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET a user's curated list
const getUserCuratedList = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const list = await CuratedList.findOne({ userId: new mongoose.Types.ObjectId(userId) }).populate("products");

    if (!list) {
      return res.status(404).json({ message: "Curated list not found" });
    }

    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create a curated list
const createCuratedList = async (req, res) => {
  try {
    const { userId, products = [], name = "My Curated List" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const newList = new CuratedList({
      userId: new mongoose.Types.ObjectId(userId),
      products,
      name
    });

    const savedList = await newList.save();
    res.status(201).json(savedList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT add product to curated list
const addProductToList = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const list = await CuratedList.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        $addToSet: { products: productId },
        $setOnInsert: { name: "My Curated List", createdAt: new Date() }
      },
      { new: true, upsert: true }
    ).populate("products");

    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT remove product from curated list
const removeProductFromList = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const list = await CuratedList.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $pull: { products: productId } },
      { new: true }
    ).populate("products");

    if (!list) {
      return res.status(404).json({ message: "Curated list not found" });
    }

    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE curated list
const deleteCuratedList = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    await CuratedList.findOneAndDelete({ userId: new mongoose.Types.ObjectId(userId) });
    res.status(200).json({ message: "Curated list deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllCuratedLists,
  getUserCuratedList,
  createCuratedList,
  addProductToList,
  removeProductFromList,
  deleteCuratedList,
};
