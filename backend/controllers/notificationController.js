const Notification = require("../models/notification");

// GET all notifications for a specific brand
const getAllNotifications = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const notifications = await Notification.find({ brandId })
      .populate("orderId", "user products totalAmount createdAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET unread notifications count for a specific brand
const getUnreadCount = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const count = await Notification.countDocuments({
      brandId,
      status: "unread",
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// MARK notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandId } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, brandId },
      { status: "read" },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// MARK all notifications as read for a specific brand
const markAllAsRead = async (req, res) => {
  try {
    const { brandId } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    await Notification.updateMany(
      { brandId, status: "unread" },
      { status: "read" }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandId } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      brandId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE all notifications for a specific brand
const deleteAllNotifications = async (req, res) => {
  try {
    const { brandId } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const result = await Notification.deleteMany({ brandId });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications successfully`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};
