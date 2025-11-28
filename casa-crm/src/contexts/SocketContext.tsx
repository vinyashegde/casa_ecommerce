import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { API_CONFIG } from "../config/api";
import { useBrand } from "./BrandContext";
import { soundService } from "../utils/soundService";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: OrderNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  deleteAllNotifications: () => void;
  fetchNotifications: () => Promise<void>;
  // Sound control methods
  playNotificationSound: () => Promise<void>;
  soundConfig: {
    enabled: boolean;
    volume: number;
  };
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
}

interface OrderNotification {
  _id: string;
  brandId: string;
  orderId: string;
  message: string;
  orderDetails: {
    customerName: string;
    orderAmount: number;
    orderDate: string;
  };
  status: "read" | "unread";
  createdAt: string;
  type?: "order" | "cancellation" | "approval" | "rejection" | "refund_request" | "refund_approved" | "refund_rejected";
  cancelRequestDetails?: {
    reason?: string;
    productName?: string;
    requestedAt: string;
  };
  refundRequestDetails?: {
    reason?: string;
    requestedAt: string;
  };
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { brand } = useBrand();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    console.log("🔍 SocketContext useEffect triggered, brand:", brand);
    if (!brand?._id) {
      console.log("⚠️ No brand logged in, skipping socket connection");
      return;
    }
    console.log("✅ Brand found, setting up socket connection for brand:", brand._id);

