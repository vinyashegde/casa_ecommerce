import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  TrendingUp,
  UserPlus,
  BarChart3,
  ShoppingCart,
  Upload,
  Percent,
} from "lucide-react";

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Package, label: "Products" },
    { path: "/orders", icon: ShoppingCart, label: "Orders" },
    { path: "/offers", icon: Percent, label: "Offers" },
    // { path: "/shopify-import", icon: Upload, label: "Import" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-dark border-t border-white/10 backdrop-blur-xl z-50">
      <div className="flex justify-around items-center py-3 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center py-3 px-4 rounded-xl transition-all duration-300 group relative ${
                isActive
                  ? "text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25 scale-105"
                  : "bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/20"
              }`}
            >
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse"></div>
              )}
              <Icon
                className={`w-6 h-6 mb-2 transition-all duration-300 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
              />
              <span className="text-sm font-medium transition-all duration-300">
                {label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
