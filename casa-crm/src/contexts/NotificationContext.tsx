import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle, AlertCircle, Info, X, Bell } from "lucide-react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

// Helper hook for easier usage
export const useNotification = () => {
  const { addNotification } = useNotifications();

  const showNotification = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    title?: string
  ) => {
    addNotification({
      title:
        title ||
        (type === "success"
          ? "Success"
          : type === "error"
          ? "Error"
          : type === "warning"
          ? "Warning"
          : "Info"),
      message,
      type,
    });
  };

  return { showNotification };
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 3000, // Reduced from 5000ms to 3000ms
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, clearAll }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationStyles = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300";
      case "error":
        return "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30 text-red-300";
      case "warning":
        return "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300";
      case "info":
        return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300";
      default:
        return "bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-300";
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.slice(0, 3).map(
        (
          notification,
          index // Only show max 3 notifications at once
        ) => (
          <div
            key={notification.id}
            className={`glass rounded-2xl p-4 border backdrop-blur-xl shadow-2xl animate-slide-up hover-thunder ${getNotificationStyles(
              notification.type
            )}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-white/80">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 w-6 h-6 glass rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 hover-thunder"
              >
                <X className="w-4 h-4 text-white/60 hover:text-white" />
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
