const express = require("express");
const router = express.Router();
const {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");

// GET all notifications for a brand
router.get("/:brandId", getAllNotifications);

// GET unread notifications count for a brand
router.get("/:brandId/unread-count", getUnreadCount);

// MARK notification as read
router.put("/:id/read", markAsRead);

// MARK all notifications as read for a brand
router.put("/mark-all-read", markAllAsRead);

// DELETE notification
router.delete("/:id", deleteNotification);

// DELETE all notifications for a brand
router.delete("/clear-all", deleteAllNotifications);

module.exports = router;
