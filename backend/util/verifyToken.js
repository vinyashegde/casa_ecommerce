const mongoose = require("mongoose");

const verifyToken = (req, res, next) => {
  // 🔓 Skipping real auth for now
  req.user = { id: new mongoose.Types.ObjectId() }; // Generate a valid ObjectId
  next();
};

module.exports = { verifyToken };
