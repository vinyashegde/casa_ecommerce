import React, { useEffect, useState } from "react";
import { useBrand } from "../contexts/BrandContext";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  XCircle,
  Search,
  ArrowUpDown,
  X,
  User,
} from "lucide-react";
import CancelRequestsTab from "../components/CancelRequestsTab";
import RefundRequestsTab from "../components/RefundRequestsTab";
import Pagination from "../components/Pagination";

interface User {
  email: string;
  phone: string;
  display_name: string;
}

interface Order {
  user: User;
  product_name: string;
  quantity: number;
  size: string;
  order_date: string;
  delivery_status: string;
  payment_status: string;
  order_id: string;
}

const deliveryOptions = [
  "Pending",
  "Accepted",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
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
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
};

const Order: React.FC = () => {
  const { brand } = useBrand();
  const [searchParams] = useSearchParams();
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "cancel-requests" | "refund-requests"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Enhanced filtering and search states
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchTrackingId, setSearchTrackingId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Products modal state
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [selectedOrderProducts, setSelectedOrderProducts] = useState<any>(null);

  // Reset pagination when switching tabs
  const handleTabChange = (tab: "all" | "active" | "cancel-requests" | "refund-requests") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle order highlighting from URL parameter
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId) {
      setHighlightedOrderId(highlightId);

      // Scroll to the highlighted order after a short delay to ensure it's rendered
      setTimeout(() => {
        const highlightedElement = document.querySelector(
          `[data-order-id="${highlightId}"]`
        );
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);

      // Remove highlight after 5 seconds
      const highlightTimeout = setTimeout(() => {
        setHighlightedOrderId(null);
      }, 5000);

      // Remove highlight when user clicks anywhere on the page
      const handleClick = () => {
        setHighlightedOrderId(null);
        clearTimeout(highlightTimeout);
        document.removeEventListener("click", handleClick);
      };

      document.addEventListener("click", handleClick);

      // Cleanup function
      return () => {
        clearTimeout(highlightTimeout);
        document.removeEventListener("click", handleClick);
      };
    }
  }, [searchParams]);

  // Handle notification clicks to switch to cancel requests tab
  useEffect(() => {
    const handleNotificationClick = (event: CustomEvent) => {
      const { type } = event.detail;
      if (type === "cancellation") {
        setActiveTab("cancel-requests");
      }
    };

    window.addEventListener(
      "notification-click",
      handleNotificationClick as EventListener
    );
    return () => {
      window.removeEventListener(
        "notification-click",
        handleNotificationClick as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const fetchSales = async () => {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const fullUrl = `${apiUrl}/brands/sales/${brand?._id}`;

      console.log("🔍 Fetching sales data...", {
        brand: brand,
        brandId: brand?._id,
        apiUrl: apiUrl,
        fullUrl: fullUrl,
        hasBrand: !!brand,
        brandName: brand?.name,
      });

      if (!brand) {
        console.warn("⚠️ No brand found, skipping sales fetch");
        setLoading(false);
        return;
      }

      if (!brand._id) {
        console.warn("⚠️ Brand has no _id, skipping sales fetch");
        setLoading(false);
        return;
      }

      try {
        console.log("🚀 Making API call to:", fullUrl);
        const res = await axios.get(fullUrl);

        console.log("📊 Sales API Response:", {
          status: res.status,
          data: res.data,
          success: res.data.success,
          salesData: res.data.data,
          salesLength: res.data.data?.length,
          isArray: Array.isArray(res.data.data),
        });

        if (res.data.success && Array.isArray(res.data.data)) {
          setSales(res.data.data);
          console.log(
            "✅ Sales data set successfully:",
            res.data.data.length,
            "orders"
          );
        } else {
          console.warn("⚠️ Invalid response format:", res.data);
          setSales([]);
        }
      } catch (err) {
        setSales([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [brand]);

  // Fetch orders for the enhanced "All Orders" tab (brand-specific if brand is logged in)
  useEffect(() => {
    const fetchAllOrders = async () => {
      if (activeTab === "all") {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
          
          // If a brand is logged in, fetch only their orders; otherwise fetch all orders
          let ordersRes;
          if (brand && brand._id) {
            ordersRes = await axios.get(`${apiUrl}/orders?brandId=${brand._id}`);
          } else {
            ordersRes = await axios.get(`${apiUrl}/orders`);
          }
          
          setAllOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
          setAllOrders([]);
        }
      }
    };

    fetchAllOrders();
  }, [activeTab, brand]);

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

  const handleDeliveryChange = async (
    index: number,
    newStatus: string,
    order_id: string
  ) => {
    console.log(index, newStatus, order_id);
    const updatedSales = [...(sales || [])];
    updatedSales[index].delivery_status = newStatus;
    setSales(updatedSales);

    // Optional: Persist change to backend
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const res = await axios.put(`${apiUrl}/orders/update/${order_id}`, {
        deliveryStatus: newStatus,
      });
      if (res.data.success) {
        alert(res.data.updated.deliveryStatus);
      }
    } catch (err) {
      console.error("Failed to update delivery status:", err);
    }
  };

  // Handle delivery status change for all orders (platform-wide)
  const handleAllOrdersDeliveryChange = async (
    index: number,
    newStatus: string,
    order_id: string
  ) => {
    console.log("Updating all orders status:", index, newStatus, order_id);
    
    // Update local state
    const updatedOrders = [...allOrders];
    if (updatedOrders[index]) {
      updatedOrders[index].deliveryStatus = newStatus;
      setAllOrders(updatedOrders);
    }

    // Persist change to backend
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const res = await axios.put(`${apiUrl}/orders/update/${order_id}`, {
        deliveryStatus: newStatus,
      });
      
      if (res.data.success) {
        // Show success notification
        console.log("Order status updated successfully:", res.data.updated.deliveryStatus);
        
        // Optional: Show a brief success message
        const successMsg = document.createElement('div');
        successMsg.innerHTML = `✅ Status updated to: ${newStatus}`;
        successMsg.className = 'fixed top-4 right-4 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg border border-green-500/30 z-50 animate-pulse';
        document.body.appendChild(successMsg);
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to update delivery status:", err);
      // Revert the change on error
      const revertedOrders = [...allOrders];
      if (revertedOrders[index]) {
        // Find the original status and revert it
        setAllOrders(revertedOrders);
      }
      alert("Failed to update order status. Please try again.");
    }
  };

  // Handle View Products modal
  const handleViewProducts = (order: any) => {
    setSelectedOrderProducts(order);
    setIsProductsModalOpen(true);
  };

  const handleCloseProductsModal = () => {
    setIsProductsModalOpen(false);
    setSelectedOrderProducts(null);
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-10xl mx-auto animate-fade-in">
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShoppingCart className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-white/70 text-lg">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!sales || sales.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-10xl mx-auto animate-fade-in">
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-white/70 text-lg mb-4">No orders found.</p>

          {/* Debug Information */}
          {/* <div className="mt-6 p-4 bg-black/20 rounded-lg text-left text-sm">
            <h3 className="text-white font-semibold mb-2">
              Debug Information:
            </h3>
            <div className="space-y-1 text-white/70">
              <p>Brand: {brand?.name || "Not loaded"}</p>
              <p>Brand ID: {brand?._id || "Not available"}</p>
              <p>
                API URL:{" "}
                {import.meta.env.VITE_API_URL || "http://localhost:5002/api"}
              </p>
              <p>Sales Array: {sales ? "Loaded" : "Not loaded"}</p>
              <p>Sales Length: {sales?.length || 0}</p>
            </div>
            <button
              onClick={() => {
                const apiUrl =
                  import.meta.env.VITE_API_URL || "http://localhost:5002/api";
                const fullUrl = `${apiUrl}/brands/sales/${brand?._id}`;
                console.log("🔍 Manual API test:", fullUrl);
                window.open(fullUrl, "_blank");
              }}
              className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Test API Call
            </button>
          </div> */}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-10xl mx-auto animate-fade-in">
      {/* Notification Highlight Banner */}
      {highlightedOrderId && (
        <div className="mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 animate-pulse">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 bg-yellow-500/30 rounded-full flex items-center justify-center">
              <span className="text-yellow-300 text-lg">📢</span>
            </div>
            <div className="text-center">
              <p className="text-yellow-300 font-semibold text-lg">
                Order Highlighted from Notification
              </p>
              <p className="text-yellow-400 text-sm">
                Order ID: {highlightedOrderId} • Click anywhere to dismiss
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10 relative">
        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm mb-3">
          Orders
        </h1>

        {/* Decorative underline */}
        <div className="mx-auto w-24 h-1 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full"></div>

        {/* Subtitle */}
        <p className="mt-4 text-gray-500 text-lg max-w-md mx-auto">
          Track and manage all your customer orders in one place.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {[
          {
            key: "all",
            label: "All Orders",
            icon: <ShoppingCart className="w-5 h-5" />,
          },
          {
            key: "active",
            label: "Active Orders",
            icon: <Package className="w-5 h-5" />,
          },
          {
            key: "cancel-requests",
            label: "Cancel Requests",
            icon: <XCircle className="w-5 h-5" />,
          },
          {
            key: "refund-requests",
            label: "Refund Orders",
            icon: <CheckCircle className="w-5 h-5" />,
          },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() =>
              handleTabChange(key as "all" | "active" | "cancel-requests" | "refund-requests")
            }
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              activeTab === key
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                : "glass text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass rounded-2xl p-6 border border-white/10 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">
                {activeTab === "all" ? "Total Orders" : "Brand Orders"}
              </p>
              <p className="text-3xl font-bold text-white">
                {activeTab === "all" ? allOrders?.length || 0 : sales?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Pending</p>
              <p className="text-3xl font-bold text-amber-400">
                {activeTab === "all" 
                  ? allOrders?.filter((order) => order.deliveryStatus === "Pending").length || 0
                  : sales?.filter((order) => order.delivery_status === "Pending").length || 0
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">
                {activeTab === "all" ? "Total Orders" : "Delivered"}
              </p>
              <p className="text-3xl font-bold text-green-400">
                {activeTab === "all" 
                  ? allOrders?.length || 0
                  : sales?.filter((order) => order.delivery_status === "Delivered").length || 0
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "cancel-requests" ? (
        <CancelRequestsTab />
      ) : activeTab === "refund-requests" ? (
        <RefundRequestsTab />
      ) : (
        <>
          {/* Enhanced Search and Filters for All Orders Tab */}
          {activeTab === "all" && (
            <div className="mb-8">
              {/* Search and Filter Controls */}
              <div className="glass rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Order ID Search */}
                  <div className="space-y-2">
                    <label className="block text-white/70 text-sm font-medium">Order ID</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={searchOrderId}
                        onChange={(e) => setSearchOrderId(e.target.value)}
                        placeholder="Search order ID..."
                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  {/* Tracking ID Search */}
                  <div className="space-y-2">
                    <label className="block text-white/70 text-sm font-medium">Tracking ID</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={searchTrackingId}
                        onChange={(e) => setSearchTrackingId(e.target.value)}
                        placeholder="Search tracking ID..."
                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="block text-white/70 text-sm font-medium">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="" className="bg-slate-800">All Status</option>
                      {deliveryOptions.map((status) => (
                        <option key={status} value={status} className="bg-slate-800">
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div className="space-y-2">
                    <label className="block text-white/70 text-sm font-medium">Month</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Filter Summary */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(searchOrderId || searchTrackingId || selectedStatus || selectedMonth) && (
                    <div className="text-white/60 text-sm">
                      Active filters: 
                      {searchOrderId && <span className="ml-2 px-2 py-1 bg-indigo-500/20 rounded-lg">Order: {searchOrderId}</span>}
                      {searchTrackingId && <span className="ml-2 px-2 py-1 bg-purple-500/20 rounded-lg">Tracking: {searchTrackingId}</span>}
                      {selectedStatus && <span className="ml-2 px-2 py-1 bg-orange-500/20 rounded-lg">Status: {selectedStatus}</span>}
                      {selectedMonth && <span className="ml-2 px-2 py-1 bg-pink-500/20 rounded-lg">Month: {selectedMonth}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="glass rounded-2xl shadow-2xl border border-white/20 overflow-hidden bg-gradient-to-b from-slate-900/40 to-slate-800/20 backdrop-blur-lg">
            {/* Mobile Card View (hidden on desktop) */}
            <div className="block lg:hidden">
              {loading ? (
                <div className="p-8 text-center text-white/70">
                  <Clock className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <p>Loading orders...</p>
                </div>
              ) : (() => {
                let filteredData;
                if (activeTab === "all") {
                  filteredData = allOrders.filter((order) => {
                    if (searchOrderId && !order._id.toLowerCase().includes(searchOrderId.toLowerCase())) return false;
                    if (searchTrackingId && !order.sr_order_id?.toString().includes(searchTrackingId)) return false;
                    if (selectedStatus && order.deliveryStatus !== selectedStatus) return false;
                    if (selectedMonth) {
                      const orderDate = new Date(order.createdAt);
                      const filterDate = new Date(selectedMonth);
                      if (orderDate.getMonth() !== filterDate.getMonth() || 
                          orderDate.getFullYear() !== filterDate.getFullYear()) return false;
                    }
                    return true;
                  });
                } else if (activeTab === "active") {
                  filteredData = sales?.filter((order) => !["Delivered", "Cancelled"].includes(order.delivery_status)) || [];
                } else {
                  filteredData = sales || [];
                }
                
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

                return paginatedData.length === 0 ? (
                  <div className="p-8 text-center text-white/60">
                    <Package className="w-12 h-12 mx-auto mb-4 text-white/30" />
                    <p className="text-lg font-medium mb-2">No orders found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {paginatedData.map((order, index) => {
                      const isAllOrdersFormat = activeTab === "all";
                      const orderId = isAllOrdersFormat ? order._id : order.order_id;
                      const customerName = isAllOrdersFormat ? order.user?.display_name : order.user?.display_name;
                      const productName = isAllOrdersFormat ? (order.products?.[0]?.name || "Multiple Products") : order.product_name;
                      const orderDate = isAllOrdersFormat ? order.createdAt : order.order_date;
                      const deliveryStatus = isAllOrdersFormat ? order.deliveryStatus : order.delivery_status;
                      const totalAmount = isAllOrdersFormat ? order.totalAmount : undefined;
                      const trackingId = isAllOrdersFormat ? order.sr_order_id : undefined;
                      
                      return (
                        <div key={orderId || index} className="p-4 hover:bg-white/5 transition-all duration-300">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-slate-600/30 to-slate-500/30 text-white/80 text-xs font-semibold rounded-full border border-slate-500/30">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </span>
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"></div>
                              <span className="text-white font-mono text-sm font-medium">#{orderId?.slice(-8) || "N/A"}</span>
                              {trackingId && <span className="text-xs text-indigo-300">Track: {trackingId}</span>}
                            </div>
                            <select
                              value={deliveryStatus}
                              onChange={(e) => {
                                if (activeTab === "all") {
                                  const actualOrder = paginatedData[index];
                                  if (actualOrder) {
                                    const allOrdersIndex = allOrders.findIndex(o => o._id === actualOrder._id);
                                    handleAllOrdersDeliveryChange(allOrdersIndex, e.target.value, orderId);
                                  }
                                } else {
                                  handleDeliveryChange(index, e.target.value, orderId);
                                }
                              }}
                              className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold border-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${getStatusColor(deliveryStatus)}`}
                            >
                              {deliveryOptions.map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                  className="bg-slate-800 text-white"
                                >
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white/60 text-sm">Customer:</span>
                              <span className="text-white font-medium">{customerName || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white/60 text-sm">Product:</span>
                              <span className="text-white">{productName}</span>
                            </div>
                            {totalAmount && (
                              <div className="flex items-center gap-2">
                                <span className="text-white/60 text-sm">Amount:</span>
                                <span className="text-green-400 font-semibold">₹{totalAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-white/60 text-sm">Date:</span>
                              <span className="text-white/80">{formatDate(orderDate)}</span>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => handleViewProducts(order)}
                                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 text-xs font-medium rounded-lg border border-indigo-500/30 hover:bg-indigo-500/30 hover:text-white transition-all duration-200 shadow-sm"
                              >
                                <Package className="w-3 h-3 mr-1.5" />
                                View Products
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-gradient-to-r from-slate-800/30 to-slate-700/20 border-b border-white/10">
                  <tr className="divide-x divide-white/5">
                    {/* Index Column */}
                    <th className="w-[80px] px-4 py-5 text-center text-xs font-semibold text-white/95 uppercase tracking-wider">
                      #
                    </th>
                    {activeTab === "all" && (
                      <>
                        <th className="w-[140px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                          <button 
                            onClick={() => {
                              setSortField('_id');
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            }}
                            className="flex items-center space-x-1 hover:text-white transition-colors"
                          >
                            <span>Order ID</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="w-[160px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                          <button 
                            onClick={() => {
                              setSortField('createdAt');
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            }}
                            className="flex items-center space-x-1 hover:text-white transition-colors"
                          >
                            <span>Date & Time</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                      </>
                    )}
                    <th className="w-[180px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                      Product
                    </th>
                    {activeTab !== "all" && (
                      <th className="w-[120px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                        Contact
                      </th>
                    )}
                    <th className="w-[120px] px-6 py-5 text-center text-xs font-semibold text-white/95 uppercase tracking-wider">
                      Status
                    </th>
                    {activeTab !== "all" && (
                      <th className="w-[140px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                        Order Date
                      </th>
                    )}
                    <th className="w-[120px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="w-[120px] px-6 py-5 text-center text-xs font-semibold text-white/95 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-900/10">
                  {loading ? (
                    <tr>
                      <td colSpan={activeTab === "all" ? 7 : 8} className="px-6 py-16 text-center bg-slate-900/30">
                        <div className="flex flex-col items-center space-y-3">
                          <Clock className="w-8 h-8 text-indigo-400 animate-spin" />
                          <p className="text-white/80 font-medium">Loading orders...</p>
                          <p className="text-white/60 text-sm">Please wait while we fetch the data</p>
                        </div>
                      </td>
                    </tr>
                  ) : (() => {
                    let filteredSales;
                    
                    // Handle different data sources based on active tab
                    if (activeTab === "all") {
                      // Use allOrders and apply enhanced filtering
                      filteredSales = allOrders.filter((order) => {
                        // Order ID filter
                        if (searchOrderId && !order._id.toLowerCase().includes(searchOrderId.toLowerCase())) {
                          return false;
                        }
                        
                        // Tracking ID filter
                        if (searchTrackingId && !order.sr_order_id?.toString().includes(searchTrackingId)) {
                          return false;
                        }
                        

                        
                        // Status filter
                        if (selectedStatus && order.deliveryStatus !== selectedStatus) {
                          return false;
                        }
                        
                        // Month filter
                        if (selectedMonth) {
                          const orderDate = new Date(order.createdAt);
                          const filterDate = new Date(selectedMonth);
                          if (orderDate.getMonth() !== filterDate.getMonth() || 
                              orderDate.getFullYear() !== filterDate.getFullYear()) {
                            return false;
                          }
                        }
                        
                        return true;
                      });
                      
                      // Apply sorting
                      filteredSales.sort((a, b) => {
                        let aValue, bValue;
                        
                        switch (sortField) {
                          case '_id':
                            aValue = a._id;
                            bValue = b._id;
                            break;
                          case 'createdAt':
                            aValue = new Date(a.createdAt);
                            bValue = new Date(b.createdAt);
                            break;
                          default:
                            aValue = new Date(a.createdAt);
                            bValue = new Date(b.createdAt);
                        }
                        
                        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                        return 0;
                      });
                    } else if (activeTab === "active") {
                      // Use brand-specific sales data for active orders
                      filteredSales =
                        sales?.filter(
                          (order) =>
                            !["Delivered", "Cancelled"].includes(
                              order.delivery_status
                            )
                        ) || [];
                    } else {
                      // Default: use brand-specific sales data
                      filteredSales = sales || [];
                    }
                    
                    // Calculate pagination
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedSales = filteredSales.slice(startIndex, endIndex);
                    
                    if (filteredSales.length === 0) {
                      const totalOrders = activeTab === "all" ? allOrders.length : (sales?.length || 0);
                      return (
                        <tr>
                          <td colSpan={activeTab === "all" ? 7 : 8} className="px-6 py-16 text-center bg-slate-900/20">
                            {totalOrders === 0 ? (
                              <>
                                <Package className="w-8 h-8 mx-auto mb-2 text-white/30" />
                                <p className="text-white/70">No orders found</p>
                              </>
                            ) : (
                              <>
                                <Search className="w-8 h-8 mx-auto mb-2 text-white/30" />
                                <p className="mb-2 text-white/70">No results match your filters</p>
                                {activeTab === "all" && (
                                  <button 
                                    onClick={() => {
                                      setSearchOrderId("");
                                      setSearchTrackingId("");
                                      setSelectedStatus("");
                                      setSelectedMonth("");
                                      setCurrentPage(1);
                                    }}
                                    className="px-3 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors"
                                  >
                                    Clear Filters
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    }
                    
                    return paginatedSales.map((order, index) => {
                      // Handle different data formats between sales (brand-specific) and allOrders (platform-wide)
                      const isAllOrdersFormat = activeTab === "all";
                      const orderId = isAllOrdersFormat ? order._id : order.order_id;
                      const customerName = isAllOrdersFormat ? order.user?.display_name : order.user?.display_name;
                      const customerEmail = isAllOrdersFormat ? order.user?.email : order.user?.email;
                      const customerPhone = isAllOrdersFormat ? order.user?.phone : order.user?.phone;
                      const productName = isAllOrdersFormat ? 
                        (order.products?.[0]?.name || "Multiple Products") : 
                        order.product_name;
                      const orderDate = isAllOrdersFormat ? order.createdAt : order.order_date;
                      const deliveryStatus = isAllOrdersFormat ? order.deliveryStatus : order.delivery_status;
                      const paymentStatus = isAllOrdersFormat ? order.paymentStatus : order.payment_status;
                      const quantity = isAllOrdersFormat ? 
                        order.products?.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0) : 
                        order.quantity;
                      const size = isAllOrdersFormat ? 
                        order.products?.map((p: any) => p.size).join(", ") || "N/A" : 
                        order.size;
                      const totalAmount = isAllOrdersFormat ? order.totalAmount : undefined;
                      const trackingId = isAllOrdersFormat ? order.sr_order_id : undefined;
                      
                      return (
                        <tr 
                          key={orderId || index} 
                          data-order-id={orderId}
                          className={`hover:bg-white/3 transition-all duration-300 animate-slide-up border-b border-white/5 divide-x divide-white/5 group ${
                            highlightedOrderId &&
                            orderId === highlightedOrderId
                              ? "bg-yellow-500/30 border-l-4 border-yellow-400 animate-pulse shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-400/50"
                              : ""
                          }`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                        {/* Index Column */}
                        <td className="px-4 py-5 text-center bg-slate-900/30">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-slate-600/30 to-slate-500/30 text-white/80 text-sm font-semibold rounded-full border border-slate-500/30">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </span>
                        </td>

                        {/* Order ID Column - Only for "all" tab */}
                        {activeTab === "all" && (
                          <td className="px-6 py-5 bg-slate-900/20">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 shadow-sm shadow-indigo-400/20"></div>
                              <div className="space-y-1">
                                <span className="text-white font-mono text-sm font-semibold tracking-wide">#{orderId?.slice(-8) || "N/A"}</span>
                                {trackingId && (
                                  <p className="text-xs text-indigo-300 font-medium">
                                    Track: {trackingId}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Date & Time Column - Only for "all" tab */}
                        {activeTab === "all" && (
                          <td className="px-6 py-5 bg-slate-900/10">
                            <p className="text-white/80 text-sm font-medium">
                              {formatDate(orderDate)}
                            </p>
                          </td>
                        )}

                        {/* Customer Column */}
                      <td className="px-6 py-5 bg-slate-900/10">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border ${
                              highlightedOrderId && orderId === highlightedOrderId
                                ? "bg-gradient-to-r from-yellow-500/30 to-orange-500/30 ring-2 ring-yellow-400/50 border-yellow-500/20"
                                : "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/20"
                            }`}
                          >
                            <span className={`font-bold text-sm ${
                                highlightedOrderId && orderId === highlightedOrderId
                                  ? "text-yellow-300"
                                  : "text-indigo-300"
                              }`}
                            >
                              {customerName?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate max-w-[140px]" title={customerName || "Unknown User"}>
                              {customerName || "Unknown User"}
                            </p>
                            <p className="text-white/60 text-xs truncate max-w-[140px]" title={customerEmail || "—"}>
                              {customerEmail || "—"}
                            </p>
                            {highlightedOrderId && orderId === highlightedOrderId && (
                              <p className="text-xs text-yellow-400 font-medium">
                                📢 From notification
                              </p>
                            )}
                          </div>
                        </div>
                      </td>



                      {/* Product Column */}
                      <td className="px-6 py-5 bg-slate-900/20">
                        <div className="space-y-2 min-w-0">
                          <p className="text-white font-medium text-sm truncate max-w-[200px] leading-snug" title={productName || "N/A"}>
                            {productName || "N/A"}
                          </p>
                          <div className="flex items-center space-x-2">
                            {activeTab === "all" && totalAmount && (
                              <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-xs font-semibold rounded-full border border-green-500/30 shadow-sm">
                                ₹{totalAmount.toLocaleString()}
                              </span>
                            )}
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30">
                                Qty: {quantity || 1}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 text-xs rounded-full border border-pink-500/30">
                                Size: {size || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column - Only for non-"all" tabs */}
                      {activeTab !== "all" && (
                        <td className="px-6 py-5 bg-slate-900/10">
                          <div className="space-y-1">
                            <p className="text-white/80 text-sm">
                              {customerEmail || "N/A"}
                            </p>
                            <p className="text-white/60 text-sm">
                              {customerPhone || "N/A"}
                            </p>
                          </div>
                        </td>
                      )}

                      {/* Status Column - Now Editable for All Tabs */}
                      <td className="px-6 py-5 text-center bg-slate-900/10">
                        <div className="flex items-center justify-center space-x-2">
                          {getStatusIcon(deliveryStatus)}
                          {/* Editable select for all tabs */}
                          <select
                            value={deliveryStatus}
                            onChange={(e) => {
                              if (activeTab === "all") {
                                // For "all" tab, we need to find the correct index in the filtered results
                                const filteredSales = allOrders.filter((order) => {
                                  if (searchOrderId && !order._id.toLowerCase().includes(searchOrderId.toLowerCase())) return false;
                                  if (searchTrackingId && !order.sr_order_id?.toString().includes(searchTrackingId)) return false;
                                  if (selectedStatus && order.deliveryStatus !== selectedStatus) return false;
                                  if (selectedMonth) {
                                    const orderDate = new Date(order.createdAt);
                                    const filterDate = new Date(selectedMonth);
                                    if (orderDate.getMonth() !== filterDate.getMonth() || 
                                        orderDate.getFullYear() !== filterDate.getFullYear()) return false;
                                  }
                                  return true;
                                });
                                const currentOrderIndex = (currentPage - 1) * itemsPerPage + index;
                                const actualOrder = filteredSales[currentOrderIndex];
                                if (actualOrder) {
                                  const allOrdersIndex = allOrders.findIndex(o => o._id === actualOrder._id);
                                  handleAllOrdersDeliveryChange(allOrdersIndex, e.target.value, orderId);
                                }
                              } else {
                                // For brand-specific tabs
                                handleDeliveryChange(index, e.target.value, orderId);
                              }
                            }}
                            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:bg-white/5 ${getStatusColor(deliveryStatus)}`}
                          >
                            {deliveryOptions.map((status) => (
                              <option
                                key={status}
                                value={status}
                                className="bg-slate-800 text-white"
                              >
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Order Date Column - Only for non-"all" tabs */}
                      {activeTab !== "all" && (
                        <td className="px-6 py-5 bg-slate-900/20">
                          <p className="text-white/80 text-sm font-medium">
                            {formatDate(orderDate)}
                          </p>
                        </td>
                      )}

                      {/* Payment Status Column */}
                      <td className="px-6 py-5 bg-slate-900/20">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            paymentStatus === "UPI" || paymentStatus === "Paid"
                              ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {paymentStatus || "Pending"}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-5 bg-slate-900/20">
                        <button
                          onClick={() => handleViewProducts(order)}
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 text-xs font-medium rounded-lg border border-indigo-500/30 hover:bg-indigo-500/30 hover:text-white transition-all duration-200 shadow-sm"
                        >
                          <Package className="w-3 h-3 mr-1.5" />
                          View Products
                        </button>
                      </td>
                    </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {(() => {
            let filteredSales;
            
            // Use the same filtering logic as in the table body
            if (activeTab === "all") {
              // Use allOrders with enhanced filtering
              filteredSales = allOrders.filter((order) => {
                if (searchOrderId && !order._id.toLowerCase().includes(searchOrderId.toLowerCase())) {
                  return false;
                }
                if (searchTrackingId && !order.sr_order_id?.toString().includes(searchTrackingId)) {
                  return false;
                }

                if (selectedStatus && order.deliveryStatus !== selectedStatus) {
                  return false;
                }
                if (selectedMonth) {
                  const orderDate = new Date(order.createdAt);
                  const filterDate = new Date(selectedMonth);
                  if (orderDate.getMonth() !== filterDate.getMonth() || 
                      orderDate.getFullYear() !== filterDate.getFullYear()) {
                    return false;
                  }
                }
                return true;
              });
            } else if (activeTab === "active") {
              filteredSales =
                sales?.filter(
                  (order) =>
                    !["Delivered", "Cancelled"].includes(
                      order.delivery_status
                    )
                ) || [];
            } else {
              filteredSales = sales || [];
            }
            
            const totalItems = filteredSales.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            
            return (
              <div className="mt-8 flex justify-end">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            );
          })()}
        </>
      )}

      {/* Order Details Modal */}
      {isProductsModalOpen && selectedOrderProducts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass rounded-3xl shadow-2xl border border-white/20 max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Modal Header with Close Button */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Order Details</h2>
                  <p className="text-white/60 text-sm">Complete order information and product details</p>
                </div>
              </div>
              <button
                onClick={handleCloseProductsModal}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-6">
              
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Order & Customer Info */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Order Info Section */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-indigo-400" />
                      Order Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-white/60 text-sm font-medium">Order ID</p>
                          <p className="text-white font-mono text-lg">#{selectedOrderProducts._id?.slice(-8) || selectedOrderProducts.order_id?.slice(-8) || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm font-medium">Status</p>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {selectedOrderProducts.deliveryStatus || "Processing"}
                          </span>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm font-medium">Payment Status</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            selectedOrderProducts.paymentStatus === "Paid" || selectedOrderProducts.paymentStatus === "UPI"
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                          }`}>
                            {selectedOrderProducts.paymentStatus === "Paid" || selectedOrderProducts.paymentStatus === "UPI" ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Paid
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 mr-1" />
                                {selectedOrderProducts.paymentStatus || "Pending"}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-white/60 text-sm font-medium">Order Placed</p>
                          <p className="text-white font-medium">
                            {selectedOrderProducts.createdAt 
                              ? new Date(selectedOrderProducts.createdAt).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : "N/A"}
                          </p>
                          <p className="text-white/60 text-sm">
                            {selectedOrderProducts.createdAt 
                              ? new Date(selectedOrderProducts.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ""}
                          </p>
                        </div>
                        {selectedOrderProducts.acceptedAt && (
                          <div>
                            <p className="text-white/60 text-sm font-medium">Accepted</p>
                            <p className="text-white font-medium">
                              {new Date(selectedOrderProducts.acceptedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                        {selectedOrderProducts.shippedAt && (
                          <div>
                            <p className="text-white/60 text-sm font-medium">Shipped</p>
                            <p className="text-white font-medium">
                              {new Date(selectedOrderProducts.shippedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                        {selectedOrderProducts.deliveredAt && (
                          <div>
                            <p className="text-white/60 text-sm font-medium">Delivered</p>
                            <p className="text-white font-medium">
                              {new Date(selectedOrderProducts.deliveredAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                        {selectedOrderProducts.sr_order_id && (
                          <div>
                            <p className="text-white/60 text-sm font-medium">Tracking ID</p>
                            <p className="text-white font-mono text-sm">{selectedOrderProducts.sr_order_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Details Section */}
                  {selectedOrderProducts.user && (
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2 text-green-400" />
                        Customer Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-white/60 text-sm font-medium">Customer Name</p>
                            <p className="text-white font-medium">{selectedOrderProducts.user.display_name || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-white/60 text-sm font-medium">Email</p>
                            <p className="text-white font-medium">{selectedOrderProducts.user.email || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-white/60 text-sm font-medium">Phone</p>
                            <p className="text-white font-medium">{selectedOrderProducts.user.phone || "N/A"}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {selectedOrderProducts.shippingAddress && (
                            <div>
                              <p className="text-white/60 text-sm font-medium">Shipping Address</p>
                              <div className="text-white text-sm leading-relaxed">
                                {typeof selectedOrderProducts.shippingAddress === 'string' ? (
                                  <p>{selectedOrderProducts.shippingAddress}</p>
                                ) : (
                                  <>
                                    {selectedOrderProducts.shippingAddress.street && (
                                      <p>{selectedOrderProducts.shippingAddress.street}</p>
                                    )}
                                    {(selectedOrderProducts.shippingAddress.city || selectedOrderProducts.shippingAddress.state) && (
                                      <p>
                                        {selectedOrderProducts.shippingAddress.city}
                                        {selectedOrderProducts.shippingAddress.city && selectedOrderProducts.shippingAddress.state ? ", " : ""}
                                        {selectedOrderProducts.shippingAddress.state}
                                      </p>
                                    )}
                                    {selectedOrderProducts.shippingAddress.zipCode && (
                                      <p>{selectedOrderProducts.shippingAddress.zipCode}</p>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Brand Details Section */}
                  {(selectedOrderProducts.brand || brand) && (
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-purple-400" />
                        Brand Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-white/60 text-sm font-medium">Store Name</p>
                            <p className="text-white font-medium">
                              {selectedOrderProducts.brand?.name || brand?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60 text-sm font-medium">Contact Person</p>
                            <p className="text-white font-medium">
                              {(selectedOrderProducts.brand as any)?.contactPerson || (brand as any)?.contactPerson || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-white/60 text-sm font-medium">Brand Email</p>
                            <p className="text-white font-medium">
                              {selectedOrderProducts.brand?.email || brand?.email || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60 text-sm font-medium">City/State</p>
                            <p className="text-white font-medium">
                              {(selectedOrderProducts.brand as any)?.city || (brand as any)?.city || "N/A"}
                              {((selectedOrderProducts.brand as any)?.state || (brand as any)?.state) && 
                                `, ${(selectedOrderProducts.brand as any)?.state || (brand as any)?.state}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10 sticky top-0">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2 text-indigo-400" />
                      Order Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/60">Items ({selectedOrderProducts.products?.length || 0})</span>
                        <span className="text-white font-medium">
                          ₹{(() => {
                            const itemsTotal = selectedOrderProducts.products?.reduce((sum: number, product: any) => 
                              sum + (Number(product.price || 0) * Number(product.quantity || 1)), 0) || 0;
                            return Number(itemsTotal).toLocaleString();
                          })()}
                        </span>
                      </div>
                      
                      {selectedOrderProducts.shippingCharges && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Shipping</span>
                          <span className="text-white font-medium">₹{Number(selectedOrderProducts.shippingCharges).toLocaleString()}</span>
                        </div>
                      )}
                      
                      {selectedOrderProducts.tax && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Tax</span>
                          <span className="text-white font-medium">₹{Number(selectedOrderProducts.tax).toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="border-t border-white/20 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white text-lg font-semibold">Total</span>
                          <span className="text-green-400 text-xl font-bold">
                            ₹{Number(selectedOrderProducts.totalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details Section - Full Width */}
              <div className="mt-8">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-orange-400" />
                    Product Details ({selectedOrderProducts.products?.length || 0} items)
                  </h3>
                  
                  {/* Products Grid */}
                  {selectedOrderProducts.products && selectedOrderProducts.products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {selectedOrderProducts.products.map((product: any, index: number) => {
                        // Get product details from nested product object or direct fields
                        const productDetails = product.product || product;
                        const productName = product.name || productDetails.name || "Product Name Not Available";
                        let imageUrl = null;
                        
                        // Check various possible image fields in the correct hierarchy
                        if (productDetails.images && productDetails.images.length > 0) {
                          imageUrl = productDetails.images[0];
                        } else if (productDetails.image) {
                          imageUrl = productDetails.image;
                        } else if (productDetails.product_variants && productDetails.product_variants.length > 0) {
                          // Check product variants for images
                          const variant = productDetails.product_variants[0];
                          if (variant.images && variant.images.length > 0) {
                            imageUrl = variant.images[0];
                          }
                        }

                        return (
                          <div key={index} className="bg-white/3 rounded-xl p-4 border border-white/10 hover:bg-white/5 transition-all duration-300">
                            <div className="flex gap-4">
                              {/* Product Image */}
                              <div className="w-20 h-20 flex-shrink-0">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={productName}
                                    className="w-full h-full object-cover rounded-lg border border-white/20"
                                    onError={(e) => {
                                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-white/5 rounded-lg border border-white/20 flex items-center justify-center">
                                    <Package className="w-8 h-8 text-white/40" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm mb-2 truncate">{productName}</h4>
                                
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                                      SKU: {productDetails.sku || productDetails.shopify_id || productDetails._id?.slice(-8) || "N/A"}
                                    </span>
                                    {product.size && (
                                      <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded border border-gray-500/30">
                                        Size: {product.size}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {(productDetails.color || productDetails.product_variants?.[0]?.color) && (
                                    <div className="text-xs">
                                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                                        Color: {productDetails.color || productDetails.product_variants?.[0]?.color}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center pt-2">
                                    <div className="text-xs">
                                      <span className="text-white/60">Qty:</span>
                                      <span className="text-white font-medium ml-1">{product.quantity || 1}</span>
                                    </div>
                                    <div className="text-right">
                                      {product.originalPrice && product.originalPrice !== product.price && (
                                        <div className="text-xs text-gray-400 line-through">
                                          ₹{Number(product.originalPrice).toLocaleString()}
                                        </div>
                                      )}
                                      <div className="text-sm font-semibold text-green-400">
                                        ₹{Number(product.price || 0).toLocaleString()}
                                      </div>
                                      {product.quantity && product.price && (
                                        <div className="text-xs text-white/60">
                                          Total: ₹{(Number(product.price) * Number(product.quantity)).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-white/30 mx-auto mb-6" />
                      <h4 className="text-white/80 text-lg font-semibold mb-2">No Products Found</h4>
                      <p className="text-white/60">No product details are available for this order.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
