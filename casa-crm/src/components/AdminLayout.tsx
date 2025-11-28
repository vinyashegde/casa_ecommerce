import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  LogOut,
  BarChart3,
  Shield,
  Image,
  Folder,
  IndianRupee,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const navigation = [
  {
      name: "Brands",
      href: "/admin/brands",
      icon: Building2,
      current: location.pathname === "/admin/brands",
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: Folder,
      current: location.pathname === "/admin/categories",
    },
    {
      name: "Image Management",
      href: "/admin/images",
      icon: Image,
      current: location.pathname === "/admin/images",
    },
    {
      name: "Payments",
      href: "/admin/payments",
      icon: IndianRupee,
      current:
        location.pathname === "/admin/payments" ||
        location.pathname.startsWith("/admin/payments"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 glass shadow-2xl border-r border-white/20 backdrop-blur-xl">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-r from-indigo-500 to-purple-500">
            <div className="flex items-center space-x-3">
              <Shield className="h-10 w-10 text-white" />
              <span className="text-2xl font-bold text-white">Admin Panel</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                    item.current
                      ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg"
                      : "text-white/70 hover:bg-white/10 hover:text-white hover:scale-105"
                  }`}
                >
                  <Icon className="h-5 w-5 mr-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-10 w-10 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-white/60 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white rounded-2xl transition-all duration-300 hover:scale-105"
            >
              <LogOut className="h-5 w-5 mr-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">{children}</div>
    </div>
  );
};

export default AdminLayout;