    // Connect to Socket.IO server
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
    const socketUrl = apiUrl.replace("/api", "");
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("🔌 Connected to Socket.IO server for brand:", brand._id);
      console.log("🔌 Socket ID:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Disconnected from Socket.IO server");
      setIsConnected(false);
    });

    // Debug: Listen for all events to see what's being received
    newSocket.onAny((eventName, ...args) => {
      console.log("🔍 Socket event received:", eventName, args);
    });

    // Test socket connection by emitting a test event
    newSocket.emit("test", { message: "Frontend connected", brandId: brand._id });

    // Listen for generic payment updates to refresh views if needed
    newSocket.on("paymentUpdated", (payload: any) => {
      console.log("📢 paymentUpdated event:", payload);
      // No-op: Pages that need realtime can subscribe separately
    });

    newSocket.on("payoutUpdated", (payload: any) => {
      console.log("📢 payoutUpdated event:", payload);
    });

    newSocket.on("newOrderNotification", (notification: OrderNotification) => {
      console.log("📢 Received new order notification:", notification);
      // Only add notification if it belongs to the current brand
      if (notification.brandId === brand._id) {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Play notification sound for new orders
        soundService.playOrderNotificationSound().catch((error) => {
          console.warn("Failed to play order notification sound:", error);
        });
      }
    });

    newSocket.on(
      "cancellationRequestNotification",
      (notification: OrderNotification) => {
        console.log(
          "📢 Received cancellation request notification:",
          notification
        );
        // Only add notification if it belongs to the current brand
        if (notification.brandId === brand._id) {
          const enhancedNotification = {
            ...notification,
            type: "cancellation" as const,
          };
          setNotifications((prev) => [enhancedNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Play notification sound for cancellation requests
          soundService.playOrderNotificationSound().catch((error) => {
            console.warn(
              "Failed to play cancellation notification sound:",
              error
            );
          });
        }
      }
    );

    newSocket.on(
      "cancellationApprovedNotification",
      (notification: OrderNotification) => {
        console.log(
          "📢 Received cancellation approved notification:",
          notification
        );
        // Only add notification if it belongs to the current brand
        if (notification.brandId === brand._id) {
          const enhancedNotification = {
            ...notification,
            type: "approval" as const,
          };
          setNotifications((prev) => [enhancedNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      }
    );

    newSocket.on(
      "cancellationRejectedNotification",
      (notification: OrderNotification) => {
        console.log(
          "📢 Received cancellation rejected notification:",
          notification
        );
        // Only add notification if it belongs to the current brand
        if (notification.brandId === brand._id) {
          const enhancedNotification = {
            ...notification,
            type: "rejection" as const,
          };
          setNotifications((prev) => [enhancedNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      }
    );

    newSocket.on(
      "refundRequestNotification",
      (notification: OrderNotification) => {
        console.log(
          "📢 Received refund request notification:",
          notification
        );
        console.log("🔍 Current brand ID:", brand._id);
        console.log("🔍 Notification brand ID:", notification.brandId);
        console.log("🔍 Brand IDs match:", notification.brandId === brand._id);
        
        // Only add notification if it belongs to the current brand
        if (notification.brandId === brand._id) {
          console.log("✅ Adding refund notification to state");
          const enhancedNotification = {
            ...notification,
            type: "refund_request" as const,
            refundRequestDetails: {
              reason: (notification as any).refundReason || "Delayed Order Refund",
              requestedAt: notification.createdAt,
            },
          };
          setNotifications((prev) => [enhancedNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Play notification sound for refund requests
          soundService.playOrderNotificationSound().catch((error) => {
            console.warn(
              "Failed to play refund notification sound:",
              error
            );
          });
        } else {
          console.log("❌ Refund notification not for current brand, ignoring");
        }
      }
    );

    newSocket.on(
      "refundApprovedNotification",
      (notification: OrderNotification) => {
        console.log(
          "📢 Received refund approved notification:",
          notification
        );
        // Only add notification if it belongs to the current brand
        if (notification.brandId === brand._id) {
          const enhancedNotification = {
            ...notification,
            type: "refund_approved" as const,
          };
          setNotifications((prev) => [enhancedNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      }
    );

    newSocket.on(
      "refundRejectedNotification",
      (notification: OrderNotification) => {
        console.log(
          "📢 Received refund rejected notification:",
          notification
        );
        // Only add notification if it belongs to the current brand
        if (notification.brandId === brand._id) {
          const enhancedNotification = {
            ...notification,
            type: "refund_rejected" as const,
          };
          setNotifications((prev) => [enhancedNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      }
    );

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [brand?._id]);

  const markAsRead = async (notificationId: string) => {
    if (!brand?._id) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ brandId: brand._id }),
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, status: "read" as const }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!brand?._id) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/notifications/mark-all-read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ brandId: brand._id }),
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            status: "read" as const,
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!brand?._id) return;

    console.log("🔍 SocketContext deleteNotification called:", {
      notificationId,
      brandId: brand._id,
      apiUrl: `${API_CONFIG.BASE_URL}/notifications/${notificationId}`,
    });

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ brandId: brand._id }),
        }
      );

      if (response.ok) {
        // Find the notification to check if it was unread before deleting
        const deletedNotification = notifications.find(
          (n) => n._id === notificationId
        );

        // Optimistically update the UI immediately
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId)
        );

        // Decrease unread count if the deleted notification was unread
        if (deletedNotification?.status === "unread") {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        console.error("Failed to delete notification:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!brand?._id) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/notifications/clear-all`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ brandId: brand._id }),
        }
      );

      if (response.ok) {
        console.log("✅ Bulk delete API succeeded");
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.warn("⚠️ Bulk delete API failed:", response.status, response.statusText);
        // Clear local state anyway for immediate UI feedback
        setNotifications([]);
        setUnreadCount(0);
        throw new Error(`API failed with status ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Error in deleteAllNotifications:", error);
      // Still clear local state for immediate UI feedback
      setNotifications([]);
      setUnreadCount(0);
      throw error; // Re-throw so Sidebar can handle the fallback
    }
  };

  const fetchNotifications = async () => {
    if (!brand?._id) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/notifications/${brand._id}`
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);

        // Count unread notifications
        const unread =
          data.notifications?.filter(
            (n: OrderNotification) => n.status === "unread"
          ).length || 0;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Sound control methods
  const playNotificationSound = async () => {
    await soundService.playOrderNotificationSound();
  };

  const soundConfig = soundService.getConfig();

  const setSoundEnabled = (enabled: boolean) => {
    soundService.setEnabled(enabled);
  };

  const setSoundVolume = (volume: number) => {
    soundService.setVolume(volume);
  };

  // Fetch notifications when brand changes
  useEffect(() => {
    if (brand?._id) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [brand?._id]);

  const value: SocketContextType = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
    playNotificationSound,
    soundConfig,
    setSoundEnabled,
    setSoundVolume,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
