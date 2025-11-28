const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/order");
const Brand = require("../models/brand");
const Payout = require("../models/payout");
// Compute refund amount that should be deducted from brand payouts
function getPayoutDeductibleRefund(orderDoc) {
  if (!orderDoc) return 0;
  const plat = orderDoc.platformRefundedAmount || 0;
  if (plat > 0) return plat;
  const refunds = orderDoc.refunds || [];
  if (Array.isArray(refunds) && refunds.length) {
    return refunds
      .filter((r) => r && r.initiatedBy === "platform")
      .reduce((sum, r) => sum + (r.amount || 0), 0);
  }
  return orderDoc.refundedAmount || 0; // legacy fallback
}

// Check if Razorpay credentials are available
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("❌ Razorpay credentials not found in environment variables");
  console.error(
    "Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file"
  );
}

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
const createPaymentOrder = async (req, res) => {
  try {
    // Check if Razorpay is properly configured
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        error: "Payment service not configured. Please contact support.",
      });
    }

    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || !receipt) {
      return res.status(400).json({
        success: false,
        error: "Amount and receipt are required",
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be greater than 0",
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
    });
  } catch (error) {
    console.error("Error creating payment order:", error);

    // Handle specific Razorpay errors
    if (error.error) {
      console.error("Razorpay error details:", error.error);
      return res.status(400).json({
        success: false,
        error: error.error.description || "Payment service error",
        code: error.error.code,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create payment order",
    });
  }
};

// Verify payment signature
const verifyPayment = async (req, res) => {
  try {
    // Check if Razorpay is properly configured
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        error: "Payment service not configured. Please contact support.",
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Payment verification parameters are missing",
      });
    }

    // Create the signature string
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    // Generate expected signature
    const expectedSign = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    // Verify signature
    if (razorpay_signature === expectedSign) {
      // Emit event for realtime update (non-breaking)
      try {
        if (global.io) {
          global.io.emit("paymentUpdated", {
            type: "userPaymentSuccess",
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
          });
        }
      } catch (e) {
        console.warn("Failed to emit paymentUpdated:", e);
      }

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment",
    });
  }
};

// Test Razorpay configuration
const testRazorpayConfig = async (req, res) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        error: "Razorpay credentials not configured",
        details: {
          keyId: RAZORPAY_KEY_ID ? "Set" : "Missing",
          keySecret: RAZORPAY_KEY_SECRET ? "Set" : "Missing",
        },
      });
    }

    // Try to create a test order to verify credentials
    const testOptions = {
      amount: 100, // 1 rupee in paise
      currency: "INR",
      receipt: "test_receipt_" + Date.now(),
      payment_capture: 1,
    };

    const testOrder = await razorpay.orders.create(testOptions);

    res.status(200).json({
      success: true,
      message: "Razorpay configuration is working",
      testOrderId: testOrder.id,
      credentials: {
        keyId: RAZORPAY_KEY_ID.substring(0, 10) + "...",
        keySecret: "Set",
      },
    });
  } catch (error) {
    console.error("Razorpay configuration test failed:", error);
    res.status(500).json({
      success: false,
      error: "Razorpay configuration test failed",
      details: error.error || error.message,
    });
  }
};

// Admin: Summary of orders and revenue
const getAdminPaymentsSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

  const orders = await Order.find(match).select("deliveryStatus paymentStatus totalAmount refundStatus status refundedAmount platformRefundedAmount brandRefundedAmount refunds");
    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (o) => o.deliveryStatus === "Delivered" && ["Paid", "Razorpay"].includes(o.paymentStatus)
    ).length;
    const cancelledOrders = orders.filter((o) => o.deliveryStatus === "Cancelled").length;
    const paidOrders = orders.filter((o) => ["Paid", "Razorpay"].includes(o.paymentStatus));
  // For admin revenue view, both kinds of refunds reduce topline collected; keep refundedAmount for backward-compatible display
  const refundedAmount = paidOrders.reduce((sum, o) => sum + (o.refundedAmount || 0), 0);
    const totalRevenue = Math.max(
      paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) - refundedAmount,
      0
    );

    res.json({ success: true, data: { totalOrders, completedOrders, cancelledOrders, totalRevenue } });
  } catch (error) {
    console.error("Error getting admin payments summary:", error);
    res.status(500).json({ success: false, error: "Failed to get summary" });
  }
};

