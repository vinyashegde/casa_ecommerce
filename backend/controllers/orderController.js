const Order = require("../models/order");
const Notification = require("../models/notification");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const CancelRequest = require("../models/cancelRequest");
const {
  sendCancelOrderEmail,
  sendRefundOrderEmail,
} = require("./userController");
const InventoryService = require("../services/inventoryService");
const Product = require("../models/product");

const createOrder = async (req, res) => {
  try {
    const {
      user,
      products,
      address,
      estimatedDelivery,
      paymentStatus,
      totalAmount,
      paymentId,
      brandId,
    } = req.body;

    // Check each required field individually
    const missingFields = [];
    if (!user) missingFields.push("user");
    if (!products || products.length === 0) missingFields.push("products");
    if (!address) missingFields.push("address");
    if (!estimatedDelivery) missingFields.push("estimatedDelivery");
    if (!paymentStatus) missingFields.push("paymentStatus");
    if (!brandId) missingFields.push("brandId");

    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      return res.status(400).json({
        error: "Required fields missing",
        missingFields: missingFields,
        received: {
          user: !!user,
          products: products?.length || 0,
          address: !!address,
          estimatedDelivery: !!estimatedDelivery,
          paymentStatus: !!paymentStatus,
        },
      });
    }

    // ✅ VALIDATE STOCK AVAILABILITY BEFORE CREATING ORDER
    console.log(`🔍 Validating stock availability for order...`);
    const stockValidationErrors = [];

    for (const orderProduct of products) {
      const productId = orderProduct.product._id || orderProduct.product;
      const quantity = orderProduct.quantity || 1;
      const size = orderProduct.size;

      try {
        // Get the actual product from database
        const product = await Product.findById(productId);
        if (!product) {
          stockValidationErrors.push(`Product not found: ${productId}`);
          continue;
        }

        // Check stock availability using inventory service
        const currentStock = InventoryService.getProductStock(product, size);

        if (currentStock < quantity) {
          stockValidationErrors.push(
            `Insufficient stock for ${product.name}${
              size ? ` (${size})` : ""
            }: ${currentStock} available, ${quantity} requested`
          );
        }

        console.log(
          `📦 Stock check for ${product.name}: ${currentStock} available, ${quantity} requested`
        );
      } catch (error) {
        console.error(
          `❌ Error checking stock for product ${productId}:`,
          error
        );
        stockValidationErrors.push(
          `Failed to check stock for product: ${productId}`
        );
      }
    }

    if (stockValidationErrors.length > 0) {
      console.error("❌ Stock validation failed:", stockValidationErrors);
      return res.status(400).json({
        error: "Insufficient stock for order",
        stockErrors: stockValidationErrors,
        message:
          "Some items in your order are out of stock or have insufficient quantity available.",
      });
    }

    console.log(
      `✅ Stock validation passed for all ${products.length} products`
    );

    const newProductsEntry = products.map((product) => {
      const originalPrice = parseFloat(
        product.priceAtAdd?.["$numberDecimal"] ||
          product.product.price?.["$numberDecimal"]
      );

      // Calculate offer discount if available
      const offerPercentage = product.product.offerPercentage || 0;
      const discount = (originalPrice * offerPercentage) / 100;
      const discountedPrice = originalPrice - discount;

      return {
        product: product.product._id,
        name: product.product.name,
        price: discountedPrice, // Store the final price after discount
        originalPrice: originalPrice,
        offerPercentage: offerPercentage,
        discountedPrice: discountedPrice,
        quantity: product.quantity || 1,
        size: product.size,
      };
    });

    for (const item of newProductsEntry) {
      if (
        !item.product ||
        !item.name ||
        !item.price ||
        !item.size ||
        !item.originalPrice ||
        !item.discountedPrice
      ) {
        return res.status(400).json({
          error:
            "Each product must include product ID, name, price, originalPrice, discountedPrice, and size",
        });
      }
      item.quantity = item.quantity || 1;
    }

    const newOrder = new Order({
      user,
      brandId,
      products: newProductsEntry,
      address,
      estimatedDelivery,
      paymentStatus,
      totalAmount,
      paymentId: paymentId || null,
    });

    const saved = await newOrder.save();

    // ✅ DEDUCT STOCK IMMEDIATELY ON ORDER CREATION
    try {
      console.log(`🔄 Order ${saved._id} created successfully, deducting stock immediately...`);
      
      const stockUpdateResult = await InventoryService.updateStockOnOrderCreation(
        saved._id,
        brandId
      );

      if (stockUpdateResult && stockUpdateResult.success) {
        console.log(`✅ Stock deducted successfully for order ${saved._id}`);
      } else {
        console.error(`❌ Failed to deduct stock for order ${saved._id}:`, stockUpdateResult);
        // We don't fail the order creation if stock deduction fails, but we log it
      }
    } catch (stockError) {
      console.error(`❌ Error deducting stock for order ${saved._id}:`, stockError);
      // Don't fail the order creation if stock deduction fails
    }

    // Create brand-specific notification for CRM
    try {
      const notification = new Notification({
        brandId: brandId,
        orderId: saved._id,
        message: `New Order #${saved._id.toString().slice(-4)} placed!`,
        orderDetails: {
          customerName: user.display_name || user.email || "Customer",
          orderAmount: totalAmount,
          orderDate: new Date(),
        },
      });

      await notification.save();

      // Emit real-time notification to specific brand's CRM clients
      if (global.io) {
        global.io.emit("newOrderNotification", {
          id: notification._id,
          brandId: brandId,
          orderId: saved._id,
          message: notification.message,
          orderDetails: notification.orderDetails,
          createdAt: notification.createdAt,
        });
      }
    } catch (notificationError) {
      console.error("❌ Error creating notification:", notificationError);
      // Don't fail the order creation if notification fails
    }

    res.status(201).json({ success: true, saved });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create order", detail: err.message });
  }
};

