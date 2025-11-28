const mongoose = require("mongoose");

// --- Shipment Schema ---
const shipmentSchema = new mongoose.Schema(
  {
    billing_customer_name: { type: String, required: true, trim: true },

    billing_phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^(?:\+91|91)?[6-9]\d{9}$/, "Invalid Indian phone number"],
      set: (value) => {
        if (!value) return value;
        // Remove spaces and hyphens
        let num = value.replace(/[\s-]/g, "");
        // Ensure starts with +91
        if (!num.startsWith("+91")) {
          num = num.replace(/^0+/, ""); // Remove leading 0
          num = "+91" + num.replace(/^91/, "");
        }
        return num;
      },
    },

    billing_email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Invalid email address"],
    },

    billing_address: { type: String, required: true, trim: true }, // Flat/Wing OR Address Line
    billing_address_2: { type: String, default: "", trim: true }, // Landmark (optional)
    billing_city: { type: String, required: true, trim: true },

    billing_pincode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, "Invalid pincode"],
    },

    billing_state: { type: String, required: true, trim: true },
    billing_country: { type: String, default: "India", trim: true },

    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// --- User Schema ---
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true, // Email is now primary identifier
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Invalid email address"],
    },

    phone: {
      type: String,
      required: false, // Phone is optional
      trim: true,
      // Removed unique constraint to allow multiple users without phone numbers
    },

    oauth_provider: {
      type: String,
      enum: ["google", "facebook", "apple", "instagram"],
      default: null,
    },
    oauth_id: { type: String, trim: true },

    display_name: { type: String, trim: true },
    avatar_url: { type: String, trim: true },
    age: { type: Number, min: 0 },
    gender: { type: String, enum: ["male", "female", "other"], default: null },

    social_each_godson: { type: String, trim: true }, // original field preserved

    interests: [{ type: String, trim: true }],
    ml_preferences: [{ type: String, trim: true }],

    is_admin: { type: Boolean, default: false },
    is_brand_user: { type: Boolean, default: false },

    followed_brand_ids: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    ],
    last_login: { type: Date },

    delivery_addresses: [{ type: String, trim: true }],
    payment_methods: [{ type: String, trim: true }],

    shipment: [shipmentSchema],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// --- Indexes for faster searches ---
// Email index is automatically created by unique: true constraint
// Removed phone index since phone is no longer unique

// Pre-save middleware to ensure email is always present and lowercase
userSchema.pre("save", function (next) {
  if (!this.email) {
    return next(new Error("Email is required"));
  }

  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  next();
});

module.exports = mongoose.model("User", userSchema);