// Admin: Per-brand payments table
const getAdminBrandPayments = async (req, res) => {
  try {
    const { brand, from, to, status } = req.query;

    // Build order match
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // Remove day restrictions - payments can be made any day
    const isAllowedDay = true;

    // Fetch brands (for filtering and names)
    const brandQuery = brand
      ? { name: { $regex: new RegExp(brand, "i") } }
      : {};
    const brands = await Brand.find(brandQuery).select("_id name");
    const brandIds = brands.map((b) => b._id);

    // Orders grouped by brand
    const orders = await Order.find({ ...match, brandId: { $in: brandIds } }).select(
  "brandId paymentStatus totalAmount deliveryStatus createdAt refundedAmount platformRefundedAmount brandRefundedAmount refunds"
    );

    // Payouts grouped by brand
    const payouts = await Payout.aggregate([
      { $match: { brandId: { $in: brandIds } } },
      { $group: { _id: "$brandId", totalPaid: { $sum: "$amount" } } },
    ]);
    const brandIdToPaid = new Map(payouts.map((p) => [p._id.toString(), p.totalPaid]));

    const brandRows = brands.map((b) => {
      const bOrders = orders.filter((o) => o.brandId.toString() === b._id.toString());
      const totalRevenue = bOrders
        .filter((o) => ["Paid", "Razorpay"].includes(o.paymentStatus))
        .reduce((sum, o) => sum + (o.totalAmount || 0) - (o.refundedAmount || 0), 0);
      const confirmedRevenue = bOrders
        .filter(
          (o) =>
            o.deliveryStatus === "Delivered" && ["Paid", "Razorpay"].includes(o.paymentStatus)
        )
        .reduce((sum, o) => sum + (o.totalAmount || 0) - (o.refundedAmount || 0), 0);
      const eligibleOrdersArr = bOrders.filter(
        (o) =>
          o.deliveryStatus === "Delivered" &&
          ["Paid", "Razorpay"].includes(o.paymentStatus) &&
          new Date(o.createdAt) <= sevenDaysAgo
      );
      const eligibleOrders = eligibleOrdersArr.length;
      // For payout eligibility, deduct only platform-initiated refunds from revenue
  const eligibleRevenue = eligibleOrdersArr.reduce((sum, o) => sum + (o.totalAmount || 0) - getPayoutDeductibleRefund(o), 0);
      const nonConfirmedRevenue = Math.max(totalRevenue - confirmedRevenue, 0);
      const completedPayments = brandIdToPaid.get(b._id.toString()) || 0;
      const pendingAmount = Math.max(totalRevenue - completedPayments, 0);
      const paymentStatus = pendingAmount <= 0 ? "Completed" : completedPayments > 0 ? "Partial" : "Pending";
      const pendingEligibleAmount = Math.max(eligibleRevenue - completedPayments, 0);
      const canPay = pendingEligibleAmount > 0;
      let payDisabledReason = undefined;
      if (pendingEligibleAmount <= 0) {
        payDisabledReason = "No eligible delivered orders older than 7 days available for payout.";
      }
      return {
        brandId: b._id,
        brandName: b.name,
        totalOrders: bOrders.length,
        totalRevenue,
        confirmedRevenue,
        nonConfirmedRevenue,
        completedPayments,
        pendingAmount,
        paymentStatus,
        eligibleOrders,
        eligibleRevenue,
        canPay,
        payDisabledReason,
      };
    }).filter((row) => {
      // If a date range is specified, only include brands that have orders in that range
      if (from || to) {
        return row.totalOrders > 0;
      }
      // If no date range, include all brands (existing behavior)
      return true;
    });

    const filtered = status ? brandRows.filter((r) => r.paymentStatus === status) : brandRows;
    res.json({ success: true, data: filtered });
  } catch (error) {
    console.error("Error getting admin brand payments:", error);
    res.status(500).json({ success: false, error: "Failed to get brand payments" });
  }
};

