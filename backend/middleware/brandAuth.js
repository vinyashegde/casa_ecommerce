const jwt = require("jsonwebtoken");
const Brand = require("../models/brand");

// JWT Secret - Should match the one in brandController
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

const verifyBrandToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify the brand still exists and is active
    const brand = await Brand.findById(decoded.brandId);
    if (!brand || !brand.is_active) {
      return res
        .status(401)
        .json({ error: "Invalid token. Brand not found or inactive." });
    }

    // Add brand info to request
    req.brandId = brand._id;
    req.brand = {
      id: brand._id,
      email: brand.email,
      name: brand.name,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired. Please login again." });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }

    res.status(500).json({ error: "Token verification failed." });
  }
};

module.exports = { verifyBrandToken };
