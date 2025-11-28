const CancelRequest = require("../models/cancelRequest");
const Order = require("../models/order");
const Notification = require("../models/notification");

// Create a new cancellation request
module.exports.createCancelRequest = async (req, res) => {
  try {
    const {
      orderId,
      brandId: brandIdFromBody,
      userId: userIdFromBody,
      productId: productIdFromBody,
      productIndex: productIndexFromBody,
      reason,
      orderDetails: orderDetailsFromBody,
    } = req.body || {};

    // Validate minimal required fields
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: orderId",
      });
    }

    // Load order with user and product details so we can derive missing fields
    const order = await Order.findById(orderId)
      .populate("user", "display_name email phone")
      .populate("products.product", "name images");

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // If brandId provided by client, ensure it matches; otherwise derive from order
    const brandId = brandIdFromBody || order.brandId?.toString();
    if (!brandId) {
      return res.status(400).json({ success: false, error: "Unable to determine brandId" });
    }
    if (brandIdFromBody && order.brandId?.toString() !== brandIdFromBody) {
      return res.status(403).json({
        success: false,
        error: "Order does not belong to this brand",
      });
    }

    const userId = userIdFromBody || order.user?._id?.toString();
    if (!userId) {
      return res.status(400).json({ success: false, error: "Unable to determine userId" });
    }

    // Normalize product selection (optional)
    let resolvedProductIndex = typeof productIndexFromBody === "number" ? productIndexFromBody : undefined;
    if (resolvedProductIndex === undefined && productIdFromBody) {
      resolvedProductIndex = order.products.findIndex((p) => {
        const pid = (p.product && p.product._id) ? p.product._id.toString() : p.product?.toString?.();
        return pid === productIdFromBody?.toString();
      });
      if (resolvedProductIndex < 0) resolvedProductIndex = undefined;
    }

    // Build orderDetails if not provided
    let orderDetails = orderDetailsFromBody;
    if (!orderDetails) {
      const customerName = order.user?.display_name || order.user?.email || "Customer";
      const customerEmail = order.user?.email || "";
      const customerPhone = order.user?.phone || "";

      // If a specific product is targeted and index is valid, use that, else treat as full order cancellation
      const hasIndex = typeof resolvedProductIndex === "number" && resolvedProductIndex >= 0 && resolvedProductIndex < order.products.length;
      const item = hasIndex ? order.products[resolvedProductIndex] : order.products[0];

      const productName = hasIndex
        ? (item?.name || item?.product?.name || "Order Item")
        : "Full order cancellation";
      const productImage = item?.product?.images?.[0] || null;
      const quantity = hasIndex ? item?.quantity || 1 : 1;
      const size = hasIndex ? item?.size || null : null;
      const price = hasIndex ? item?.price || order.totalAmount : order.totalAmount;
      const totalAmount = order.totalAmount;

      orderDetails = {
        customerName,
        customerEmail,
        customerPhone,
        productName,
        productImage,
        quantity,
        size,
        price,
        totalAmount,
      };
    }

    // Check if there's already a pending cancellation request for this order
    const existingRequest = await CancelRequest.findOne({
      orderId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: "A pending cancellation request already exists for this order",
      });
    }

    // Create the cancellation request
    const cancelRequest = new CancelRequest({
      orderId,
      brandId,
      userId,
      productId: productIdFromBody || (typeof resolvedProductIndex === "number" ? order.products[resolvedProductIndex]?.product : undefined),
      productIndex: typeof resolvedProductIndex === "number" ? resolvedProductIndex : undefined,
      reason,
      orderDetails,
      status: "pending",
    });

    await cancelRequest.save();

    // Create notification for brand
    try {
      const notification = new Notification({
        brandId: brandId,
        orderId: orderId,
        message: `Cancellation request for Order #${orderId.toString().slice(-4)} from ${orderDetails.customerName}`,
        orderDetails: {
          customerName: orderDetails.customerName,
          orderAmount: orderDetails.totalAmount,
          orderDate: order.createdAt,
        },
      });
      await notification.save();

      if (global.io) {
        global.io.emit("cancellationRequestNotification", {
          _id: notification._id,
          brandId: brandId,
          orderId: orderId,
          message: notification.message,
          orderDetails: notification.orderDetails,
          cancelRequestDetails: {
            reason: reason,
            productName: orderDetails.productName,
            requestedAt: cancelRequest.requestedAt,
          },
          createdAt: notification.createdAt,
        });
      }
    } catch (notificationError) {
      console.error("❌ Error creating cancellation notification:", notificationError);
      // Don't fail the cancellation request if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Cancellation request created successfully",
      cancelRequest,
    });
  } catch (error) {
    console.error("Error creating cancellation request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create cancellation request",
    });
  }
};

