

import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Search, 
  Package, 
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ArrowUpDown
} from "lucide-react";
import Pagination from "./Pagination";

interface Product {
  _id: string;
  name: string;
  quantity: number;
  size: string;
  price: number;
  originalPrice: number;
  discountedPrice: number;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    display_name: string;
    email: string;
    phone: string;
  };
  brandId: {
    _id: string;
    name: string;
  };
  products: Product[];
  deliveryStatus: string;
  paymentStatus: string;
  totalAmount: number;
  address: string;
  createdAt: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  sr_order_id?: number;
  status?: string;
  refundStatus?: string;
}

// Status configuration matching the Order component
const deliveryStatuses = [
  "Pending",
  "Accepted", 
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Cancellation Requested"
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Pending":
      return <Clock className="w-4 h-4 text-amber-400" />;
    case "Accepted":
      return <CheckCircle className="w-4 h-4 text-blue-400" />;
    case "Processing":
      return <Package className="w-4 h-4 text-indigo-400" />;
    case "Shipped":
      return <Truck className="w-4 h-4 text-purple-400" />;
    case "Out for Delivery":
      return <Truck className="w-4 h-4 text-cyan-400" />;
    case "Delivered":
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case "Cancelled":
    case "Cancellation Requested":
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "Accepted":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "Processing":
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    case "Shipped":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "Out for Delivery":
      return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
    case "Delivered":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "Cancelled":
    case "Cancellation Requested":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
};

