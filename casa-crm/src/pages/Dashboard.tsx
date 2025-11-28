import React from "react";
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { useBrand } from "../contexts/BrandContext";

const Dashboard = () => {
  const { brand } = useBrand();

  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231",
      change: "+12%",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Active Customers",
      value: "2,431",
      change: "+5%",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Products Sold",
      value: "1,543",
      change: "+18%",
      icon: Package,
      color: "bg-purple-500",
    },
    {
      title: "Conversion Rate",
      value: "3.2%",
      change: "+2%",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

  const recentActivity = [
    {
      action: "New order from Sarah Johnson",
      time: "5 min ago",
      status: "success",
    },
    {
      action: "Brand registration approved",
      time: "12 min ago",
      status: "info",
    },
    {
      action: "Low stock alert: Nike Shoes",
      time: "30 min ago",
      status: "warning",
    },
    {
      action: "Payment received $1,250",
      time: "1 hour ago",
      status: "success",
    },
  ];

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Good Morning, {brand?.name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-slate-300">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Featured Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
        <h2 className="text-xl font-bold mb-2">Weekly Performance</h2>
        <p className="text-blue-100 mb-4">Your sales are up 23% this week!</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold">$12,450</span>
            <p className="text-blue-100 text-sm">This week</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center text-green-500 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">
              {stat.value}
            </h3>
            <p className="text-slate-600 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div
                className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === "success"
                    ? "bg-green-400"
                    : activity.status === "warning"
                    ? "bg-yellow-400"
                    : "bg-blue-400"
                }`}
              ></div>
              <div className="flex-1">
                <p className="text-slate-800 font-medium">{activity.action}</p>
                <p className="text-slate-500 text-sm">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
