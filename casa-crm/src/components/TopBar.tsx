import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  User,
  LogOut,
  Bell,
  X,
  ShoppingCart,
  Clock,
  Trash2,
  Volume2,
  VolumeX,
  Package,
  Percent,
  XCircle,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { useBrand } from "../contexts/BrandContext";
import { IndianRupee } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import { useSocket } from "../contexts/SocketContext";
import SoundSettings from "./SoundSettings";
import BottomNavigation from "./BottomNavigation";

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brand, logoutBrand } = useBrand();
  const { notifications, clearAll, removeNotification } = useNotifications();
  const {
    notifications: orderNotifications,
    unreadCount,
    markAsRead,
    deleteNotification: deleteOrderNotification,
    deleteAllNotifications: deleteAllOrderNotifications,
    soundConfig,
  } = useSocket();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Navigation items
  const navItems = [
    {
      path: "/",
      icon: Package,
      label: "Products",
      color: "from-blue-500 to-cyan-500",
    },
    {
      path: "/orders",
      icon: ShoppingCart,
      label: "Orders",
      color: "from-green-500 to-emerald-500",
    },
    {
      path: "/offers",
      icon: Percent,
      label: "Offers",
      color: "from-purple-500 to-pink-500",
    },
  ];

  // Combine both notification types
  const allNotifications = [...notifications, ...orderNotifications];
  const totalUnreadCount = notifications.length + unreadCount;

  const handleNotificationClick = () => {
    setShowNotificationPanel(!showNotificationPanel);
    setShowProfileDropdown(false); // Close profile dropdown when opening notifications
  };

  const handleProfileClick = () => {
    console.log(
      "👤 Profile button clicked, current state:",
      showProfileDropdown
    );
    setShowProfileDropdown(!showProfileDropdown);
    setShowNotificationPanel(false); // Close notification panel when opening profile
    console.log("👤 Profile dropdown should be:", !showProfileDropdown);
  };

  const handleLogout = () => {
    console.log("🔴 Sign Out button clicked");
    try {
      console.log("🚪 Starting logout process...");
      console.log("🚪 Current localStorage before clear:", localStorage);
      console.log("🚪 Current brand before clear:", brand);

      // Clear all data immediately
      localStorage.clear();
      console.log("✅ localStorage cleared");

      // Clear authorization header
      delete axios.defaults.headers.common["Authorization"];
      console.log("✅ Authorization header cleared");

      // Clear context
      logoutBrand();
      console.log("✅ Brand context cleared");

      // Close dropdown
      setShowProfileDropdown(false);
      console.log("✅ Dropdown closed");

      // Force redirect to login page
      console.log("🔄 Redirecting to login page...");
      window.location.href = "/login";
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Force redirect even if there's an error
      window.location.href = "/login";
    }
  };

  // Brand balance (shown only for brand area, not admin)
  const [balance, setBalance] = useState<{
    totalRevenue: number;
    totalPaid: number;
    pendingAmount: number;
  } | null>(null);
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
    if (brand?._id) {
      axios
        .get(`${apiUrl}/payments/brand/${brand._id}/balance`)
        .then((res) => setBalance(res.data.data))
        .catch(() => {});
    }
  }, [brand?._id]);

  // Refresh brand balance on payout updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!brand?._id || !socket) return;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
    const refresh = () => {
      axios
        .get(`${apiUrl}/payments/brand/${brand._id}/balance`)
        .then((res) => setBalance(res.data.data))
        .catch(() => {});
    };
    socket.on("payoutUpdated", refresh);
    return () => {
      socket.off("payoutUpdated", refresh);
    };
  }, [brand?._id, socket]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if dropdown is open and click is outside the profile area
      if (
        showProfileDropdown &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        console.log("🔄 Clicking outside profile area, closing dropdown");
        setShowProfileDropdown(false);
      }
    };

    // Add event listener with a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Debug profile dropdown state
  useEffect(() => {
    console.log("🔍 Profile dropdown state changed:", showProfileDropdown);
  }, [showProfileDropdown]);

  const handleClearAll = () => {
    // Clear all regular notifications
    clearAll();
    // Delete all order notifications for this brand
    deleteAllOrderNotifications();
    setShowNotificationPanel(false);
  };

  const handleOrderNotificationClick = (
    notificationId: string,
    orderId: string
  ) => {
    try {
      markAsRead(notificationId);
      // Close notification panel
      setShowNotificationPanel(false);
      // Navigate to CRM orders page with order highlighting using React Router
      navigate(`/orders?highlight=${orderId}`);
    } catch (error) {
      console.error("Error handling notification click:", error);
      // Fallback: just navigate without highlighting
      navigate("/orders");
    }
  };

  const handleDeleteNotification = (
    notificationId: string,
    isOrderNotification: boolean
  ) => {
    console.log("🗑️ Deleting notification:", {
      notificationId,
      isOrderNotification,
      type: isOrderNotification ? "Order Notification" : "Regular Notification",
      allNotifications: allNotifications.length,
      orderNotifications: orderNotifications.length,
      regularNotifications: notifications.length,
    });

    try {
      if (isOrderNotification) {
        // For order notifications, delete them permanently
        console.log("Deleting order notification:", notificationId);
        deleteOrderNotification(notificationId);
      } else {
        // For regular notifications, remove them from the context
        console.log("Deleting regular notification:", notificationId);
        removeNotification(notificationId);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };


  return (
    <div className="sticky top-0 z-50 glass-dark border-b border-white/10 backdrop-blur-xl">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        {/* Responsive Layout */}
        <div className="flex items-center justify-between">
          {/* Left Side - Brand Info */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Brand Logo and Name */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {brand?.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl sm:rounded-2xl object-cover ring-2 ring-white/20"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-white">
                  {brand?.name || "Casa CRM"}
                </h1>
                <p className="text-xs text-white/60">Dashboard</p>
              </div>
            </div>
          </div>

          {/* Center - Navigation Buttons (Hidden on small screens) */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
            {navItems.map(({ path, icon: Icon, label, color }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center space-x-2 lg:space-x-3 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl transition-all duration-300 group relative ${
                    isActive
                      ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
                      : "bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/20"
                  }`}
                >
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                  <span className="text-sm lg:text-base font-medium hidden lg:inline">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            {/* Removed compact pending balance chip per request */}
            {/* Sound Settings Button (Hidden on small screens) */}
            <div className="relative group hidden sm:block">
              <button
                onClick={() => setShowSoundSettings(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 glass rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
                title="Sound Settings"
              >
                {soundConfig.enabled ? (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                ) : (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                )}
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative group">
              <button
                onClick={handleNotificationClick}
                className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 glass rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                {totalUnreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <span className="text-white text-xs font-bold">
                      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={handleProfileClick}
                className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 glass rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation (Visible only on small screens, hidden when BottomNavigation is shown) */}
        <div className="sm:hidden mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-center space-x-2">
            {navItems.map(({ path, icon: Icon, label, color }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex flex-col items-center space-y-2 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
                      : "bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/20"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Only shown on very small screens (hidden when TopBar mobile nav is shown) */}
      <div className="hidden sm:block md:hidden">
        <BottomNavigation />
      </div>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className="absolute right-2 sm:right-4 lg:right-6 top-16 sm:top-18 lg:top-20 w-80 sm:w-96 glass rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 z-50 backdrop-blur-xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-white text-xl">Notifications</h3>
                {totalUnreadCount > 0 && (
                  <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {/* {allNotifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-white/70 hover:text-white transition-colors duration-300 hover:underline px-3 py-1 rounded-lg hover:bg-white/10"
                  >
                    Clear all
                  </button>
                )} */}
                <button
                  onClick={() => setShowNotificationPanel(false)}
                  className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
                >
                  <X className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
              {allNotifications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Bell className="w-10 h-10 text-white/50" />
                  </div>
                  <h3 className="text-white/80 text-xl font-bold mb-3">
                    No notifications
                  </h3>
                  <p className="text-white/50 text-base">
                    You're all caught up! 🎉
                  </p>
                </div>
              ) : (
                allNotifications.slice(0, 5).map((notification, index) => {
                  const isOrderNotification = "orderId" in notification;
                  return (
                    <div
                      key={
                        isOrderNotification ? notification._id : notification.id
                      }
                      className={`group p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer relative ${
                        isOrderNotification
                          ? (notification as any).type === "cancellation"
                            ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30 hover:from-red-500/30 hover:to-pink-500/30"
                            : (notification as any).type === "approval"
                            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30"
                            : (notification as any).type === "rejection"
                            ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30 hover:from-orange-500/30 hover:to-red-500/30"
                            : (notification as any).type === "refund_request"
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30"
                            : (notification as any).type === "refund_approved"
                            ? "bg-gradient-to-r from-teal-500/20 to-green-500/20 border-teal-500/30 hover:from-teal-500/30 hover:to-green-500/30"
                            : (notification as any).type === "refund_rejected"
                            ? "bg-gradient-to-r from-rose-500/20 to-red-500/20 border-rose-500/30 hover:from-rose-500/30 hover:to-red-500/30"
                            : "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-indigo-500/30"
                          : notification.type === "success"
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30"
                          : notification.type === "error"
                          ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30 hover:from-red-500/30 hover:to-red-500/30"
                          : notification.type === "warning"
                          ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 hover:from-amber-500/30 hover:to-red-500/30"
                          : "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30"
                      }`}
                      onClick={() => {
                        const orderNotification = notification as any;
                        if (isOrderNotification && orderNotification.orderId) {
                          handleOrderNotificationClick(
                            orderNotification._id || orderNotification.id,
                            orderNotification.orderId
                          );
                        }
                      }}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="relative flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {isOrderNotification ? (
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                                (notification as any).type === "cancellation"
                                  ? "bg-gradient-to-r from-red-500 to-pink-500"
                                  : (notification as any).type === "approval"
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                  : (notification as any).type === "rejection"
                                  ? "bg-gradient-to-r from-orange-500 to-red-500"
                                  : (notification as any).type === "refund_request"
                                  ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                                  : (notification as any).type === "refund_approved"
                                  ? "bg-gradient-to-r from-teal-500 to-green-500"
                                  : (notification as any).type === "refund_rejected"
                                  ? "bg-gradient-to-r from-rose-500 to-red-500"
                                  : "bg-gradient-to-r from-purple-500 to-indigo-500"
                              }`}
                            >
                              {(notification as any).type === "cancellation" ? (
                                <XCircle className="w-5 h-5 text-white" />
                              ) : (notification as any).type === "approval" ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (notification as any).type === "rejection" ? (
                                <XCircle className="w-5 h-5 text-white" />
                              ) : (notification as any).type === "refund_request" ? (
                                <RotateCcw className="w-5 h-5 text-white" />
                              ) : (notification as any).type === "refund_approved" ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (notification as any).type === "refund_rejected" ? (
                                <XCircle className="w-5 h-5 text-white" />
                              ) : (
                                <ShoppingCart className="w-5 h-5 text-white" />
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-base font-bold text-white">
                              {isOrderNotification
                                ? (notification as any).type === "cancellation"
                                  ? "❌ Cancellation Request"
                                  : (notification as any).type === "approval"
                                  ? "✅ Cancellation Approved"
                                  : (notification as any).type === "rejection"
                                  ? "❌ Cancellation Rejected"
                                  : (notification as any).type === "refund_request"
                                  ? "🔄 Refund Request"
                                  : (notification as any).type === "refund_approved"
                                  ? "✅ Refund Approved"
                                  : (notification as any).type === "refund_rejected"
                                  ? "❌ Refund Rejected"
                                  : "🛒 New Order"
                                : notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(
                                  isOrderNotification
                                    ? notification._id
                                    : notification.id,
                                  isOrderNotification
                                );
                              }}
                              className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group bg-red-500/20 hover:bg-red-500/40"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3 h-3 text-red-400 group-hover:text-red-300" />
                            </button>
                          </div>
                          <p className="text-sm text-white/90 leading-relaxed mb-3">
                            {notification.message}
                          </p>
                          {isOrderNotification && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-4 text-xs">
                                <div className="flex items-center space-x-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      (notification as any).type ===
                                      "cancellation"
                                        ? "bg-red-400"
                                        : (notification as any).type ===
                                          "approval"
                                        ? "bg-green-400"
                                        : (notification as any).type ===
                                          "rejection"
                                        ? "bg-orange-400"
                                        : "bg-purple-400"
                                    }`}
                                  ></div>
                                  <span
                                    className={`font-medium ${
                                      (notification as any).type ===
                                      "cancellation"
                                        ? "text-red-200"
                                        : (notification as any).type ===
                                          "approval"
                                        ? "text-green-200"
                                        : (notification as any).type ===
                                          "rejection"
                                        ? "text-orange-200"
                                        : (notification as any).type ===
                                          "refund_request"
                                        ? "text-cyan-200"
                                        : (notification as any).type ===
                                          "refund_approved"
                                        ? "text-teal-200"
                                        : (notification as any).type ===
                                          "refund_rejected"
                                        ? "text-rose-200"
                                        : "text-purple-200"
                                    }`}
                                  >
                                    {notification.orderDetails?.customerName}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      (notification as any).type ===
                                      "cancellation"
                                        ? "bg-pink-400"
                                        : (notification as any).type ===
                                          "approval"
                                        ? "bg-emerald-400"
                                        : (notification as any).type ===
                                          "rejection"
                                        ? "bg-red-400"
                                        : (notification as any).type ===
                                          "refund_request"
                                        ? "bg-blue-400"
                                        : (notification as any).type ===
                                          "refund_approved"
                                        ? "bg-green-400"
                                        : (notification as any).type ===
                                          "refund_rejected"
                                        ? "bg-red-400"
                                        : "bg-indigo-400"
                                    }`}
                                  ></div>
                                  <span
                                    className={`font-medium ${
                                      (notification as any).type ===
                                      "cancellation"
                                        ? "text-pink-200"
                                        : (notification as any).type ===
                                          "approval"
                                        ? "text-emerald-200"
                                        : (notification as any).type ===
                                          "rejection"
                                        ? "text-red-200"
                                        : (notification as any).type ===
                                          "refund_request"
                                        ? "text-blue-200"
                                        : (notification as any).type ===
                                          "refund_approved"
                                        ? "text-green-200"
                                        : (notification as any).type ===
                                          "refund_rejected"
                                        ? "text-red-200"
                                        : "text-indigo-200"
                                    }`}
                                  >
                                    {(notification as any).type ===
                                      "cancellation" &&
                                    (notification as any).cancelRequestDetails
                                      ?.reason
                                      ? `Reason: ${
                                          (notification as any)
                                            .cancelRequestDetails.reason
                                        }`
                                      : (notification as any).type ===
                                        "approval"
                                      ? "Cancellation Approved"
                                      : (notification as any).type ===
                                        "rejection"
                                      ? "Cancellation Rejected"
                                      : (notification as any).type ===
                                        "refund_request" &&
                                      (notification as any).refundRequestDetails
                                        ?.reason
                                      ? `Reason: ${
                                          (notification as any)
                                            .refundRequestDetails.reason
                                        }`
                                      : (notification as any).type ===
                                        "refund_approved"
                                      ? "Refund Approved"
                                      : (notification as any).type ===
                                        "refund_rejected"
                                      ? "Refund Rejected"
                                      : `₹${notification.orderDetails?.orderAmount?.toLocaleString()}`}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-white/60">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(
                                    notification.createdAt
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {allNotifications.length > 5 && (
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <p className="text-center text-white/60 text-sm font-medium">
                    Showing 5 of {allNotifications.length} notifications
                  </p>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Dropdown */}
      {showProfileDropdown && (
        <div
          className="absolute right-2 sm:right-4 lg:right-6 top-16 sm:top-18 lg:top-20 w-64 sm:w-72 glass rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 z-50 animate-fade-in"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🛡️ Click inside dropdown - preventing close");
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🛡️ Mouse down inside dropdown - preventing close");
          }}
        >
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              {brand?.logo_url ? (
                <div className="relative">
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/20"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
              ) : (
                <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-white text-lg">
                  {brand?.name || "User"}
                </h3>
                <p className="text-sm text-white/70">
                  {brand?.email || "user@example.com"}
                </p>
              </div>
            </div>

            {balance && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="glass rounded-xl px-3 py-2 border border-white/10">
                  <div className="text-xs text-white/60">Pending Payment</div>
                  <div className="text-white font-semibold flex items-center">
                    <IndianRupee className="w-4 h-4 text-amber-300 mr-1" />
                    {balance.pendingAmount.toLocaleString()}
                  </div>
                </div>
                <div className="glass rounded-xl px-3 py-2 border border-white/10">
                  <div className="text-xs text-white/60">
                    Total Paid by Admin
                  </div>
                  <div className="text-white font-semibold flex items-center">
                    <IndianRupee className="w-4 h-4 text-green-300 mr-1" />
                    {balance.totalPaid.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-white/20 pt-4 space-y-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowProfileDropdown(false);
                  navigate("/profile");
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-white/80 hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105 group"
              >
                <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Profile</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowProfileDropdown(false);
                  localStorage.clear();
                  delete axios.defaults.headers.common["Authorization"];
                  logoutBrand();
                  setTimeout(() => {
                    window.location.href = "/login";
                  }, 100);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all duration-300 hover:scale-105 group"
              >
                <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sound Settings Modal */}
      {showSoundSettings && (
        <SoundSettings onClose={() => setShowSoundSettings(false)} />
      )}
    </div>
  );
};

export default TopBar;