// Get cancellation requests by brand
module.exports.getCancelRequestsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { status } = req.query;

    let query = { brandId };
    if (status) {
      query.status = status;
    }

    const cancelRequests = await CancelRequest.find(query)
      .populate("orderId", "orderId totalAmount deliveryStatus")
      .populate("userId", "display_name email")
      .populate("productId", "name images")
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      cancelRequests,
    });
  } catch (error) {
    console.error("Error fetching cancellation requests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cancellation requests",
    });
  }
};

// Get specific cancellation request by ID
module.exports.getCancelRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const cancelRequest = await CancelRequest.findById(requestId)
      .populate("orderId")
      .populate("userId", "display_name email")
      .populate("productId", "name images");

    if (!cancelRequest) {
      return res.status(404).json({
        success: false,
        error: "Cancellation request not found",
      });
    }

    res.json({
      success: true,
      cancelRequest,
    });
  } catch (error) {
    console.error("Error fetching cancellation request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cancellation request",
    });
  }
};

// Approve cancellation request
module.exports.approveCancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes, processedBy } = req.body;

    const cancelRequest = await CancelRequest.findById(requestId);
    if (!cancelRequest) {
      return res.status(404).json({
        success: false,
        error: "Cancellation request not found",
      });
    }

    if (cancelRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Cancellation request has already been processed",
      });
    }

    // Update the cancellation request
    cancelRequest.status = "approved";
    cancelRequest.processedAt = new Date();
    cancelRequest.processedBy = processedBy || "Admin";
    cancelRequest.adminNotes = adminNotes;

    await cancelRequest.save();

    // Update the order status
    const order = await Order.findById(cancelRequest.orderId);
    if (order) {
      order.status = "cancelled";
      order.cancellationReason = cancelRequest.reason;
      order.cancelledAt = new Date();
      await order.save();
    }

    // Create notification for user (if needed)
    try {
      const notification = new Notification({
        brandId: cancelRequest.brandId,
        orderId: cancelRequest.orderId,
        message: `Cancellation approved for Order #${cancelRequest.orderId.toString().slice(-4)}`,
        orderDetails: cancelRequest.orderDetails,
      });
      await notification.save();

      if (global.io) {
        global.io.emit("cancellationApprovedNotification", {
          _id: notification._id,
          brandId: cancelRequest.brandId,
          orderId: cancelRequest.orderId,
          message: notification.message,
          orderDetails: notification.orderDetails,
          createdAt: notification.createdAt,
        });
      }
    } catch (notificationError) {
      console.error("❌ Error creating approval notification:", notificationError);
    }

    res.json({
      success: true,
      message: "Cancellation request approved successfully",
      cancelRequest,
    });
  } catch (error) {
    console.error("Error approving cancellation request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve cancellation request",
    });
  }
};

// Reject cancellation request
module.exports.rejectCancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes, processedBy } = req.body;

    const cancelRequest = await CancelRequest.findById(requestId);
    if (!cancelRequest) {
      return res.status(404).json({
        success: false,
        error: "Cancellation request not found",
      });
    }

    if (cancelRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Cancellation request has already been processed",
      });
    }

    // Update the cancellation request
    cancelRequest.status = "rejected";
    cancelRequest.processedAt = new Date();
    cancelRequest.processedBy = processedBy || "Admin";
    cancelRequest.adminNotes = adminNotes;

    await cancelRequest.save();

    // Create notification for user (if needed)
    try {
      const notification = new Notification({
        brandId: cancelRequest.brandId,
        orderId: cancelRequest.orderId,
        message: `Cancellation rejected for Order #${cancelRequest.orderId.toString().slice(-4)}`,
        orderDetails: cancelRequest.orderDetails,
      });
      await notification.save();

      if (global.io) {
        global.io.emit("cancellationRejectedNotification", {
          _id: notification._id,
          brandId: cancelRequest.brandId,
          orderId: cancelRequest.orderId,
          message: notification.message,
          orderDetails: notification.orderDetails,
          createdAt: notification.createdAt,
        });
      }
    } catch (notificationError) {
      console.error("❌ Error creating rejection notification:", notificationError);
    }

    res.json({
      success: true,
      message: "Cancellation request rejected successfully",
      cancelRequest,
    });
  } catch (error) {
    console.error("Error rejecting cancellation request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reject cancellation request",
    });
  }
};
