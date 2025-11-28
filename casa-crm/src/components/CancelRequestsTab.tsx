import React, { useEffect, useState } from "react";
import { useBrand } from "../contexts/BrandContext";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package,
  Calendar,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import Pagination from "./Pagination";

interface CancelRequest {
  _id: string;
  orderId: {
    _id: string;
    deliveryStatus: string;
    paymentStatus: string;
    createdAt: string;
    refundStatus?: string;
  };
  userId: {
    _id: string;
    display_name: string;
    email: string;
    phone: string;
  };
  productId?: {
    _id: string;
    name: string;
    images: string[];
  };
  productIndex?: number;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
  orderDetails: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    productName: string;
    productImage?: string;
    quantity: number;
    size?: string;
    price: number;
    totalAmount: number;
  };
}

const CancelRequestsTab: React.FC = () => {
  const { brand } = useBrand();
  const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<CancelRequest | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and search states
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [orderIdFilter, setOrderIdFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [allBrands, setAllBrands] = useState<any[]>([]);
  const [sortField, setSortField] = useState<string>('requestedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchCancelRequests = async () => {
      if (!brand?._id) return;

      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:8080/api";
        const res = await axios.get(
          `${apiUrl}/cancel-requests/brand/${brand._id}`
        );

        if (res.data?.success) {
          setCancelRequests(res.data.cancelRequests || []);
        }
      } catch (err) {
        console.error("Failed to fetch cancellation requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCancelRequests();
  }, [brand]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "approved":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

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

  const handleApprove = async (request: CancelRequest) => {
    setSelectedRequest(request);
    setAdminNotes("");
    setShowModal(true);
  };

  const handleReject = async (request: CancelRequest) => {
    setSelectedRequest(request);
    setAdminNotes("");
    setShowModal(true);
  };

  const processRequest = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      // Prefer new brand-response endpoint working on the order for status sync
      const orderId = selectedRequest.orderId?._id || selectedRequest.orderId;
      const endpoint = `${apiUrl}/orders/${orderId}/brand-response`;
      await axios.patch(endpoint, {
        action,
        adminNotes,
        processedBy: "Brand",
        productIndex: selectedRequest.productIndex,
      });

      // Update local state
      setCancelRequests((prev) =>
        prev.map((req) =>
          req._id === selectedRequest._id
            ? {
                ...req,
                status: action === "approve" ? "approved" : "rejected",
                processedAt: new Date().toISOString(),
                adminNotes,
              }
            : req
        )
      );

      setShowModal(false);
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
      alert(`Failed to ${action} request. Please try again.`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset pagination when status filter changes
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // Filter, sort and search logic
  const getFilteredAndSortedRequests = React.useMemo(() => {
    let filtered = cancelRequests;

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((req) => req.status === selectedStatus);
    }

    // Brand filter (if needed)
    if (selectedBrand && selectedBrand !== "") {
      // Add brand filtering logic if brands are available in cancelRequests
    }

    // Order ID filter
    if (orderIdFilter.trim()) {
      filtered = filtered.filter((req) => {
        const orderIdStr = req.orderId?._id
          ? String(req.orderId._id)
          : req.orderId;
        return typeof orderIdStr === 'string' && orderIdStr.toLowerCase().includes(orderIdFilter.toLowerCase());
      });
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter((req) => {
        const reqDate = new Date(req.requestedAt).toISOString().split('T')[0];
        return reqDate === dateFilter;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField as keyof CancelRequest] as any;
      let bVal = b[sortField as keyof CancelRequest] as any;
      
      if (sortField === 'requestedAt') {
        aVal = new Date(a.requestedAt).getTime();
        bVal = new Date(b.requestedAt).getTime();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [cancelRequests, selectedStatus, selectedBrand, orderIdFilter, dateFilter, sortField, sortDirection]);

  const filteredRequests = getFilteredAndSortedRequests;

  // Calculate pagination
  const totalItems = filteredRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Clear filters function
  const clearFilters = () => {
    setSelectedBrand("");
    setOrderIdFilter("");
    setDateFilter("");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-10xl mx-auto animate-fade-in">
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Package className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-white/70 text-lg">
            Loading cancellation requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-10xl mx-auto animate-fade-in">
      {/* Search & Filter Panel */}
      <div className="mb-8 glass rounded-2xl p-6 shadow-xl border border-white/20 bg-gradient-to-r from-slate-900/40 to-slate-800/20 backdrop-blur-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-white/90">Search & Filter Cancel Requests</h3>
              <p className="text-white/60 text-sm">Search and filter cancellation requests</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{totalItems}</p>
              <p className="text-white/60 text-xs uppercase tracking-wide">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{cancelRequests.filter(req => req.status === "pending").length}</p>
              <p className="text-white/60 text-xs uppercase tracking-wide">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{cancelRequests.filter(req => req.status === "approved").length}</p>
              <p className="text-white/60 text-xs uppercase tracking-wide">Completed</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-white/80">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-200"
            >
              <option value="all" className="bg-slate-800 text-white">All Statuses</option>
              <option value="pending" className="bg-slate-800 text-white">Pending</option>
              <option value="approved" className="bg-slate-800 text-white">Approved</option>
              <option value="rejected" className="bg-slate-800 text-white">Rejected</option>
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
                  setOrderIdFilter(e.target.value);
                  setCurrentPage(1);
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
              Request Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
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
              disabled={!orderIdFilter && !dateFilter && selectedStatus === "all"}
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
                Showing <span className="font-semibold text-white">{paginatedRequests.length}</span> of <span className="font-semibold text-white">{totalItems}</span> requests
              </span>
            </div>
            {totalItems < cancelRequests.length && (
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">
                Filtered from {cancelRequests.length} total
              </span>
            )}
          </div>
          
          {(orderIdFilter || dateFilter || selectedStatus !== "all") && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/60 uppercase tracking-wide">Active Filters:</span>
              {selectedStatus !== "all" && (
                <span className="flex items-center gap-1 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs">
                  Status: {selectedStatus}
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

      {/* Requests Table */}
      <div className="glass rounded-2xl shadow-2xl border border-white/20 overflow-hidden bg-gradient-to-b from-slate-900/40 to-slate-800/20 backdrop-blur-lg">
        {/* Mobile Card View (hidden on desktop) */}
        <div className="block lg:hidden">
          {paginatedRequests.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              <Package className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <p className="text-lg font-medium mb-2">No cancel requests found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {paginatedRequests.map((request, index) => (
                <div key={request._id} className="p-4 hover:bg-white/5 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-slate-600/30 to-slate-500/30 text-white/80 text-xs font-semibold rounded-full border border-slate-500/30">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"></div>
                      <span className="text-white font-mono text-sm font-medium">
                        #{(() => {
                          const orderIdStr = request.orderId?._id
                            ? String(request.orderId._id)
                            : request.orderId;
                          return typeof orderIdStr === 'string' ? orderIdStr.slice(-8) : 'N/A';
                        })()}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span className="text-white font-medium truncate" title={request.orderDetails.customerName || request.userId?.display_name || "Unknown User"}>
                        {request.orderDetails.customerName || request.userId?.display_name || "Unknown User"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="text-white text-sm truncate" title={`${request.orderDetails.productName} - ₹${request.orderDetails.totalAmount?.toLocaleString() || 0}`}>
                        {request.orderDetails.productName} - ₹{request.orderDetails.totalAmount?.toLocaleString() || 0}
                      </span>
                    </div>
                    {request.reason && (
                      <div className="text-white/70 text-sm">
                        <span className="font-medium">Reason: </span>
                        <span className="truncate block" title={request.reason}>{request.reason}</span>
                      </div>
                    )}
                    <div className="text-white/60 text-xs">
                      {new Date(request.requestedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  {request.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowModal(true);
                        }} 
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-lg hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 border border-indigo-400/30"
                        title="View and edit cancel request"
                      >
                        <Eye className="w-3 h-3" /> 
                        View/Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
                    onClick={() => handleSort('orderId')}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    Order ID
                    <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </button>
                </th>
                <th className="w-[200px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <User className="w-3 h-3 opacity-70" />
                    Customer Name
                  </span>
                </th>
                <th className="w-[250px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Package className="w-3 h-3 opacity-70" />
                    Product & Price
                  </span>
                </th>
                <th className="w-[200px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  Cancel Reason
                </th>
                <th className="w-[130px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    Status
                    <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </button>
                </th>
                <th className="w-[150px] px-6 py-5 text-left text-xs font-semibold text-white/95 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('requestedAt')}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    Date
                    <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </button>
                </th>
                <th className="w-[160px] px-6 py-5 text-center text-xs font-semibold text-white/95 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-900/10">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center bg-slate-900/20">
                    <div className="flex flex-col items-center space-y-3">
                      <Package className="w-8 h-8 text-white/30" />
                      <p className="text-white/70 text-lg font-medium">
                        {selectedStatus === "all"
                          ? "No cancellation requests found"
                          : `No ${selectedStatus} requests found`}
                      </p>
                      <p className="text-white/50 text-sm">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((request, index) => (
                  <tr
                    key={request._id}
                    className="hover:bg-white/3 transition-all duration-300 animate-slide-up border-b border-white/5 divide-x divide-white/5 group"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Index */}
                    <td className="px-4 py-5 text-center bg-slate-900/30">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-slate-600/30 to-slate-500/30 text-white/80 text-sm font-semibold rounded-full border border-slate-500/30">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>

                    {/* Order ID */}
                    <td className="px-6 py-5 bg-slate-900/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 shadow-sm shadow-indigo-400/20"></div>
                        <span className="text-white font-mono text-sm font-semibold tracking-wide">
                          #{(() => {
                            const orderIdStr = request.orderId?._id
                              ? String(request.orderId._id)
                              : request.orderId;
                            return typeof orderIdStr === 'string' ? orderIdStr.slice(-8) : 'N/A';
                          })()}
                        </span>
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td className="px-6 py-5 bg-slate-900/10">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                          <span className="text-indigo-300 font-bold text-sm">
                            {(request.orderDetails.customerName || request.userId?.display_name || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium text-sm truncate max-w-[140px]" title={request.orderDetails.customerName || request.userId?.display_name || "Unknown User"}>
                            {request.orderDetails.customerName || request.userId?.display_name || "Unknown User"}
                          </p>
                          <p className="text-white/60 text-xs truncate max-w-[140px]" title={request.orderDetails.customerEmail || request.userId?.email || "—"}>
                            {request.orderDetails.customerEmail || request.userId?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Product (Name + Price) */}
                    <td className="px-6 py-5 bg-slate-900/20">
                      <div className="space-y-2 min-w-0">
                        <p className="text-white font-medium text-sm truncate max-w-[200px] leading-snug" title={request.orderDetails.productName}>
                          {request.orderDetails.productName}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-xs font-semibold rounded-full border border-green-500/30 shadow-sm">
                            ₹{request.orderDetails.totalAmount?.toLocaleString() || 0}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                            Qty: {request.orderDetails.quantity || 1}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Cancel Reason */}
                    <td className="px-6 py-5 bg-slate-900/10">
                      <div className="min-w-0">
                        <p className="text-white/85 text-sm leading-relaxed truncate max-w-[180px]" title={request.reason || "Not specified"}>
                          {request.reason ? (
                            request.reason
                          ) : (
                            <span className="text-white/50 italic">Not specified</span>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5 bg-slate-900/20">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const status = request.status || 'pending';
                          const statusIcon = getStatusIcon(status);
                          const statusColor = getStatusColor(status);
                          
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${statusColor}`}>
                              {statusIcon}
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-5 bg-slate-900/10">
                      <div className="text-white/80 text-sm font-medium">
                        {new Date(request.requestedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-white/50 text-xs">
                        {new Date(request.requestedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 bg-slate-900/20">
                      <div className="flex justify-center items-center min-h-[44px]">
                        {request.status === "pending" ? (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-lg hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 border border-indigo-400/30"
                            title="View and edit cancel request"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="hidden xl:inline">View/Edit</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-3 py-2 text-xs text-white/60 bg-white/5 rounded-lg border border-white/10">
                            <CheckCircle className="w-3 h-3 mr-1.5" />
                            <span className="font-medium">
                              {request.status === "approved" ? "Approved" : "Rejected"}
                            </span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
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

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">
              {selectedRequest.status === "pending"
                ? "Process Request"
                : "Request Details"}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 glass text-white/70 font-semibold rounded-2xl hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                Cancel
              </button>
              {selectedRequest.status === "pending" && (
                <>
                  <button
                    onClick={() => processRequest("approve")}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => processRequest("reject")}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? "Processing..." : "Reject"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelRequestsTab;
