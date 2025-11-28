const mongoose = require("mongoose");

const staticImageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    // Enhanced metadata for dynamic image management
    tag: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      unique: true, // Each tag should be unique for frontend targeting
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "hero",
        "trends",
        "products",
        "brands",
        "ui",
        "seasonal",
        "campaign",
        "promotion",
      ],
      default: "hero",
    },
    device: {
      type: String,
      required: true,
      enum: ["desktop", "mobile", "tablet", "all"],
      default: "all",
    },
    position: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    // Display period for seasonal/campaign images
    displayPeriod: {
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
    },
    // Priority for ordering multiple images with same tag
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Additional metadata for campaigns/events
    metadata: {
      eventName: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      campaignId: {
        type: String,
        trim: true,
        maxlength: 50,
      },
      targetAudience: {
        type: String,
        enum: ["all", "men", "women", "kids", "premium"],
        default: "all",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
staticImageSchema.index({ category: 1, isActive: 1 });
staticImageSchema.index({ device: 1, isActive: 1 });
staticImageSchema.index({ name: "text", description: "text" });
staticImageSchema.index({ tag: 1, isActive: 1 }); // For frontend image fetching
staticImageSchema.index({
  "displayPeriod.startDate": 1,
  "displayPeriod.endDate": 1,
}); // For seasonal queries
staticImageSchema.index({ priority: -1, tag: 1 }); // For ordered image retrieval
staticImageSchema.index({ "metadata.campaignId": 1 }); // For campaign management

module.exports = mongoose.model("StaticImage", staticImageSchema);