// Admin: Record payout
const createAdminPayout = async (req, res) => {
  try {
    const { brandId, amount, razorpayPaymentId } = req.body;
    if (!brandId || !amount) {
      return res.status(400).json({ success: false, error: "brandId and amount are required" });
    }

    // Remove day restrictions - payments can be made any day for selected intervals

    // Enforce 7-day eligibility: only orders delivered and older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const brandOrders = await Order.find({
      brandId,
      deliveryStatus: "Delivered",
      paymentStatus: { $in: ["Paid", "Razorpay"] },
      createdAt: { $lte: sevenDaysAgo },
  }).select("totalAmount refundedAmount platformRefundedAmount refunds");
  // For payouts, deduct only platform-initiated refunds (with safe fallback)
  const eligibleRevenue = brandOrders.reduce((sum, o) => sum + (o.totalAmount || 0) - getPayoutDeductibleRefund(o), 0);
    const payoutAgg = await Payout.aggregate([
      { $match: { brandId: new mongoose.Types.ObjectId(brandId) } },
      { $group: { _id: "$brandId", totalPaid: { $sum: "$amount" } } },
    ]);
    const totalPaid = payoutAgg[0]?.totalPaid || 0;
    const pendingEligibleAmount = Math.max(eligibleRevenue - totalPaid, 0);
    if (amount > pendingEligibleAmount) {
      return res.status(400).json({
        success: false,
        error: "Requested payout exceeds eligible pending amount based on 7-day rule.",
        details: { eligibleRevenue, totalPaid, pendingEligibleAmount },
      });
    }

    const payout = await Payout.create({ brandId, amount, razorpayPaymentId, status: "Completed" });

    // Emit realtime event
    try {
      if (global.io) {
        global.io.emit("payoutUpdated", {
          type: "adminPayoutRecorded",
          brandId: brandId,
          amount,
          payoutId: payout._id,
        });
      }
    } catch (e) {
      console.warn("Failed to emit payoutUpdated:", e);
    }

    res.json({ success: true, data: payout });
  } catch (error) {
    console.error("Error creating admin payout:", error);
    res.status(500).json({ success: false, error: "Failed to record payout" });
  }
};

// Brand: Balance endpoint
const getBrandBalance = async (req, res) => {
  try {
    const { brandId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ success: false, error: "Invalid brandId" });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [orders, payoutAgg] = await Promise.all([
    Order.find({ brandId })
  .select("paymentStatus totalAmount deliveryStatus createdAt refundedAmount platformRefundedAmount refunds"),
      Payout.aggregate([
        { $match: { brandId: new mongoose.Types.ObjectId(brandId) } },
        { $group: { _id: "$brandId", totalPaid: { $sum: "$amount" } } },
      ]),
    ]);

    const totalRevenue = orders
      .filter((o) => ["Paid", "Razorpay"].includes(o.paymentStatus))
      .reduce((sum, o) => sum + (o.totalAmount || 0) - (o.refundedAmount || 0), 0);

    // Eligible for payout: Delivered, Paid/Razorpay, and createdAt older than 7 days
    const eligibleOrdersArr = orders.filter(
      (o) =>
        o.deliveryStatus === "Delivered" &&
        ["Paid", "Razorpay"].includes(o.paymentStatus) &&
        new Date(o.createdAt) <= sevenDaysAgo
    );
    const eligibleOrders = eligibleOrdersArr.length;
    const eligibleRevenue = eligibleOrdersArr.reduce(
      (sum, o) => sum + (o.totalAmount || 0) - getPayoutDeductibleRefund(o),
      0
    );

    // Budget calculator formula defaults for brand balance view
    const razorpayCommission = 0.02 * eligibleRevenue; // 2%
    const deliveryChargeTotal = 100 * eligibleOrders; // ₹100 per eligible order
    const commissionPercent = 0.15; // default 15% for brand view
    const percentCommission = commissionPercent * eligibleRevenue;
    const netEligiblePayable = Math.max(
      eligibleRevenue - razorpayCommission - deliveryChargeTotal - percentCommission,
      0
    );

    const totalPaid = payoutAgg[0]?.totalPaid || 0;
    const pendingAmount = Math.max(netEligiblePayable - totalPaid, 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalPaid,
        pendingAmount, // Net pending payable per calculator (15% commission)
        // Extras for transparency/debug (not used by UI now)
        eligibleOrders,
        eligibleRevenue,
        breakdown: {
          razorpayCommission,
          deliveryChargeTotal,
          percentCommission,
          netEligiblePayable,
          commissionPercent: 15,
        },
      },
    });
  } catch (error) {
    console.error("Error getting brand balance:", error);
    res.status(500).json({ success: false, error: "Failed to get balance" });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  testRazorpayConfig,
  getAdminPaymentsSummary,
  getAdminBrandPayments,
  createAdminPayout,
  getBrandBalance,
};
