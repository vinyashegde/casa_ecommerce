const mongoose = require("mongoose");

const userPreferencesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    action: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Additional metadata for analytics
    session_id: {
      type: String,
      trim: true,
    },
    device_info: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Compound index to ensure one preference per user-product combination
userPreferencesSchema.index({ user: 1, product: 1 }, { unique: true });

// Index for analytics queries
userPreferencesSchema.index({ action: 1, timestamp: 1 });
userPreferencesSchema.index({ product: 1, action: 1 });

const UserPreferences =
  mongoose.models.UserPreferences ||
  mongoose.model("UserPreferences", userPreferencesSchema);

module.exports = UserPreferences;
