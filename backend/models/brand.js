const mongoose = require("mongoose");

const store = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
  },
  { _id: true }
);

const emergencyContact = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    number: { type: String, required: true },
    working_hours: { type: String, required: true },
  },
  { _id: false }
);

const bankDetails = new mongoose.Schema(
  {
    account_number: { type: String, required: true },
    ifsc_code: { type: String, required: true },
    upi_id: { type: String, required: true },
  },
  { _id: false }
);

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  logo_url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  website: {
    type: String,
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  social_links: {
    type: [String], // array of URLs
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Unisex", "ALL"],
    default: "ALL",
  },
  crm_user_ids: {
    type: [String],
  },
  inventory_sync_status: {
    type: String,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  is_onboarded: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  },
  store_addresses: [store],
  emergency_contact: emergencyContact,
  return_policy: { type: String },
  shipping_policy: { type: String },
  store_policy: { type: String },
  bank_details: bankDetails,
});

module.exports = mongoose.models.Brand || mongoose.model("Brand", brandSchema);
