/**
 * RefundRequestsTab Component
 * 
 * Enhanced Returns & Refunds management component with advanced filtering capabilities:
 * - Brand dropdown filter (populated from /brands API)
 * - Order ID text search filter
 * - Date picker filter
 * - Sortable columns (Order ID, Brand, Status, Date)
 * - Real-time table updates with combined filters
 * - Pagination with filtered results
 * - Comprehensive empty states and loading indicators
 */

import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, Package, Clock, Search, Filter, Calendar, User, ArrowUpDown, Eye } from "lucide-react";
import Pagination from "./Pagination";

type OrderRow = {
  _id: string;
  user?: { display_name?: string; email?: string } | string;
  brandId?: { _id: string; name: string } | string;
  totalAmount?: number;
  deliveryStatus?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  createdAt?: string;
  status?: string;
  refundStatus?: "not_initiated" | "initiated" | "completed";
  refundReason?: string;
  // Product information
  productName?: string;
  product_name?: string;
  productPrice?: number;
  product_price?: number;
  products?: Array<{
    name?: string;
    price?: number;
    productId?: { name?: string; price?: number };
  }>;
};

const RefundRequestsTab: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [allBrands, setAllBrands] = useState<{_id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [notes, setNotes] = useState(""); // Will be populated from refundReason
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search/Filter states
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [orderIdFilter, setOrderIdFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  
  // Sorting states
  const [sortColumn, setSortColumn] = useState<keyof OrderRow | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  


  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const [refundRequestsRes, refundedRes] = await Promise.all([
        axios.get(`${apiUrl}/orders/refund-requests`),
        axios.get(`${apiUrl}/orders/refunded`)
      ]);
      const pendingOrders = refundRequestsRes.data.orders || [];
      const completedOrders = refundedRes.data.orders || [];
      setOrders([...pendingOrders, ...completedOrders]);
    } catch (e) {
      console.error("Failed to fetch refund requests", e);
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
    fetchRefundRequests();
    fetchBrands();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, orderIdFilter, dateFilter]);

  const approve = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await axios.patch(`${apiUrl}/orders/${selected._id}/refund-response`, {
        action: "approve",
        notes,
      });
      setShowModal(false);
      setSelected(null);
      await fetchRefundRequests();
    } catch (e) {
      console.error("Approve refund failed", e);
      alert("Failed to approve refund");
    } finally {
      setProcessing(false);
    }
  };

  const rejectFromModal = async () => {
    if (!selected) return;
    if (!notes.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    
    setProcessing(true);
    try {
      await axios.patch(`${apiUrl}/orders/${selected._id}/refund-response`, {
        action: "reject",
        notes: notes,
      });
      setShowModal(false);
      setSelected(null);
      setNotes("");
      await fetchRefundRequests();
    } catch (e) {
      console.error("Reject refund failed", e);
      alert("Failed to reject refund");
    } finally {
      setProcessing(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle sorting
  const handleSort = (column: keyof OrderRow) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Filter and sort orders
  const getFilteredAndSortedOrders = () => {
    let filtered = [...orders];
    
    console.log(`Filtering ${orders.length} orders with filters:`, {
      selectedBrand,
      orderIdFilter,
      dateFilter
    });

    // Apply filters
    if (selectedBrand) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(order => {
        const brand = order.brandId as any;
        const matches = brand?._id === selectedBrand;
        return matches;
      });
      console.log(`Brand filter: ${beforeFilter} -> ${filtered.length} orders`);
    }

    if (orderIdFilter) {
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(orderIdFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      filtered = filtered.filter(order => {
        if (order.createdAt) {
          return new Date(order.createdAt).toDateString() === filterDate;
        }
        return false;
      });
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortColumn];
        let bValue: any = b[sortColumn];

        // Handle nested objects
        if (sortColumn === 'user') {
          aValue = (a.user as any)?.display_name || (a.user as any)?.email || '';
          bValue = (b.user as any)?.display_name || (b.user as any)?.email || '';
        } else if (sortColumn === 'brandId') {
          aValue = (a.brandId as any)?.name || '';
          bValue = (b.brandId as any)?.name || '';
        }

        // Handle different data types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === "asc" 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        // Handle dates
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === "asc" 
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        return 0;
      });
    }

    return filtered;
  };

  // Clear filters
  const clearFilters = () => {
    console.log("Clearing all filters");
    setSelectedBrand("");
    setOrderIdFilter("");
    setDateFilter("");
    setSortColumn("");
    setSortDirection("asc");
    setCurrentPage(1);
  };

  // Helper function to get product display information
  const getProductInfo = (order: OrderRow) => {
    let productName = "Unknown Product";
    let productPrice = 0;

    // Try different possible product data structures
    if (order.productName) {
      productName = order.productName;
    } else if (order.product_name) {
      productName = order.product_name;
    } else if (order.products && order.products.length > 0) {
      const product = order.products[0];
      productName = product.name || product.productId?.name || "Unknown Product";
    }

    // Get price
    if (order.productPrice) {
      productPrice = order.productPrice;
    } else if (order.product_price) {
      productPrice = order.product_price;
    } else if (order.totalAmount) {
      productPrice = order.totalAmount;
    } else if (order.products && order.products.length > 0) {
      const product = order.products[0];
      productPrice = product.price || product.productId?.price || 0;
    }

    return { productName, productPrice };
  };

  // Calculate pagination with filtered data (memoized for performance)
  const filteredOrders = React.useMemo(() => {
    return getFilteredAndSortedOrders();
  }, [orders, selectedBrand, orderIdFilter, dateFilter, sortColumn, sortDirection]);
  
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "—";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-10xl mx-auto animate-fade-in">
      {/* Search/Filter Panel */}
      <div className="glass rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Filter className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Filter Returns & Refunds</h3>
              <p className="text-white/60 text-sm">Search and filter refund requests</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{totalItems}</p>
              <p className="text-white/60 text-xs uppercase tracking-wide">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{orders.filter(o => o.refundStatus !== "completed" && o.status !== "refunded").length}</p>
              <p className="text-white/60 text-xs uppercase tracking-wide">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{orders.filter(o => o.refundStatus === "completed" || o.status === "refunded").length}</p>
              <p className="text-white/60 text-xs uppercase tracking-wide">Completed</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Brand Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Package className="w-4 h-4 text-indigo-400" />
              Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                console.log("Brand filter changed to:", e.target.value);
                setSelectedBrand(e.target.value);
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-200"
              disabled={loading}
            >
              <option value="" className="bg-slate-800 text-white">
                {allBrands.length === 0 && !loading ? "No brands available" : "All Brands"}
              </option>
              {allBrands.map((brand) => (
                <option key={brand._id} value={brand._id} className="bg-slate-800 text-white">
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Order ID Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Search className="w-4 h-4 text-purple-400" />
              Order ID
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={orderIdFilter}
                onChange={(e) => {
                  console.log("Order ID filter changed to:", e.target.value);
                  setOrderIdFilter(e.target.value);
                }}
                placeholder="Search order ID..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white/10 transition-all duration-200"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Calendar className="w-4 h-4 text-pink-400" />
              Order Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  console.log("Date filter changed to:", e.target.value);
                  setDateFilter(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 focus:bg-white/10 transition-all duration-200"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80 opacity-0">
              Actions
            </label>
            <button
              onClick={clearFilters}
              disabled={!selectedBrand && !orderIdFilter && !dateFilter}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30 hover:from-red-500/30 hover:to-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Package className="w-4 h-4" />
              <span>
                Showing <span className="font-semibold text-white">{paginatedOrders.length}</span> of <span className="font-semibold text-white">{totalItems}</span> requests
              </span>
            </div>
            {totalItems < orders.length && (
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">
                Filtered from {orders.length} total
              </span>
            )}
          </div>
          
          {(selectedBrand || orderIdFilter || dateFilter) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/60 uppercase tracking-wide">Active Filters:</span>
              {selectedBrand && (
                <span className="flex items-center gap-1 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs">
                  <Package className="w-3 h-3" />
                  {allBrands.find(b => b._id === selectedBrand)?.name || 'Unknown'}
                </span>
              )}
              {orderIdFilter && (
                <span className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                  <Search className="w-3 h-3" />
                  #{orderIdFilter}
                </span>
              )}
              {dateFilter && (
                <span className="flex items-center gap-1 px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs">
                  <Calendar className="w-3 h-3" />
                  {new Date(dateFilter).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass rounded-2xl shadow-2xl border border-white/20 overflow-hidden bg-gradient-to-b from-slate-900/40 to-slate-800/20 backdrop-blur-lg">
        {/* Mobile Card View (hidden on desktop) */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="p-8 text-center text-white/70">
              <Clock className="w-8 h-8 mx-auto mb-4 animate-spin" />
              <p>Loading refund requests...</p>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              <Package className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <p className="text-lg font-medium mb-2">No refund requests found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {paginatedOrders.map((o) => {
                const u = o.user as any;
                const isCompleted = o.refundStatus === "completed" || o.status === "refunded" || (o as any).refundedAmount > 0;
                const { productName, productPrice } = getProductInfo(o);
                
                return (
                  <div key={o._id} className="p-4 hover:bg-white/5 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-slate-600/30 to-slate-500/30 text-white/80 text-xs font-semibold rounded-full border border-slate-500/30">
                          {(currentPage - 1) * itemsPerPage + paginatedOrders.indexOf(o) + 1}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"></div>
                        <span className="text-white font-mono text-sm font-medium">#{o._id.slice(-8)}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                        isCompleted
                          ? "bg-green-500/20 text-green-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {isCompleted ? "Completed" : "Pending"}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-400" />
                        <span className="text-white font-medium truncate" title={u?.display_name || "Unknown User"}>
                          {u?.display_name || "Unknown User"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-white text-sm truncate" title={`${productName} - ₹${productPrice.toLocaleString()}`}>
                          {productName} - ₹{productPrice.toLocaleString()}
                        </span>
                      </div>
                      {o.refundReason && (
                        <div className="text-white/70 text-sm">
                          <span className="font-medium">Reason: </span>
                          <span className="truncate block" title={o.refundReason}>{o.refundReason}</span>
                        </div>
                      )}
                      <div className="text-white/60 text-xs">
                        {formatDate(o.createdAt)}
                      </div>
                    </div>
                    
                    {!isCompleted && (
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => {
                            setSelected(o);
                            setShowModal(true);
                          }} 
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-lg hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 border border-indigo-400/30"
                          title="View and edit refund request"
                        >
                          <Eye className="w-3 h-3" /> 
                          View/Edit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden lg:block relative">
          {/* Scroll Indicator */}
          <div className="absolute top-0 right-0 z-10 h-full w-8 bg-gradient-to-l from-slate-900/80 to-transparent pointer-events-none opacity-0 transition-opacity duration-300 lg:opacity-100"></div>
          
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-500/40 scrollbar-track-slate-800/40 hover:scrollbar-thumb-indigo-400/60">
            <table className="w-full min-w-[1200px] divide-y divide-white/10 bg-gradient-to-b from-slate-900/50 to-slate-800/30">
            <thead className="bg-gradient-to-r from-indigo-500/25 to-purple-500/25 sticky top-0 backdrop-blur-sm border-b border-white/10">
              <tr className="divide-x divide-white/10">
                <th className="w-[80px] px-4 py-5 text-center text-xs font-semibold text-white/95 uppercase tracking-wider">
                  <span className="flex items-center justify-center gap-2">
                    #
                  </span>
                </th>
                <th className="w-[120px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('_id')}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    Order ID
                    <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </button>
                </th>
                <th className="w-[200px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <User className="w-3 h-3 opacity-70" />
                    Customer
                  </span>
                </th>
                <th className="w-[250px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Package className="w-3 h-3 opacity-70" />
                    Product & Price
                  </span>
                </th>
                <th className="w-[200px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  Return Reason
                </th>
                <th className="w-[130px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('refundStatus')}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    Status
                    <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </button>
                </th>
                <th className="w-[150px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    Date
                    <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </button>
                </th>
                <th className="w-[160px] px-6 py-5 text-center text-xs font-semibold text-white/95 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-900/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center bg-slate-900/30">
                    <div className="flex flex-col items-center space-y-3">
                      <Clock className="w-8 h-8 text-indigo-400 animate-spin" />
                      <p className="text-white/80 font-medium">Loading refund requests...</p>
                      <p className="text-white/60 text-sm">Please wait while we fetch the data</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center bg-slate-900/20">
                    {orders.length === 0 ? (
                      <>
                        <Package className="w-8 h-8 mx-auto mb-2 text-white/30" />
                        <p>No refund requests found</p>
                      </>
                    ) : (
                      <>
                        <Search className="w-8 h-8 mx-auto mb-2 text-white/30" />
                        <p className="mb-2">No results match your filters</p>
                        <button 
                          onClick={clearFilters}
                          className="px-3 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors"
                        >
                          Clear Filters
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o, idx) => {
                  const u = o.user as any;
                  const brand = o.brandId as any;
                  const isCompleted = o.refundStatus === "completed" || o.status === "refunded" || (o as any).refundedAmount > 0;
                  const { productName, productPrice } = getProductInfo(o);
                  
                  return (
                    <tr key={o._id} className="hover:bg-white/3 transition-all duration-300 animate-slide-up border-b border-white/5 divide-x divide-white/5 group" style={{ animationDelay: `${idx * 0.05}s` }}>
                      {/* Index */}
                      <td className="px-4 py-5 text-center bg-slate-900/30">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-slate-600/30 to-slate-500/30 text-white/80 text-sm font-semibold rounded-full border border-slate-500/30">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </span>
                      </td>
                      
                      {/* Order ID */}
                      <td className="px-6 py-5 bg-slate-900/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 shadow-sm shadow-indigo-400/20"></div>
                          <span className="text-white font-mono text-sm font-semibold tracking-wide">#{o._id.slice(-8)}</span>
                        </div>
                      </td>
                      
                      {/* Customer Name */}
                      <td className="px-6 py-5 bg-slate-900/10">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                            <span className="text-indigo-300 font-bold text-sm">
                              {(u?.display_name || u?.email || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate max-w-[140px]" title={u?.display_name || "Unknown User"}>
                              {u?.display_name || "Unknown User"}
                            </p>
                            <p className="text-white/60 text-xs truncate max-w-[140px]" title={u?.email || "—"}>
                              {u?.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Product (Name + Price) */}
                      <td className="px-6 py-5 bg-slate-900/20">
                        <div className="space-y-2 min-w-0">
                          <p className="text-white font-medium text-sm truncate max-w-[200px] leading-snug" title={productName}>
                            {productName}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-xs font-semibold rounded-full border border-green-500/30 shadow-sm">
                              ₹{productPrice.toLocaleString()}
                            </span>
                            {brand?.name && (
                              <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30 truncate max-w-[80px]" title={brand.name}>
                                {brand.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Return Reason */}
                      <td className="px-6 py-5 bg-slate-900/10">
                        <div className="min-w-0">
                          <p className="text-white/85 text-sm leading-relaxed truncate max-w-[180px]" title={o.refundReason || "Not specified"}>
                            {o.refundReason ? (
                              o.refundReason
                            ) : (
                              <span className="text-white/50 italic">Not specified</span>
                            )}
                          </p>
                          {o.refundReason && o.refundReason.length > 40 && (
                            <span className="text-white/40 text-xs">...</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-6 py-5 bg-slate-900/20">
                        <span className={`inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 shadow-sm min-w-[100px] justify-center ${
                          isCompleted
                            ? "bg-green-500/25 text-green-200 border-green-500/40 shadow-green-500/10"
                            : o.refundStatus === "initiated" 
                            ? "bg-blue-500/25 text-blue-200 border-blue-500/40 shadow-blue-500/10"
                            : "bg-amber-500/25 text-amber-200 border-amber-500/40 shadow-amber-500/10"
                        }`}>
                          {isCompleted ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-2" />
                              Completed
                            </>
                          ) : o.refundStatus === "initiated" ? (
                            <>
                              <Clock className="w-3 h-3 mr-2 animate-pulse" />
                              Approved
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-2" />
                              Pending
                            </>
                          )}
                        </span>
                      </td>
                      
                      {/* Date */}
                      <td className="px-6 py-5 bg-slate-900/10">
                        <div className="text-white/80 text-sm">
                          <p className="font-semibold whitespace-nowrap">{formatDate(o.createdAt)}</p>
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-5 bg-slate-900/20">
                        <div className="flex justify-center items-center min-h-[44px]">
                          {isCompleted ? (
                            <span className="inline-flex items-center px-3 py-2 text-xs text-white/60 bg-white/5 rounded-lg border border-white/10">
                              <CheckCircle className="w-3 h-3 mr-1.5" />
                              <span className="font-medium">Processed</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelected(o);
                                setShowModal(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-lg hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 border border-indigo-400/30"
                              title="View and manage refund request"
                            >
                              <Eye className="w-3 h-3" />
                              <span className="hidden xl:inline">View</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>      {/* Pagination */}
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

      {showModal && selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-6 shadow-2xl border border-white/20 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" /> Manage Refund Request
            </h3>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-sm text-white/70 mb-1">Order Details</div>
                <div className="text-white">Order ID: #{selected._id.slice(-8)}</div>
                <div className="text-white">Amount: ₹{(selected.totalAmount || 0).toLocaleString()}</div>
                <div className="text-white/80">Customer: {(selected.user as any)?.display_name || (selected.user as any)?.email || "—"}</div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Notes (Required for rejection)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this refund decision..." className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50" rows={3} />
                <div className="text-xs text-white/50 mt-1">Notes will be sent to customer if request is rejected</div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 glass rounded-xl text-white/80">Cancel</button>
                <button onClick={rejectFromModal} disabled={processing || !notes.trim()} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white disabled:opacity-50">
                  {processing ? "Rejecting..." : "Reject"}
                </button>
                <button onClick={approve} disabled={processing} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white disabled:opacity-50">
                  {processing ? "Approving..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default RefundRequestsTab;
