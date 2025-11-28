const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Completed" },
    razorpayPaymentId: { type: String },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Payout || mongoose.model("Payout", payoutSchema);