// GET all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "display_name email phone")
      .populate("products.product", "name price images");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "display_name email phone")
      .populate("products.product", "name price images");

    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET orders by user ID
const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const orders = await Order.find({ user: userId })
      .populate("user", "display_name email phone")
      .populate("products.product", "name price images")
      .sort({ createdAt: -1 }); // Sort by newest first

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE order status (delivery or payment)
const updateOrder = async (req, res) => {
  try {
    // If deliveryStatus is transitioning to Delivered, stamp deliveredAt
    const update = { ...req.body };
    if (update.deliveryStatus === "Delivered") {
      update.deliveredAt = new Date();
    }
    const updated = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Order not found" });

    // Automatically update stock when order is delivered
    if (update.deliveryStatus === "Delivered") {
      try {
        console.log(
          `🔄 Order ${req.params.id} marked as delivered, updating stock...`
        );
        const stockUpdateResult = await InventoryService.updateStockOnDelivery(
          req.params.id,
          updated.brandId
        );

        if (stockUpdateResult && stockUpdateResult.success) {
          console.log(
            `✅ Stock updated successfully for order ${req.params.id}`
          );

          // Create notification for brand about stock update
          try {
            const notification = new Notification({
              brandId: updated.brandId,
              orderId: updated._id,
              message: `Stock automatically updated for delivered Order #${updated._id
                .toString()
                .slice(-4)}`,
              orderDetails: {
                customerName: "System",
                orderAmount: updated.totalAmount,
                orderDate: updated.createdAt,
                stockUpdates: stockUpdateResult.stockUpdates,
              },
            });
            await notification.save();

            // Emit real-time notification
            if (global.io) {
              global.io.emit("stockUpdatedNotification", {
                id: notification._id,
                brandId: updated.brandId,
                orderId: updated._id,
                message: notification.message,
                orderDetails: notification.orderDetails,
                createdAt: notification.createdAt,
              });
            }
          } catch (notificationError) {
            console.error(
              "❌ Error creating stock update notification:",
              notificationError
            );
            // Don't fail the order update if notification fails
          }
        }
      } catch (stockError) {
        console.error(
          `❌ Error updating stock for delivered order ${req.params.id}:`,
          stockError
        );
        // Don't fail the order update if stock update fails
        // The order is still marked as delivered, but stock needs manual adjustment
      }
    }

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE order
const deleteOrder = async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CANCEL order
const cancelOrder = async (req, res) => {
  try {
    const { orderId, productId, productIndex } = req.body;

    if (!orderId) {
      console.error("❌ Order ID is required");
      return res.status(400).json({ error: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.error("❌ Order not found with ID:", orderId);
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if order can be cancelled (e.g., not already delivered or cancelled)
    if (order.deliveryStatus === "Delivered") {
      return res.status(400).json({
        error: "Cannot cancel delivered order",
      });
    }

    if (order.deliveryStatus === "Cancelled") {
      return res.status(400).json({
        error: "Order is already cancelled",
      });
    }

    // If specific product is being cancelled
    if (productId && productIndex !== undefined) {
      // Remove the specific product from the order
      order.products.splice(productIndex, 1);

      // Recalculate total amount
      order.totalAmount = order.products.reduce((total, product) => {
        return total + product.price * product.quantity;
      }, 0);

      // If no products left, cancel the entire order
      if (order.products.length === 0) {
        order.deliveryStatus = "Cancelled";
      }
    } else {
      // Cancel entire order
      order.deliveryStatus = "Cancelled";
    }

    const updated = await order.save();

    // Create notification for brand
    try {
      const notification = new Notification({
        brandId: order.brandId,
        orderId: order._id,
        message: `Order #${order._id.toString().slice(-4)} ${
          productId ? "product cancelled" : "cancelled"
        }!`,
        orderDetails: {
          customerName:
            order.user?.display_name || order.user?.email || "Customer",
          orderAmount: order.totalAmount,
          orderDate: order.createdAt,
          status: "Cancelled",
        },
      });

      await notification.save();

      // Emit real-time notification to specific brand's CRM clients
      if (global.io) {
        global.io.emit("orderCancelledNotification", {
          id: notification._id,
          brandId: order.brandId,
          orderId: order._id,
          message: notification.message,
          orderDetails: notification.orderDetails,
          createdAt: notification.createdAt,
        });
      }
    } catch (notificationError) {
      console.error(
        "❌ Error creating cancellation notification:",
        notificationError
      );
      // Don't fail the cancellation if notification fails
    }

    res.json({
      success: true,
      message: productId
        ? "Product cancelled successfully"
        : "Order cancelled successfully",
      updated,
    });
  } catch (err) {
    console.error("❌ Error cancelling order:", {
      error: err.message,
      stack: err.stack,
      orderId: req.body.orderId,
      body: req.body,
    });
    res
      .status(500)
      .json({ error: "Failed to cancel order", detail: err.message });
  }
};

// UPDATE Shiprocket IDs for an order
const updateShiprocketIds = async (req, res) => {
  try {
    const { sr_order_id, sr_channel_id } = req.body;
    const { id } = req.params;

    if (!id) {
      console.error("❌ Order ID is required");
      return res.status(400).json({ error: "Order ID is required" });
    }

    const updateData = {};
    if (sr_order_id !== undefined) updateData.sr_order_id = sr_order_id;
    if (sr_channel_id !== undefined) updateData.sr_channel_id = sr_channel_id;

    if (Object.keys(updateData).length === 0) {
      console.error("❌ No Shiprocket IDs provided");
      return res
        .status(400)
        .json({ error: "At least one Shiprocket ID is required" });
    }

    const updated = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      console.error("❌ Order not found with ID:", id);
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      success: true,
      message: "Shiprocket IDs updated successfully",
      updated,
    });
  } catch (err) {
    console.error("❌ Error updating Shiprocket IDs:", {
      error: err.message,
      stack: err.stack,
      orderId: req.params.id,
      body: req.body,
    });
    res.status(500).json({
      error: "Failed to update Shiprocket IDs",
      detail: err.message,
    });
  }
};

// GET brand summary: totalProducts, completedOrders, completedRevenue
const getBrandSummary = async (req, res) => {
  try {
    const { brandId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ success: false, error: "Invalid brandId" });
    }

    const [ordersAgg, productsAgg] = await Promise.all([
      Order.aggregate([
        { $match: { brandId: new mongoose.Types.ObjectId(brandId) } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$deliveryStatus", "Delivered"] },
                      { $in: ["$paymentStatus", ["Paid", "Razorpay"]] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            completedRevenue: {
              $sum: {
                $cond: [
                  { $in: ["$paymentStatus", ["Paid", "Razorpay"]] },
                  {
                    $subtract: [
                      "$totalAmount",
                      { $ifNull: ["$refundedAmount", 0] },
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),
      // Products collection is not imported here; use mongoose.model
      mongoose.model("Product").countDocuments({ brand: brandId }),
    ]);

    const orders = ordersAgg[0] || {
      totalOrders: 0,
      completedOrders: 0,
      completedRevenue: 0,
    };

    return res.json({
      success: true,
      data: {
        totalProducts: productsAgg || 0,
        totalOrders: orders.totalOrders,
        completedOrders: orders.completedOrders,
        completedRevenue: orders.completedRevenue,
      },
    });
  } catch (err) {
    console.error("Error getting brand summary:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to get summary" });
  }
};

// NEW: PATCH /orders/:id/refund-request — user requests refund due to delay
const requestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const order = await Order.findById(id).populate(
      "user",
      "display_name email"
    );
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });

    // Only delivered orders are eligible
    if (order.deliveryStatus !== "Delivered") {
      return res.status(400).json({
        success: false,
        error: "Refunds only allowed for delivered orders",
      });
    }

    // Check if order already has a refund request
    if (
      order.status === "refund_requested" ||
      order.status === "refund_approved" ||
      order.status === "refunded"
    ) {
      return res.status(400).json({
        success: false,
        error: "Refund already requested or processed",
      });
    }

    // For now, allow refund requests for any delivered order (remove strict delay validation)
    // This can be made more strict later if needed
    order.status = "refund_requested";
    order.refundReason = reason || "Delayed Order Refund";
    await order.save();

    // Create notification for brand
    try {
      const customerName =
        order.user?.display_name || order.user?.email || "Unknown Customer";
      const notification = new Notification({
        brandId: order.brandId,
        orderId: order._id,
        message: `Refund request for Order #${order._id
          .toString()
          .slice(-4)} from ${customerName}`,
        orderDetails: {
          customerName: customerName,
          orderAmount: order.totalAmount,
          orderDate: order.createdAt,
        },
      });
      await notification.save();

      console.log("🔔 Emitting refund request notification:", {
        brandId: order.brandId,
        orderId: order._id,
        customerName: customerName,
        reason: reason || "Delayed Order Refund",
      });

      if (global.io) {
        global.io.emit("refundRequestNotification", {
          _id: notification._id,
          brandId: order.brandId,
          orderId: order._id,
          message: notification.message,
          orderDetails: notification.orderDetails,
          refundReason: reason || "Delayed Order Refund",
          createdAt: notification.createdAt,
        });
      }
    } catch (notificationError) {
      console.error(
        "❌ Error creating refund notification:",
        notificationError
      );
      // Don't fail the refund request if notification fails
    }

    return res.json({ success: true, message: "Refund requested", order });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to request refund",
    });
  }
};

// NEW: GET /orders/refund-requests — admin listing
const getRefundRequests = async (_req, res) => {
  try {
    const orders = await Order.find({ status: "refund_requested" })
      .populate("brandId", "name")
      .populate("user", "display_name email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// NEW: PATCH /orders/:id/refund-response — admin approves/rejects
const respondRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body || {};
    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }
    const order = await Order.findById(id).populate("user", "display_name email");
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    if (action === "reject") {
      order.status = "refund_rejected";
      order.refundReason = notes || order.refundReason;
      await order.save();
      
      // Send rejection email notification
      try {
        if (order.user && order.user.email) {
          const { sendRefundRejectionEmail } = require('../services/emailService');
          await sendRefundRejectionEmail(order.user.email, order._id, notes);
          console.log('✅ Refund rejection email sent to:', order.user.email);
        }
      } catch (emailError) {
        console.error('❌ Failed to send refund rejection email:', emailError.message);
        // Don't fail the main workflow if email fails
      }
      
      return res.json({ success: true, message: "Refund request rejected", order });
    }
    
    // approve: do not trigger refund here; mark approved and let Payments handle payout/refund
    order.status = "refund_approved";
    order.refundReason = notes || order.refundReason;
    await order.save();
    
    // Send approval email notification
    try {
      if (order.user && order.user.email) {
        const { sendRefundApprovalEmail } = require('../services/emailService');
        await sendRefundApprovalEmail(order.user.email, order._id);
        console.log('✅ Refund approval email sent to:', order.user.email);
      }
    } catch (emailError) {
      console.error('❌ Failed to send refund approval email:', emailError.message);
      // Don't fail the main workflow if email fails
    }
    
    return res.json({ success: true, message: "Refund approved", order });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to process refund response",
    });
  }
};

