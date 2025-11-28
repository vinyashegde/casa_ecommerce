import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSocket } from "../contexts/SocketContext";
import { useNotifications } from "../contexts/NotificationContext";
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Calendar,
  Filter,
  Calculator,
  Wallet,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Pagination from "../components/Pagination";

type BrandRow = {
  brandId: string;
  brandName: string;
  totalOrders?: number;
  totalRevenue: number;
  confirmedRevenue?: number;
  nonConfirmedRevenue?: number;
  completedPayments: number;
  pendingAmount: number;
  paymentStatus: "Pending" | "Partial" | "Completed";
  eligibleOrders?: number;
  eligibleRevenue?: number;
  canPay?: boolean;
  payDisabledReason?: string;
};

type Summary = {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
};

const currency = (n: number) => `₹${n.toLocaleString()}`;

// Utility function to generate weekly intervals (Monday to Sunday)
const generateWeeklyIntervals = (monthsBack = 6) => {
  const intervals = [];
  const today = new Date();
  
  // Start from the beginning of the current week (Monday)
  const currentWeekStart = new Date(today);
  const currentDay = today.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, Monday = 1
  currentWeekStart.setDate(today.getDate() - daysToMonday);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  // Generate intervals going back in time
  for (let i = 0; i < monthsBack * 4; i++) { // Approximate 4 weeks per month
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - (i * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const startStr = weekStart.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short' 
    });
    const endStr = weekEnd.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short' 
    });
    
    intervals.push({
      label: `${startStr} - ${endStr}`,
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`
    });
  }
  
  return intervals;
};

type CancelledOrder = {
  _id: string;
  brandId: { _id: string; name: string } | string;
  user: { _id: string; display_name: string; email: string } | string;
  totalAmount: number;
  refundStatus?: "not_initiated" | "initiated" | "completed";
  razorpayPaymentId?: string | null;
  createdAt: string;
};

const Payments: React.FC = () => {
  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5002/api";
  const { socket } = useSocket?.() as any || { socket: null };
  const { addNotification } = useNotifications?.() as any || { addNotification: () => {} };

  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: "",
    weeklyInterval: "",
    status: "",
  });
  const [showCalc, setShowCalc] = useState<{
    open: boolean;
    brand?: BrandRow;
  }>({ open: false });
  const [calcPercent, setCalcPercent] = useState<number>(15);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "cancelled" | "refunds">("summary");
  const [cancelledOrders, setCancelledOrders] = useState<CancelledOrder[]>([]);
  const [refundLoadingId, setRefundLoadingId] = useState<string | null>(null);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [refundedOrders, setRefundedOrders] = useState<any[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset pagination when switching tabs
  const handleTabChange = (tab: "summary" | "cancelled" | "refunds") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Convert weekly interval to from/to dates
      let params = { ...filters };
      if (filters.weeklyInterval) {
        const [start, end] = filters.weeklyInterval.split('_');
        params.from = start;
        params.to = end;
        // Remove weeklyInterval from params as backend doesn't expect it
        delete params.weeklyInterval;
      }
      
      const [summaryRes, tableRes, cancelledRes, refundReqRes, refundedRes] = await Promise.all([
        axios.get(`${apiUrl}/payments/admin/summary`, { params }),
        axios.get(`${apiUrl}/payments/admin/brand-payments`, {
          params,
        }),
        axios.get(`${apiUrl}/orders/cancelled`, { params }),
        axios.get(`${apiUrl}/orders/refund-approved`, { params }),
        axios.get(`${apiUrl}/orders/refunded`, { params }),
      ]);
      setSummary(summaryRes.data.data);
      setRows(tableRes.data.data);
      setCancelledOrders(cancelledRes.data.orders || []);
      setRefundRequests(refundReqRes.data.orders || []);
      setRefundedOrders(refundedRes.data.orders || []);
    } catch (e) {
      console.error("Failed to load payments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.brand, filters.weeklyInterval, filters.status]);

  // Realtime updates
  useEffect(() => {
    if (!socket) return;
    const onPayment = () => fetchData();
    const onPayout = () => fetchData();
    const onCancelApproved = () => fetchData();
    const onCancelRejected = () => fetchData();
    socket.on("paymentUpdated", onPayment);
    socket.on("payoutUpdated", onPayout);
    socket.on("cancellationApprovedNotification", onCancelApproved);
    socket.on("cancellationRejectedNotification", onCancelRejected);
    return () => {
      socket.off("paymentUpdated", onPayment);
      socket.off("payoutUpdated", onPayout);
      socket.off("cancellationApprovedNotification", onCancelApproved);
      socket.off("cancellationRejectedNotification", onCancelRejected);
    };
  }, [socket]);

  // Budget calculator values
  const calc = useMemo(() => {
    if (!showCalc.brand) return null;
    const totalRevenue = showCalc.brand.eligibleRevenue ?? showCalc.brand.totalRevenue;
    const totalOrders = showCalc.brand.totalOrders ?? Math.max(Math.round(totalRevenue / 1000), 1);
    const deliveryChargeTotal = 100 * totalOrders;
    const razorpayCommission = 0.02 * totalRevenue; // 2%
    const percentCommission = (calcPercent / 100) * totalRevenue; // 15-20%
    const payable = Math.max(
      totalRevenue - razorpayCommission - deliveryChargeTotal - percentCommission,
      0
    );
    return {
      totalOrders,
      totalRevenue,
      confirmedRevenue: showCalc.brand.confirmedRevenue ?? totalRevenue * 0.85,
      nonConfirmedRevenue: showCalc.brand.nonConfirmedRevenue ?? totalRevenue * 0.15,
      deliveryChargeTotal,
      razorpayCommission,
      percentCommission,
      payable,
    };
  }, [showCalc.brand, calcPercent]);

  // Compute payable for a row (used to enable/disable Pay and fix amount)
  const computePayableForRow = (row: BrandRow) => {
    const baseRevenue = (row.eligibleRevenue ?? row.totalRevenue) || 0;
    const totalOrders = row.totalOrders ?? Math.max(Math.round(baseRevenue / 1000), 1);
    const deliveryChargeTotal = 100 * totalOrders;
    const razorpayCommission = 0.02 * baseRevenue;
    const percentCommission = (calcPercent / 100) * baseRevenue;
    const payable = Math.max(baseRevenue - razorpayCommission - deliveryChargeTotal - percentCommission, 0);
    // Round to 2 decimals
    return Math.round(payable * 100) / 100;
  };

  const createRazorpayOrder = async (amount: number) => {
    const res = await axios.post(`${apiUrl}/payments/create-order`, {
      amount,
      currency: "INR",
      receipt: `admin_payout_${Date.now()}`,
    });
    return res.data.order;
  };

  const testPaymentConfig = async () => {
    try {
      const key = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
      if (!key || key.trim().length === 0) {
        throw new Error(
          "VITE_RAZORPAY_KEY_ID is missing in CRM env. Set it in casa-crm/.env"
        );
      }
      const resp = await axios.get(`${apiUrl}/payments/test-config`);
      if (!resp.data?.success) {
        throw new Error(resp.data?.error || "Backend Razorpay not configured");
      }
      return true;
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || String(e);
      alert(
        `Payment configuration error. Please check keys.\n\nDetails: ${msg}`
      );
      return false;
    }
  };

  const verifyPayment = async (
    razorpay_payment_id: string,
    razorpay_order_id: string,
    razorpay_signature: string
  ) => {
    await axios.post(`${apiUrl}/payments/verify`, {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    });
  };

  const recordAdminPayout = async (
    brandId: string,
    amount: number,
    razorpayPaymentId: string
  ) => {
    await axios.post(`${apiUrl}/payments/admin/payout`, {
      brandId,
      amount,
      razorpayPaymentId,
    });
  };

  const refundOrder = async (orderId: string) => {
    setRefundLoadingId(orderId);
    try {
      // Process full refund by default (no browser prompts)
      await axios.patch(`${apiUrl}/orders/${orderId}/refund`);
      await fetchData();
      addNotification({
        type: "success",
        title: "Refund Processed",
        message: "Refund processed successfully.",
        duration: 4000,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Refund failed";
      addNotification({
        type: "error",
        title: "Refund Failed",
        message: msg,
        duration: 5000,
      });
    } finally {
      setRefundLoadingId(null);
    }
  };

  const handlePay = async (row: BrandRow) => {
    try {
      setPayingId(row.brandId);
      const ok = await testPaymentConfig();
      if (!ok) return;
      const payoutAmount = computePayableForRow(row);
      if (payoutAmount <= 0) return;
      const order = await createRazorpayOrder(payoutAmount);

      const rzpOptions: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Admin Payout",
        description: `Payout to ${row.brandName}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await verifyPayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
            await recordAdminPayout(
              row.brandId,
              payoutAmount,
              response.razorpay_payment_id
            );
            await fetchData();
          } catch (e) {
            console.error("Payout verification failed", e);
          }
        },
        theme: { color: "#6d28d9" },
      };

      // @ts-ignore
      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="glass rounded-3xl px-6 py-8 mb-8 border border-white/20">
          {/* Top row: title and tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Payments</h1>
                <p className="text-white/70">Manage brand payouts and revenue</p>
              </div>
            </div>
            <div className="inline-flex bg-white/5 rounded-2xl p-1 ring-1 ring-white/10">
              {[ 
                { key: "summary", label: "Summary" },
                { key: "cancelled", label: "Cancelled Orders" },
                { key: "refunds", label: "Refund Orders" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === (t.key as any)
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters row */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="glass rounded-2xl px-3 h-11 flex items-center border border-white/20 min-w-[220px]">
              <Filter className="w-4 h-4 text-indigo-300 mr-2" />
              <input
                value={filters.brand}
                onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
                placeholder="Filter by brand"
                className="bg-transparent outline-none text-white placeholder-white/60 w-full"
              />
            </div>
            <div className="glass rounded-2xl px-3 h-11 flex items-center border border-white/20">
              <Calendar className="w-4 h-4 text-indigo-300 mr-2" />
              <select
                value={filters.weeklyInterval}
                onChange={(e) => setFilters((f) => ({ ...f, weeklyInterval: e.target.value }))}
                className="bg-transparent outline-none text-white w-full"
              >
                <option value="" className="text-black">All Weekly Intervals</option>
                {generateWeeklyIntervals().map((interval) => (
                  <option key={interval.value} value={interval.value} className="text-black">
                    {interval.label}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="glass rounded-2xl h-11 px-3 border border-white/20 text-white bg-transparent"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Summary Cards or Cancelled */}
        {activeTab === "summary" ? (
          <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass rounded-3xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Total Orders</span>
              <TrendingUp className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">
              {summary ? summary.totalOrders : "—"}
            </div>
          </div>
          <div className="glass rounded-3xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Completed Orders</span>
              <CheckCircle2 className="w-5 h-5 text-green-300" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">
              {summary ? summary.completedOrders : "—"}
            </div>
          </div>
          <div className="glass rounded-3xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Cancelled Orders</span>
              <XCircle className="w-5 h-5 text-rose-300" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">
              {summary ? summary.cancelledOrders : "—"}
            </div>
          </div>
          <div className="glass rounded-3xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Total Revenue</span>
              <IndianRupee className="w-5 h-5 text-amber-300" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">
              {summary ? currency(summary.totalRevenue) : "—"}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-3xl mt-8 border border-white/20 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/80">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
            </div>
          ) : rows.length === 0 && filters.weeklyInterval ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/80">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <Wallet className="w-8 h-8 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Payments Available</h3>
              <p className="text-white/60 text-center max-w-md">
                No brand payments found for the selected weekly interval. Try selecting a different interval or check back later.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                  <tr>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                      Completed Payments
                    </th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                      Pending Amount
                    </th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-5 text-right text-sm font-semibold text-white/90 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(() => {
                    // Calculate pagination for summary table
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedRows = rows.slice(startIndex, endIndex);
                    
                    return paginatedRows.map((row) => (
                      <tr key={row.brandId} className="hover:bg-white/5">
                        <td className="px-8 py-5 text-white">{row.brandName}</td>
                        <td className="px-8 py-5 text-white">{currency(row.totalRevenue)}</td>
                        <td className="px-8 py-5 text-white">{currency(row.completedPayments)}</td>
                        <td className="px-8 py-5 text-white">{currency(row.pendingAmount)}</td>
                        <td className="px-8 py-5">
                          <span
                            className={`inline-flex px-3 py-1 rounded-2xl text-sm font-semibold border ${
                              row.paymentStatus === "Completed"
                                ? "bg-green-500/20 text-green-300 border-green-500/30"
                                : row.paymentStatus === "Partial"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {row.paymentStatus}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end">
                            <div className="inline-flex items-center gap-2 bg-white/5 rounded-3xl p-1 ring-1 ring-white/10 shadow-inner">
                              <button
                                title="Open Budget Calculator"
                                onClick={() => setShowCalc({ open: true, brand: row })}
                                className="inline-flex items-center px-4 py-2 glass rounded-2xl text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
                              >
                                <Calculator className="w-4 h-4 mr-2" />
                                <span>Budget Calculator</span>
                              </button>
                              <button
                                title={row.canPay === false && row.payDisabledReason ? row.payDisabledReason : "Pay brand via Razorpay"}
                                disabled={
                                  payingId === row.brandId ||
                                  computePayableForRow(row) <= 0 ||
                                  row.canPay === false
                                }
                                onClick={() => handlePay(row)}
                                className="inline-flex items-center px-5 py-2 rounded-2xl text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500/50 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {payingId === row.brandId ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <IndianRupee className="w-4 h-4 mr-2" />
                                )}
                                <span>Pay</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination for Summary Tab */}
        {(() => {
          const totalItems = rows.length;
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          
          return totalPages > 1 ? (
            <div className="mt-8 flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            </div>
          ) : null;
        })()}
          </>
        ) : activeTab === "cancelled" ? (
          <>
          <div className="glass rounded-3xl border border-white/20 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-white/80">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
              </div>
            ) : cancelledOrders.length === 0 && filters.weeklyInterval ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/80">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-white/60" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Cancelled Orders</h3>
                <p className="text-white/60 text-center max-w-md">
                  No cancelled orders found for the selected weekly interval.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                    <tr>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Order ID</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Brand</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">User</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Amount</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Refund Status</th>
                      <th className="px-8 py-5 text-right text-sm font-semibold text-white/90 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {(() => {
                      // Calculate pagination for cancelled orders
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedOrders = cancelledOrders.slice(startIndex, endIndex);
                      
                      return paginatedOrders.map((o) => {
                        const brand = o.brandId as any;
                        const user = o.user as any;
                        return (
                          <tr key={o._id} className="hover:bg-white/5">
                            <td className="px-8 py-5 text-white">#{o._id.slice(-8)}</td>
                            <td className="px-8 py-5 text-white">{brand?.name || "—"}</td>
                            <td className="px-8 py-5 text-white">{user?.display_name || user?.email || "—"}</td>
                            <td className="px-8 py-5 text-white">{currency(o.totalAmount || 0)}</td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex px-3 py-1 rounded-2xl text-sm font-semibold border ${
                                o.refundStatus === "completed"
                                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              }`}>
                                {o.refundStatus === "completed" ? "Completed" : "Not Initiated"}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button
                                disabled={o.refundStatus === "completed" || refundLoadingId === o._id}
                                onClick={() => refundOrder(o._id)}
                                className="inline-flex items-center px-5 py-2 rounded-2xl text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {refundLoadingId === o._id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <IndianRupee className="w-4 h-4 mr-2" />
                                )}
                                Refund via Razorpay
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination for Cancelled Orders Tab */}
          {(() => {
            const totalItems = cancelledOrders.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            
            return totalPages > 1 ? (
              <div className="mt-8 flex justify-end">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            ) : null;
          })()}
          </>
        ) : (
          <>
          <div className="glass rounded-3xl border border-white/20 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-white/80">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
              </div>
            ) : (refundRequests.length === 0 && refundedOrders.length === 0) && filters.weeklyInterval ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/80">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <IndianRupee className="w-8 h-8 text-white/60" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Refund Orders</h3>
                <p className="text-white/60 text-center max-w-md">
                  No refund orders found for the selected weekly interval.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                    <tr>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Order ID</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Brand</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">User</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Amount</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Refund Status</th>
                      <th className="px-8 py-5 text-right text-sm font-semibold text-white/90 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {(() => {
                      // Combine refund requests and refunded orders for pagination
                      const allRefundOrders = [...refundRequests, ...refundedOrders];
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedOrders = allRefundOrders.slice(startIndex, endIndex);
                      
                      return paginatedOrders.map((o) => {
                        const brand = o.brandId as any;
                        const user = o.user as any;
                        const isRefunded = refundedOrders.includes(o);
                        const refundedAmount = o.refundedAmount || 0;
                        const totalAmount = o.totalAmount || 0;
                        const isPartialRefund = refundedAmount < totalAmount;
                        
                        return (
                          <tr key={`${isRefunded ? 'completed' : 'pending'}-${o._id}`} className="hover:bg-white/5">
                            <td className="px-8 py-5 text-white">#{o._id.slice(-8)}</td>
                            <td className="px-8 py-5 text-white">{brand?.name || "—"}</td>
                            <td className="px-8 py-5 text-white">{user?.display_name || user?.email || "—"}</td>
                            <td className="px-8 py-5 text-white">{currency(totalAmount)}</td>
                            <td className="px-8 py-5">
                              {isRefunded ? (
                                <span className={`inline-flex px-3 py-1 rounded-2xl text-sm font-semibold border ${
                                  o.refundStatus === "completed" || o.status === "refunded"
                                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                                    : isPartialRefund
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                }`}>
                                  {o.refundStatus === "completed" || o.status === "refunded"
                                    ? "Completed"
                                    : isPartialRefund
                                    ? "Partial Refund"
                                    : "Refunded"
                                  }
                                </span>
                              ) : (
                                <span className="inline-flex px-3 py-1 rounded-2xl text-sm font-semibold border bg-amber-500/20 text-amber-300 border-amber-500/30">
                                  Pending Approval
                                </span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right">
                              {isRefunded ? (
                                <span className="text-white/60 text-sm">Already Processed</span>
                              ) : (
                                <button
                                  disabled={o.refundStatus === "completed" || refundLoadingId === o._id}
                                  onClick={() => refundOrder(o._id)}
                                  className="inline-flex items-center px-5 py-2 rounded-2xl text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {refundLoadingId === o._id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <IndianRupee className="w-4 h-4 mr-2" />
                                  )}
                                  Refund via Razorpay
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                    {refundRequests.length === 0 && refundedOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center text-white/60">
                          No refund orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination for Refund Orders Tab */}
          {(() => {
            const allRefundOrders = [...refundRequests, ...refundedOrders];
            const totalItems = allRefundOrders.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            
            return totalPages > 1 ? (
              <div className="mt-8 flex justify-end">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            ) : null;
          })()}
          </>
        )}

        {/* Budget Calculator Modal */}
        {showCalc.open && showCalc.brand && calc && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass rounded-3xl w-full max-w-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Budget Calculator</h3>
                    <p className="text-white/70 text-sm">{showCalc.brand.brandName}</p>
                  </div>
                </div>
                <button
                  className="glass rounded-xl px-3 py-2 text-white/80 hover:bg-white/10"
                  onClick={() => setShowCalc({ open: false })}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-white/70">Total Orders</div>
                  <div className="text-2xl text-white font-semibold">{calc.totalOrders}</div>
                </div>
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-white/70">Total Revenue</div>
                  <div className="text-2xl text-white font-semibold">{currency(calc.totalRevenue)}</div>
                </div>
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-white/70">Confirmed Order Revenue</div>
                  <div className="text-2xl text-white font-semibold">{currency(calc.confirmedRevenue)}</div>
                </div>
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-white/70">Non-Confirmed Order Revenue</div>
                  <div className="text-2xl text-white font-semibold">{currency(calc.nonConfirmedRevenue)}</div>
                </div>
              </div>

              {/* Formula & breakdown */}
              <div className="glass rounded-2xl p-4 border border-white/10 mb-4">
                <div className="text-white/80 font-semibold mb-2">Payable Formula</div>
                <div className="text-white/70 text-sm leading-6">
                  Payable = Total Revenue − (Razorpay 2% per order) − (₹100 delivery per order) − (15%–20% commission)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-white/70">Razorpay 2% Commission</div>
                  <div className="text-xl text-white font-semibold">{currency(calc.razorpayCommission)}</div>
                </div>
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-white/70">Delivery Charge (₹100 x {calc.totalOrders})</div>
                  <div className="text-xl text-white font-semibold">{currency(calc.deliveryChargeTotal)}</div>
                </div>
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-white/70">Commission Fee (Adjust 15%–20%)</div>
                  <div className="flex items-center space-x-3 mt-2">
                    <input
                      type="range"
                      min={15}
                      max={20}
                      step={1}
                      value={calcPercent}
                      onChange={(e) => setCalcPercent(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="w-16 text-right text-white font-semibold">{calcPercent}%</div>
                  </div>
                  <div className="text-sm text-white/70 mt-1">{currency(calc.percentCommission)}</div>
                </div>
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-white/70">Payable Amount</div>
                  <div className="text-2xl text-white font-bold">{currency(calc.payable)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-white/60 text-sm flex items-center">
                  <ExternalLink className="w-4 h-4 mr-2" /> Adjust commission between 15%–20% as needed
                </div>
                <div className="space-x-3">
                  <button
                    className="glass rounded-2xl px-4 py-2 text-white/80 hover:bg-white/10"
                    onClick={() => setShowCalc({ open: false })}
                  >
                    Close
                  </button>
                  <button
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl px-4 py-2 text-white"
                    onClick={() => setShowCalc({ open: false, brand: showCalc.brand })}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;