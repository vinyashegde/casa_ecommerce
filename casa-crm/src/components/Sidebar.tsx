"use client";

import { cn } from "../lib/utils";
import { Link, useLocation } from "react-router-dom";
import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Menu, 
  X, 
  Package, 
  ShoppingCart, 
  Percent, 
  LogOut, 
  Bell,
  Volume2,
  VolumeX,
  Settings
} from "lucide-react";
import { useBrand } from "../contexts/BrandContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useSocket } from "../contexts/SocketContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SoundSettings from "./SoundSettings";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-md border-b border-purple-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hamburger Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* CRM Title */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-white font-bold text-xl">CRM</h1>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Pass mobile menu state to children */}
      <div className="relative">
        {React.Children.map(children, child => 
          React.isValidElement(child) 
            ? React.cloneElement(child, { isMobileMenuOpen, setIsMobileMenuOpen } as any)
            : child
        )}
      </div>
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div> & {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isMobileMenuOpen, setIsMobileMenuOpen, ...motionProps } = props;
  return (
    <>
      <DesktopSidebar {...motionProps} />
      <MobileSidebar 
        {...(motionProps as React.ComponentProps<"div">)} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  
  // Don't render on mobile at all
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (isMobile) {
    return null; // Don't render anything on mobile
  }
  
  return (
    <motion.div
      className={cn(
        "h-screen px-4 py-6 hidden md:flex md:flex-col bg-gradient-to-b from-slate-900/98 via-purple-900/20 to-slate-900/98 backdrop-blur-2xl border-r border-purple-500/20 shadow-2xl flex-shrink-0 relative fixed left-0 top-0 z-40",
        "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none",
        "max-md:hidden", // Extra mobile hiding
        className
      )}
      animate={{
        width: animate ? (open ? "280px" : "88px") : "280px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  ...props
}: React.ComponentProps<"div"> & {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <>
      {/* Mobile Sidebar - Only show when hamburger menu is open */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed left-0 top-16 h-[calc(100vh-4rem)] w-52 z-50 md:hidden bg-gradient-to-b from-slate-900/98 via-purple-900/20 to-slate-900/98 backdrop-blur-2xl border-r border-purple-500/20 shadow-2xl",
              "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none",
              className
            )}
            {...props}
          >
            <div className="flex flex-col h-full overflow-hidden relative z-10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: () => void;
}) => {
  const { open, animate } = useSidebar();
  const location = useLocation();
  const isActive = location.pathname === link.href;
  
  // Check if we're on mobile to always show text
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const shouldShowText = open || isMobile; // Always show text on mobile
  
  return (
    <Link
      to={link.href}
      onClick={onClick}
      className={cn(
        "flex items-center rounded-xl transition-all duration-300 relative overflow-hidden group/sidebar",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:to-transparent before:transition-all before:duration-300",
        isActive 
          ? "bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-purple-500/25 before:from-white/10 before:to-transparent" 
          : "text-gray-300 hover:bg-gradient-to-r hover:from-white/5 hover:to-purple-500/10 hover:text-white hover:shadow-md",
        shouldShowText ? "justify-start gap-4 py-4 px-4" : "justify-center py-3 px-3",
        className
      )}
      {...props}
    >
      <div className={cn(
        "transition-all duration-300 flex-shrink-0",
        isActive ? "text-white drop-shadow-sm" : "text-gray-400 group-hover/sidebar:text-white"
      )}>
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (shouldShowText ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (shouldShowText ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="text-sm font-medium group-hover/sidebar:translate-x-1 transition-transform duration-300 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
      
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-md"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      {/* Tooltip for collapsed state */}
      {!open && (
        <motion.div
          className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
        >
          {link.label}
        </motion.div>
      )}
    </Link>
  );
};

// Main Sidebar Component that integrates with your CRM
const SidebarContent = ({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: { 
  isMobileMenuOpen?: boolean; 
  setIsMobileMenuOpen?: React.Dispatch<React.SetStateAction<boolean>>; 
} = {}) => {
  const navigate = useNavigate();
  const { brand, logoutBrand } = useBrand();
  const { notifications, clearAll } = useNotifications();
  const { 
    unreadCount, 
    soundConfig, 
    notifications: orderNotifications,
    markAsRead,
    deleteAllNotifications
  } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const { open } = useSidebar();

  // Navigation items from your original TopBar
  const links = [
    {
      label: "Products",
      href: "/",
      icon: <Package size={20} />,
    },
    {
      label: "Orders", 
      href: "/orders",
      icon: <ShoppingCart size={20} />,
    },
    {
      label: "Offers",
      href: "/offers", 
      icon: <Percent size={20} />,
    }
  ];

  const handleLogout = () => {
    try {
      localStorage.clear();
      delete axios.defaults.headers.common["Authorization"];
      logoutBrand();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const totalUnreadCount = notifications.length + unreadCount;
  const allNotifications = [...notifications, ...(orderNotifications || [])];

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const shouldShowText = open || isMobile; // Always show text on mobile

  return (
    <>
      {/* Desktop Sidebar Content */}
      <SidebarBody 
        className="flex flex-col h-full"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      >
        {/* Brand Logo/Title */}
        <div className="flex flex-col items-center space-y-3 py-4 border-b border-white/10 mb-6">
          <motion.div 
            className={cn(
              "font-bold transition-all duration-300 flex items-center justify-center",
              shouldShowText ? "text-xl text-left w-full" : "text-lg text-center"
            )}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {shouldShowText ? (
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                CASA CRM
              </span>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                C
              </div>
            )}
          </motion.div>
          <motion.div 
            className="text-xs text-gray-400 uppercase tracking-wider font-medium text-center"
            animate={{ 
              opacity: shouldShowText ? 1 : 0,
              height: shouldShowText ? "auto" : 0,
              marginTop: shouldShowText ? 8 : 0
            }}
            transition={{ duration: 0.2, delay: shouldShowText ? 0.1 : 0 }}
          >
            {shouldShowText && "Brand Management"}
          </motion.div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col space-y-1 flex-1">
          {links.map((link, idx) => (
            <SidebarLink 
              key={idx} 
              link={link} 
              onClick={() => {
                // Close mobile menu when link is clicked on mobile
                if (setIsMobileMenuOpen && isMobileMenuOpen) {
                  setIsMobileMenuOpen(false);
                }
              }}
            />
          ))}
        </div>

        {/* Bottom Section - User & Notifications */}
        <div className="mt-auto pt-4 border-t border-white/10 space-y-1">
          {/* Sound Settings */}
          <motion.div 
            className={cn(
              "flex items-center rounded-xl text-gray-300 hover:bg-gradient-to-r hover:from-white/5 hover:to-purple-500/10 hover:text-white cursor-pointer transition-all duration-300 group relative",
              shouldShowText ? "gap-4 p-4" : "gap-0 p-3 justify-center"
            )}
            onClick={() => setShowSoundSettings(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative flex-shrink-0">
              {soundConfig.enabled ? (
                <Volume2 size={20} className="text-green-400 group-hover:text-green-300 transition-colors duration-300" />
              ) : (
                <VolumeX size={20} className="text-red-400 group-hover:text-red-300 transition-colors duration-300" />
              )}
            </div>
            <motion.span
              animate={{
                display: shouldShowText ? "inline-block" : "none",
                opacity: shouldShowText ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium whitespace-pre"
            >
              Sound Settings
            </motion.span>
            
            {/* Tooltip for collapsed state */}
            {!shouldShowText && (
              <motion.div
                className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ opacity: 1, x: 0 }}
              >
                Sound Settings
              </motion.div>
            )}
          </motion.div>

          {/* Notifications */}
          <motion.div 
            className={cn(
              "flex items-center rounded-xl text-gray-300 hover:bg-gradient-to-r hover:from-white/5 hover:to-purple-500/10 hover:text-white cursor-pointer transition-all duration-300 group relative",
              shouldShowText ? "gap-4 p-4" : "gap-0 p-3 justify-center"
            )}
            onClick={() => setShowNotifications(!showNotifications)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative flex-shrink-0">
              <Bell size={20} className="group-hover:text-purple-300 transition-colors duration-300" />
              {totalUnreadCount > 0 && (
                <motion.span 
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  {totalUnreadCount}
                </motion.span>
              )}
            </div>
            <motion.span
              animate={{
                display: shouldShowText ? "inline-block" : "none",
                opacity: shouldShowText ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium whitespace-pre"
            >
              Notifications
            </motion.span>
            
            {/* Tooltip for collapsed state */}
            {!shouldShowText && (
              <motion.div
                className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ opacity: 1, x: 0 }}
              >
                Notifications
                {totalUnreadCount > 0 && ` (${totalUnreadCount})`}
              </motion.div>
            )}
          </motion.div>

          {/* User Profile */}
          <motion.div 
            className={cn(
              "flex items-center rounded-xl text-gray-300 hover:bg-gradient-to-r hover:from-white/5 hover:to-purple-500/10 hover:text-white transition-all duration-300 group relative",
              shouldShowText ? "gap-4 p-4" : "gap-0 p-3 justify-center"
            )}
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {brand?.name?.charAt(0) || "U"}
            </div>
            <motion.span
              animate={{
                display: shouldShowText ? "inline-block" : "none",
                opacity: shouldShowText ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium whitespace-pre truncate"
            >
              {brand?.name || "Brand User"}
            </motion.span>
            
            {/* Tooltip for collapsed state */}
            {!shouldShowText && (
              <motion.div
                className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ opacity: 1, x: 0 }}
              >
                {brand?.name || "Brand User"}
              </motion.div>
            )}
          </motion.div>

          {/* Logout */}
          <motion.div 
            className={cn(
              "flex items-center rounded-xl text-gray-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 hover:text-red-300 cursor-pointer transition-all duration-300 group relative",
              shouldShowText ? "gap-4 p-4" : "gap-0 p-3 justify-center"
            )}
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={20} className="flex-shrink-0 group-hover:text-red-400 transition-colors duration-300" />
            <motion.span
              animate={{
                display: shouldShowText ? "inline-block" : "none",
                opacity: shouldShowText ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium whitespace-pre"
            >
              Sign Out
            </motion.span>
            
            {/* Tooltip for collapsed state */}
            {!shouldShowText && (
              <motion.div
                className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ opacity: 1, x: 0 }}
              >
                Sign Out
              </motion.div>
            )}
          </motion.div>
        </div>
      </SidebarBody>

      {/* Notifications Panel - Centered Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {(() => {
                // No notifications at all
                if (allNotifications.length === 0 && totalUnreadCount === 0) {
                  return (
                    <div className="text-center py-12">
                      <Bell className="w-16 h-16 text-white/60 mx-auto mb-4" />
                      <p className="text-white/80 text-lg">No new notifications</p>
                      <p className="text-white/50 text-sm mt-2">You're all caught up!</p>
                    </div>
                  );
                }
                
                // Count shows notifications but array is empty (loading state)
                if (allNotifications.length === 0 && totalUnreadCount > 0) {
                  return (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-white/80">Loading notifications...</p>
                      <p className="text-xs text-white/50 mt-2">({totalUnreadCount} unread)</p>
                    </div>
                  );
                }
                
                // Display notifications
                return (
                  <div className="space-y-4">
                    {allNotifications.map((notification, index) => {
                      // Handle different notification types
                      const isOrderNotification = 'orderId' in notification;
                      const notificationId = 'id' in notification ? notification.id : `${index}`;
                      const timestamp = 'timestamp' in notification ? notification.timestamp : 'createdAt' in notification ? notification.createdAt : null;
                      
                      return (
                        <div
                          key={notificationId}
                          className="p-4 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-white font-medium">{notification.message}</p>
                              <p className="text-white/60 text-xs mt-2">
                                {timestamp && typeof timestamp === 'string' 
                                  ? new Date(timestamp).toLocaleString() 
                                  : "Just now"
                                }
                              </p>
                            </div>
                            {isOrderNotification && 'orderId' in notification && (
                              <button
                                onClick={() => {
                                  if ('id' in notification && notification.id && typeof notification.id === 'string') {
                                    markAsRead(notification.id);
                                  }
                                  setShowNotifications(false);
                                  navigate(`/orders?highlight=${notification.orderId}`);
                                }}
                                className="ml-3 px-3 py-1 text-xs bg-blue-500/30 text-blue-200 rounded-full hover:bg-blue-500/50 transition-colors border border-blue-500/40"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            
            {allNotifications.length > 0 && (
              <div className="p-6 border-t border-white/20">
                <button
                  onClick={async () => {
                    try {
                      // Close the panel immediately
                      setShowNotifications(false);
                      
                      // Clear regular notifications
                      if (notifications.length > 0) {
                        clearAll();
                      }
                      
                      // Clear order notifications with fallback strategy
                      if (orderNotifications && orderNotifications.length > 0) {
                        try {
                          // Try the bulk delete API first
                          await deleteAllNotifications();
                        } catch (bulkError) {
                          // Fallback: Mark each notification as read individually
                          for (let i = 0; i < orderNotifications.length; i++) {
                            const notification = orderNotifications[i];
                            if (notification._id) {
                              try {
                                await markAsRead(notification._id);
                                
                                // Small delay to avoid overwhelming the server
                                if (i < orderNotifications.length - 1) {
                                  await new Promise(resolve => setTimeout(resolve, 50));
                                }
                              } catch (err) {
                                // Silently continue with next notification
                              }
                            }
                          }
                        }
                      }
                      
                    } catch (error) {
                      console.error("Error during notification clearing:", error);
                    }
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-500/50 to-pink-500/50 hover:from-red-500/70 hover:to-pink-500/70 text-white rounded-lg transition-all duration-200 font-medium border border-white/20 hover:border-white/30 backdrop-blur-sm"
                >
                  Clear All Notifications
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Sound Settings Modal */}
      {showSoundSettings && (
        <SoundSettings onClose={() => setShowSoundSettings(false)} />
      )}
    </>
  );
};

const SidebarLayout = () => {
  return (
    <Sidebar>
      <SidebarContent />
    </Sidebar>
  );
};

export default SidebarLayout;