// NEW: GET /orders/refund-approved — list orders approved for refund
const getRefundApproved = async (_req, res) => {
  try {
    const orders = await Order.find({ status: "refund_approved" })
      .populate("brandId", "name")
      .populate("user", "display_name email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// NEW: GET /orders/refunded — list all refunded orders (completed refunds)
const getRefundedOrders = async (_req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { status: "refunded" },
        { refundStatus: "completed" },
        { refundedAmount: { $gt: 0 } },
      ],
    })
      .populate("brandId", "name")
      .populate("user", "display_name email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// NEW: PATCH /orders/:id/cancel — user initiates cancel request (non-breaking; coexists with cancel-requests)
const userCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body || {};

    const order = await Order.findById(id).populate(
      "user",
      "display_name email phone"
    );
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });

    const blocked = new Set([
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ]);
    if (blocked.has(order.deliveryStatus)) {
      return res.status(400).json({
        success: false,
        error: "Order cannot be cancelled at this stage",
      });
    }

    order.status = "cancel_requested";
    order.cancelRequestedBy = userId || order.user?.email || "user";
    order.deliveryStatus = "Cancellation Requested"; // preserve legacy UI
    await order.save();

    // Fire brand notification
    try {
      const notification = new Notification({
        brandId: order.brandId,
        orderId: order._id,
        message: `Cancellation request for Order #${order._id
          .toString()
          .slice(-4)}`,
        orderDetails: {
          customerName:
            order.user?.display_name || order.user?.email || "Customer",
          orderAmount: order.totalAmount,
          orderDate: order.createdAt,
        },
      });
      await notification.save();
      if (global.io) {
        global.io.emit("cancellationRequestNotification", {
          id: notification._id,
          brandId: order.brandId,
          orderId: order._id,
          message: notification.message,
          orderDetails: notification.orderDetails,
          cancelRequestDetails: {
            reason: reason || null,
            requestedAt: new Date(),
          },
          createdAt: notification.createdAt,
        });
      }
    } catch (e) {
      // do not fail
    }

    return res.json({
      success: true,
      message: "Cancellation requested",
      order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Helper to update order products on item-level cancel
async function applyItemLevelCancellation(order, productIndex) {
  if (productIndex !== undefined && productIndex !== null) {
    order.products.splice(productIndex, 1);
    order.totalAmount = order.products.reduce(
      (total, p) => total + p.price * (p.quantity || 1),
      0
    );
    if (order.products.length === 0) {
      order.deliveryStatus = "Cancelled";
    }
  } else {
    order.deliveryStatus = "Cancelled";
  }
}

// NEW: PATCH /orders/:id/brand-response — brand approves/rejects
const brandRespondToCancel = async (req, res) => {
  try {
    const { id } = req.params; // orderId
    const { action, adminNotes, processedBy, productIndex } = req.body || {};
    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    const order = await Order.findById(id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });

    if (action === "approve") {
      order.status = "cancelled";
      order.cancelApprovedBy = processedBy || "brand";
      await applyItemLevelCancellation(order, productIndex);
      await order.save();

      // Also mark any pending cancel requests for this order as approved
      try {
        await CancelRequest.updateMany(
          { orderId: order._id, status: "pending" },
          {
            $set: {
              status: "approved",
              processedAt: new Date(),
              processedBy: processedBy || "Brand",
              adminNotes: adminNotes || null,
            },
          }
        );
      } catch (e) {}

      // Notify user + admin via socket and Notification model (brandId is required by schema)
      try {
        const notification = new Notification({
          brandId: order.brandId,
          orderId: order._id,
          message: `Cancellation approved for Order #${order._id
            .toString()
            .slice(-4)}`,
          orderDetails: {
            customerName: "",
            orderAmount: order.totalAmount,
            orderDate: order.createdAt,
          },
        });
        await notification.save();
        if (global.io) {
          global.io.emit("cancellationApprovedNotification", {
            id: notification._id,
            brandId: order.brandId,
            orderId: order._id,
            message: notification.message,
            orderDetails: notification.orderDetails,
            createdAt: notification.createdAt,
          });
          // Admin can listen to same event; keep single channel
        }
      } catch (e) {}

      // Send email notification to user about cancellation confirmation
      try {
        const populatedOrder = await Order.findById(order._id).populate(
          "user",
          "email display_name"
        );
        if (
          populatedOrder &&
          populatedOrder.user &&
          populatedOrder.user.email
        ) {
          const orderDetails = {
            orderId: order._id.toString().slice(-4),
            customerName:
              populatedOrder.user.display_name || populatedOrder.user.email,
            amount: order.totalAmount,
            orderDate: order.createdAt,
          };
          await sendCancelOrderEmail(populatedOrder.user.email, orderDetails);
          console.log(
            "✅ Cancel order email notification sent to:",
            populatedOrder.user.email
          );
        }
      } catch (emailError) {
        console.error(
          "❌ Error sending cancel order email notification:",
          emailError
        );
        // Don't fail the cancellation if email fails
      }

      return res.json({
        success: true,
        message: "Order cancellation approved",
        order,
      });
    } else {
      // reject
      order.status = "cancel_rejected";
      // revert deliveryStatus back from Cancellation Requested
      if (order.deliveryStatus === "Cancellation Requested") {
        order.deliveryStatus = "Pending";
      }
      await order.save();

      // Also mark any pending cancel requests for this order as rejected
      try {
        await CancelRequest.updateMany(
          { orderId: order._id, status: "pending" },
          {
            $set: {
              status: "rejected",
              processedAt: new Date(),
              processedBy: processedBy || "Brand",
              adminNotes: adminNotes || null,
            },
          }
        );
      } catch (e) {}

      try {
        const notification = new Notification({
          brandId: order.brandId,
          orderId: order._id,
          message: `Cancellation rejected for Order #${order._id
            .toString()
            .slice(-4)}`,
          orderDetails: {
            customerName: "",
            orderAmount: order.totalAmount,
            orderDate: order.createdAt,
          },
        });
        await notification.save();
        if (global.io) {
          global.io.emit("cancellationRejectedNotification", {
            id: notification._id,
            brandId: order.brandId,
            orderId: order._id,
            message: notification.message,
            orderDetails: notification.orderDetails,
            adminNotes: adminNotes || null,
            createdAt: notification.createdAt,
          });
        }
      } catch (e) {}

      return res.json({
        success: true,
        message: "Cancellation rejected",
        order,
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// NEW: GET /orders/cancelled — list of cancelled orders for admin
const getCancelledOrders = async (_req, res) => {
  try {
    const orders = await Order.find({ status: "cancelled" })
      .populate("brandId", "name")
      .populate("user", "display_name email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Razorpay client for refunds (scoped here to avoid cross-module export churn)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const razorpayClient =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      })
    : null;

// NEW: PATCH /orders/:id/refund — admin triggers refund back to original source
const refundOrder = async (req, res) => {
  try {
    if (!razorpayClient) {
      return res.status(400).json({
        success: false,
        error:
          "Razorpay not configured on server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }
    const { id } = req.params;
    const { amount, notes } = req.body || {};
    const order = await Order.findById(id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });
    const refundableState =
      order.status === "cancelled" ||
      order.deliveryStatus === "Cancelled" ||
      order.status === "refund_approved";
    if (!refundableState) {
      return res.status(400).json({
        success: false,
        error: "Only cancelled or refund-approved orders can be refunded",
      });
    }
    // Allow multiple partial refunds until fully refunded

    const paymentId = order.razorpayPaymentId || order.paymentId;
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: "Missing Razorpay payment id on order",
      });
    }

    const refundableRemaining = Math.max(
      (order.totalAmount || 0) - (order.refundedAmount || 0),
      0
    );
    if (refundableRemaining <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Order already fully refunded" });
    }

    const requested =
      amount && Number(amount) > 0 ? Number(amount) : refundableRemaining;
    if (requested > refundableRemaining) {
      return res.status(400).json({
        success: false,
        error: "Requested amount exceeds refundable balance",
      });
    }
    const refundAmount = requested;
    const amountPaise = Math.round(refundAmount * 100);

    let refund;
    try {
      refund = await razorpayClient.payments.refund(paymentId, {
        amount: amountPaise,
      });
    } catch (e) {
      const description =
        e?.error?.description || e?.message || "Razorpay refund failed";
      return res.status(400).json({ success: false, error: description });
    }

    const newRefundedTotal = (order.refundedAmount || 0) + refundAmount;
    order.refundStatus =
      newRefundedTotal >= (order.totalAmount || 0) ? "completed" : "initiated";
    order.refundedAmount = (order.refundedAmount || 0) + refundAmount;
    order.platformRefundedAmount =
      (order.platformRefundedAmount || 0) + refundAmount;
    order.razorpayRefundId = refund.id || null;
    // append granular record
    order.refunds = order.refunds || [];
    order.refunds.push({
      amount: refundAmount,
      initiatedBy: "platform",
      razorpayPaymentId: paymentId,
      razorpayRefundId: refund.id || null,
      notes: notes || null,
    });
    await order.save();

    if (order.status === "refund_approved") {
      order.status =
        newRefundedTotal >= (order.totalAmount || 0)
          ? "refunded"
          : "refund_initiated";
      await order.save();
    }

    // Ensure any pending cancel-requests are marked approved so UIs hide Approve/Reject
    try {
      await CancelRequest.updateMany(
        { orderId: order._id, status: "pending" },
        {
          $set: {
            status: "approved",
            processedAt: new Date(),
            processedBy: "Admin",
          },
        }
      );
    } catch (e) {}

    try {
      if (global.io) {
        global.io.emit("paymentUpdated", {
          type: "orderRefundProcessed",
          orderId: order._id,
          brandId: order.brandId,
          refundId: order.razorpayRefundId,
        });
      }
      const notification = new Notification({
        brandId: order.brandId,
        orderId: order._id,
        message: `Refund processed successfully for Order #${order._id
          .toString()
          .slice(-4)}`,
        orderDetails: {
          customerName: "",
          orderAmount: order.totalAmount,
          orderDate: order.createdAt,
        },
      });
      await notification.save();
    } catch (e) {}

    // Send email notification to user about refund confirmation
    try {
      const populatedOrder = await Order.findById(order._id).populate(
        "user",
        "email display_name"
      );
      if (populatedOrder && populatedOrder.user && populatedOrder.user.email) {
        const orderDetails = {
          orderId: order._id.toString().slice(-4),
          customerName:
            populatedOrder.user.display_name || populatedOrder.user.email,
          amount: order.totalAmount,
          orderDate: order.createdAt,
          refundAmount: refundAmount,
        };
        await sendRefundOrderEmail(populatedOrder.user.email, orderDetails);
        console.log(
          "✅ Refund order email notification sent to:",
          populatedOrder.user.email
        );
      }
    } catch (emailError) {
      console.error(
        "❌ Error sending refund order email notification:",
        emailError
      );
      // Don't fail the refund if email fails
    }

    return res.json({
      success: true,
      message: "Refund processed successfully",
      order,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: err.message || "Refund failed" });
  }
};

// NEW: PATCH /orders/:id/refund/brand — brand initiates refund; brand bears cost directly
const brandRefundOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body || {};
    const order = await Order.findById(id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });

    const refundableState =
      order.status === "cancelled" ||
      order.deliveryStatus === "Cancelled" ||
      order.status === "refund_approved";
    if (!refundableState) {
      return res.status(400).json({
        success: false,
        error: "Only cancelled or refund-approved orders can be refunded",
      });
    }

    const refundableRemaining = Math.max(
      (order.totalAmount || 0) - (order.refundedAmount || 0),
      0
    );
    if (refundableRemaining <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Order already fully refunded" });
    }

    const requested =
      amount && Number(amount) > 0 ? Number(amount) : refundableRemaining;
    if (requested > refundableRemaining) {
      return res.status(400).json({
        success: false,
        error: "Requested amount exceeds refundable balance",
      });
    }

    // Brand-initiated refund goes to customer, brand bears cost.
    // If payment gateway refund is needed, we can still use Razorpay if configured; otherwise record manual adjustment.
    let refundId = null;
    if (razorpayClient && (order.razorpayPaymentId || order.paymentId)) {
      const paymentId = order.razorpayPaymentId || order.paymentId;
      try {
        const rpRefund = await razorpayClient.payments.refund(paymentId, {
          amount: Math.round(requested * 100),
        });
        refundId = rpRefund.id || null;
      } catch (e) {
        // If Razorpay refund fails for brand case, still allow recording as manual refund so accounting can be reconciled externally.
        // Return a softer error including instruction.
        return res.status(400).json({
          success: false,
          error:
            e?.error?.description ||
            e?.message ||
            "Razorpay refund failed for brand refund",
        });
      }
    }

    const newRefundedTotal2 = (order.refundedAmount || 0) + requested;
    order.refundStatus =
      newRefundedTotal2 >= (order.totalAmount || 0) ? "completed" : "initiated";
    order.refundedAmount = newRefundedTotal2;
    order.brandRefundedAmount = (order.brandRefundedAmount || 0) + requested;
    if (refundId) order.razorpayRefundId = refundId;
    order.refunds = order.refunds || [];
    order.refunds.push({
      amount: requested,
      initiatedBy: "brand",
      razorpayPaymentId: order.razorpayPaymentId || order.paymentId || null,
      razorpayRefundId: refundId,
      notes: notes || null,
    });
    await order.save();
    if (order.status === "refund_approved") {
      order.status =
        newRefundedTotal2 >= (order.totalAmount || 0)
          ? "refunded"
          : "refund_initiated";
      await order.save();
    }

    try {
      if (global.io) {
        global.io.emit("paymentUpdated", {
          type: "orderRefundProcessed",
          orderId: order._id,
          brandId: order.brandId,
          refundId: order.razorpayRefundId,
        });
      }
      const notification = new Notification({
        brandId: order.brandId,
        orderId: order._id,
        message: `Brand refund processed for Order #${order._id
          .toString()
          .slice(-4)}`,
        orderDetails: {
          customerName: "",
          orderAmount: order.totalAmount,
          orderDate: order.createdAt,
        },
      });
      await notification.save();
    } catch (e) {}

    // Send email notification to user about brand refund confirmation
    try {
      const populatedOrder = await Order.findById(order._id).populate(
        "user",
        "email display_name"
      );
      if (populatedOrder && populatedOrder.user && populatedOrder.user.email) {
        const orderDetails = {
          orderId: order._id.toString().slice(-4),
          customerName:
            populatedOrder.user.display_name || populatedOrder.user.email,
          amount: order.totalAmount,
          orderDate: order.createdAt,
          refundAmount: requested,
        };
        await sendRefundOrderEmail(populatedOrder.user.email, orderDetails);
        console.log(
          "✅ Brand refund order email notification sent to:",
          populatedOrder.user.email
        );
      }
    } catch (emailError) {
      console.error(
        "❌ Error sending brand refund order email notification:",
        emailError
      );
      // Don't fail the refund if email fails
    }

    return res.json({
      success: true,
      message: "Brand refund recorded successfully",
      order,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: err.message || "Brand refund failed" });
  }
};

// Export all functions at the end
module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  updateOrder,
  deleteOrder,
  cancelOrder,
  updateShiprocketIds,
  getBrandSummary,
  requestRefund,
  getRefundRequests,
  respondRefund,
  getRefundApproved,
  getRefundedOrders,
  userCancelOrder,
  brandRespondToCancel,
  getCancelledOrders,
  refundOrder,
  brandRefundOrder,
};