const OrdersDashboardTab: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [allBrands, setAllBrands] = useState<{_id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search and Filter states
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [orderIdFilter, setOrderIdFilter] = useState<string>("");
  const [trackingIdFilter, setTrackingIdFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  
  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/orders`);
      console.log("Orders API response:", response.data);
      
      // The getAllOrders endpoint returns orders directly
      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData);
      console.log(`Loaded ${ordersData.length} orders for dashboard`);
    } catch (e) {
      console.error("Failed to fetch all orders", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      // Get all brands without pagination by setting a high limit
      const response = await axios.get(`${apiUrl}/brands?limit=1000`);
      console.log("Brands API response:", response.data);
      
      // The API returns the brands array directly
      const brands = Array.isArray(response.data) ? response.data : [];
      setAllBrands(brands);
      console.log(`Loaded ${brands.length} brands for filtering`);
    } catch (e) {
      console.error("Failed to fetch brands", e);
      setAllBrands([]);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    fetchBrands();
  }, []);

  // Helper function to format date
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper function to get product summary
  const getProductSummary = (products: Product[]) => {
    if (!products || products.length === 0) return "No products";
    
    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.discountedPrice * p.quantity), 0);
    
    if (products.length === 1) {
      return `${products[0].name} (Qty: ${products[0].quantity}) - ₹${totalValue.toFixed(2)}`;
    } else {
      return `${products.length} products (${totalItems} items) - ₹${totalValue.toFixed(2)}`;
    }
  };

  // Filter and sort orders
  const getFilteredAndSortedOrders = () => {
    let filteredOrders = [...orders];

    // Apply filters
    if (brandFilter) {
      filteredOrders = filteredOrders.filter(order => 
        order.brandId?.name?.toLowerCase().includes(brandFilter.toLowerCase())
      );
    }

    if (orderIdFilter) {
      filteredOrders = filteredOrders.filter(order => 
        order._id.toLowerCase().includes(orderIdFilter.toLowerCase())
      );
    }

    if (trackingIdFilter) {
      filteredOrders = filteredOrders.filter(order => 
        order.sr_order_id?.toString().includes(trackingIdFilter)
      );
    }

    if (statusFilter) {
      filteredOrders = filteredOrders.filter(order => 
        order.deliveryStatus === statusFilter
      );
    }

    if (monthFilter) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const filterDate = new Date(monthFilter);
        return orderDate.getMonth() === filterDate.getMonth() && 
               orderDate.getFullYear() === filterDate.getFullYear();
      });
    }

    // Apply sorting
    filteredOrders.sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "orderId":
          aValue = a._id;
          bValue = b._id;
          break;
        case "customerName":
          aValue = a.user?.display_name || "";
          bValue = b.user?.display_name || "";
          break;
        case "brandName":
          aValue = a.brandId?.name || "";
          bValue = b.brandId?.name || "";
          break;
        case "totalAmount":
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case "deliveryStatus":
          aValue = a.deliveryStatus;
          bValue = b.deliveryStatus;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filteredOrders;
  };

  const filteredAndSortedOrders = getFilteredAndSortedOrders();
  
  // Calculate pagination
  const totalItems = filteredAndSortedOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [brandFilter, orderIdFilter, trackingIdFilter, statusFilter, monthFilter]);

  if (loading) {
    return (
      <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <ShoppingCart className="w-8 h-8 text-indigo-400" />
        </div>
        <p className="text-white/70 text-lg">Loading orders dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Search & Filter Orders</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Brand Name</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">All Brands</option>
              {allBrands.map((brand) => (
                <option key={brand._id} value={brand.name} className="bg-slate-800 text-white">
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Order ID Filter */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Order ID</label>
            <input
              type="text"
              placeholder="Search by order ID..."
              value={orderIdFilter}
              onChange={(e) => setOrderIdFilter(e.target.value)}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Tracking ID Filter */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Tracking ID</label>
            <input
              type="text"
              placeholder="Search by tracking ID..."
              value={trackingIdFilter}
              onChange={(e) => setTrackingIdFilter(e.target.value)}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">All Statuses</option>
              {deliveryStatuses.map((status) => (
                <option key={status} value={status} className="bg-slate-800 text-white">
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Month</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(brandFilter || orderIdFilter || trackingIdFilter || statusFilter || monthFilter) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setBrandFilter("");
                setOrderIdFilter("");
                setTrackingIdFilter("");
                setStatusFilter("");
                setMonthFilter("");
              }}
              className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all duration-300"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="glass rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20">
              <tr>
                <th 
                  className="px-6 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort("orderId")}
                >
                  <div className="flex items-center gap-2">
                    Order ID
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center gap-2">
                    Date & Time
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort("customerName")}
                >
                  <div className="flex items-center gap-2">
                    Customer
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort("brandName")}
                >
                  <div className="flex items-center gap-2">
                    Brand Name
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                  Products & Value
                </th>
                <th 
                  className="px-6 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort("deliveryStatus")}
                >
                  <div className="flex items-center gap-2">
                    Order Status
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedOrders.map((order, index) => (
                <tr
                  key={order._id}
                  className="hover:bg-white/5 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Order ID */}
                  <td className="px-6 py-5">
                    <div className="font-mono text-sm text-indigo-300">
                      {order._id}
                    </div>
                    {order.sr_order_id && (
                      <div className="text-xs text-white/60">
                        Tracking: {order.sr_order_id}
                      </div>
                    )}
                  </td>

                  {/* Date & Time */}
                  <td className="px-6 py-5">
                    <div className="text-white/80 text-sm">
                      {formatDate(order.createdAt)}
                    </div>
                  </td>

                  {/* Customer Info */}
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                        <span className="font-semibold text-xs text-indigo-300">
                          {order.user?.display_name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">
                          {order.user?.display_name || "Unknown"}
                        </p>
                        <p className="text-white/60 text-xs">{order.user?.phone}</p>
                        <p className="text-white/60 text-xs">{order.user?.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Brand Name */}
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30">
                      {order.brandId?.name || "Unknown Brand"}
                    </span>
                  </td>

                  {/* Products & Value */}
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <p className="text-white text-sm">
                        {getProductSummary(order.products)}
                      </p>
                      <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                        Total: ₹{order.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </td>

                  {/* Order Status */}
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.deliveryStatus)}
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium border transition-all duration-300 ${getStatusColor(
                          order.deliveryStatus
                        )}`}
                      >
                        {order.deliveryStatus}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedOrders.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-lg mb-2">No orders found</p>
            <p className="text-white/50 text-sm">
              {filteredAndSortedOrders.length === 0 && orders.length > 0
                ? "Try adjusting your search filters"
                : "No orders available in the system"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Summary Stats */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-white/60 text-sm">Showing Results</p>
            <p className="text-2xl font-bold text-white">{filteredAndSortedOrders.length}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm">Total Orders</p>
            <p className="text-2xl font-bold text-white">{orders.length}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm">Total Brands</p>
            <p className="text-2xl font-bold text-white">{allBrands.length}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm">Active Filters</p>
            <p className="text-2xl font-bold text-white">
              {[brandFilter, orderIdFilter, trackingIdFilter, statusFilter, monthFilter].filter(f => f).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersDashboardTab;