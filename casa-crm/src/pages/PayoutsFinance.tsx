import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Download,
  FileText,
  BarChart3,
  Loader2,
  Clock,
  AlertCircle,
  DollarSign,
  Percent,
  Truck,
  Eye,
  EyeOff,
} from "lucide-react";

type PayoutSummary = {
  totalOrders: number;
  grossSales: number;
  casaCommission: number;
  deliveryFees: number;
  finalPayout: number;
  paidAmount: number;
  pendingAmount: number;
  failedAmount: number;
};

type Transaction = {
  _id: string;
  orderId: string;
  item: string;
  salePrice: number;
  commissionPercent: number;
  deliveryFee: number;
  netAmount: number;
  status: "Paid" | "Pending" | "Failed";
  createdAt: string;
  brandName: string;
};

type PayoutStatus = {
  paid: number;
  pending: number;
  failed: number;
  total: number;
};

const currency = (n: number) => `₹${n.toLocaleString()}`;

const PayoutsFinance: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "transactions" | "status"
  >("dashboard");
  const [filters, setFilters] = useState({
    brand: "",
    from: "",
    to: "",
    status: "",
  });
  const [showDetails, setShowDetails] = useState(false);

  // Fetch data from real backend APIs
  const fetchData = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.from) queryParams.append("from", filters.from);
      if (filters.to) queryParams.append("to", filters.to);
      if (filters.brand) queryParams.append("brand", filters.brand);
      if (filters.status) queryParams.append("status", filters.status);

      const queryString = queryParams.toString();
      const baseUrl = `${apiUrl}/payments/payouts-finance`;

      // Fetch all data in parallel
      const [summaryRes, transactionsRes, statusRes] = await Promise.all([
        axios.get(`${baseUrl}/summary?${queryString}`),
        axios.get(`${baseUrl}/transactions?${queryString}`),
        axios.get(`${baseUrl}/status?${queryString}`),
      ]);

      // Set the data from API responses
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      } else {
        console.error("Failed to fetch summary:", summaryRes.data.error);
        setSummary(null);
      }

      if (transactionsRes.data.success) {
        setTransactions(transactionsRes.data.data);
      } else {
        console.error(
          "Failed to fetch transactions:",
          transactionsRes.data.error
        );
        setTransactions([]);
      }

      if (statusRes.data.success) {
        setPayoutStatus(statusRes.data.data);
      } else {
        console.error("Failed to fetch status:", statusRes.data.error);
        setPayoutStatus(null);
      }
    } catch (error) {
      console.error("Failed to load payouts data:", error);
      // Set empty data on error
      setSummary(null);
      setTransactions([]);
      setPayoutStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.brand, filters.from, filters.to, filters.status, fetchData]);

  const handleExport = (
    format: "csv" | "excel",
    period: "weekly" | "monthly"
  ) => {
    // Mock export functionality
    console.log(`Exporting ${format} for ${period} period`);
    // In a real implementation, this would call an API endpoint
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Paid: {
        bg: "bg-green-500/20",
        text: "text-green-300",
        border: "border-green-500/30",
        icon: CheckCircle2,
      },
      Pending: {
        bg: "bg-amber-500/20",
        text: "text-amber-300",
        border: "border-amber-500/30",
        icon: Clock,
      },
      Failed: {
        bg: "bg-red-500/20",
        text: "text-red-300",
        border: "border-red-500/30",
        icon: XCircle,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-2xl text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="glass rounded-3xl px-6 py-8 mb-8 border border-white/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Payouts & Finance
                </h1>
                <p className="text-white/70">
                  Manage brand settlements and financial transactions
                </p>
              </div>
            </div>
            <div className="inline-flex bg-white/5 rounded-2xl p-1 ring-1 ring-white/10">
              {[
                { key: "dashboard", label: "Dashboard" },
                { key: "transactions", label: "Transactions" },
                { key: "status", label: "Status" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
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
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass rounded-2xl px-3 h-11 flex items-center border border-white/20 min-w-[220px]">
              <Filter className="w-4 h-4 text-indigo-300 mr-2" />
              <input
                value={filters.brand}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, brand: e.target.value }))
                }
                placeholder="Filter by brand"
                className="bg-transparent outline-none text-white placeholder-white/60 w-full"
              />
            </div>
            <div className="glass rounded-2xl px-3 h-11 flex items-center border border-white/20">
              <Calendar className="w-4 h-4 text-indigo-300 mr-2" />
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, from: e.target.value }))
                }
                placeholder="From date"
                className="bg-transparent outline-none text-white placeholder-white/60 w-full"
              />
            </div>
            <div className="glass rounded-2xl px-3 h-11 flex items-center border border-white/20">
              <Calendar className="w-4 h-4 text-indigo-300 mr-2" />
              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, to: e.target.value }))
                }
                placeholder="To date"
                className="bg-transparent outline-none text-white placeholder-white/60 w-full"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="glass rounded-2xl h-11 px-3 border border-white/20 text-white bg-transparent"
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Weekly Settlement Dashboard */}
            <div className="glass rounded-3xl p-8 mb-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Weekly Settlement Dashboard
                </h2>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center px-4 py-2 glass rounded-2xl text-white/80 hover:bg-white/10 transition-all duration-300"
                >
                  {showDetails ? (
                    <EyeOff className="w-4 h-4 mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  {showDetails ? "Hide Details" : "Show Details"}
                </button>
              </div>

              {loading ? (
                <div className="col-span-full flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mr-3" />
                  <span className="text-white/70">
                    Loading dashboard data...
                  </span>
                </div>
              ) : !summary ? (
                <div className="col-span-full text-center py-16">
                  <div className="w-16 h-16 glass rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    No Data Found
                  </h3>
                  <p className="text-white/70">
                    No payout data available for the selected criteria.
                  </p>
                  <p className="text-white/50 text-sm mt-2">
                    Debug: API returned null/empty data
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Orders Delivered</span>
                      <TrendingUp className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div className="text-3xl font-bold text-white mt-2">
                      {summary.totalOrders.toLocaleString()}
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      Total completed orders
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Gross Sales</span>
                      <DollarSign className="w-5 h-5 text-green-300" />
                    </div>
                    <div className="text-3xl font-bold text-white mt-2">
                      {currency(summary.grossSales)}
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      Total revenue generated
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Casa Commission</span>
                      <Percent className="w-5 h-5 text-amber-300" />
                    </div>
                    <div className="text-3xl font-bold text-white mt-2">
                      {currency(summary.casaCommission)}
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      15% platform fee
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Delivery Fees</span>
                      <Truck className="w-5 h-5 text-blue-300" />
                    </div>
                    <div className="text-3xl font-bold text-white mt-2">
                      {currency(summary.deliveryFees)}
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      ₹100 per order
                    </div>
                  </div>
                </div>
              )}

              {/* Final Payout Calculation */}
              {summary && (
                <div className="mt-8 glass rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Final Payout to Brands
                      </h3>
                      <p className="text-white/70">
                        Amount brands receive after deductions
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-white">
                        {currency(summary.finalPayout)}
                      </div>
                      <div className="text-sm text-white/60 mt-1">
                        {summary.grossSales > 0
                          ? `${(
                              (summary.finalPayout / summary.grossSales) *
                              100
                            ).toFixed(1)}% of gross sales`
                          : "0% of gross sales"}
                      </div>
                    </div>
                  </div>

                  {showDetails && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="glass rounded-xl p-4 border border-white/5">
                        <div className="text-white/70 text-sm">
                          Calculation Formula
                        </div>
                        <div className="text-white text-sm mt-2">
                          Final Payout = Gross Sales - Casa Commission -
                          Delivery Fees
                        </div>
                      </div>
                      <div className="glass rounded-xl p-4 border border-white/5">
                        <div className="text-white/70 text-sm">Breakdown</div>
                        <div className="text-white text-sm mt-2 space-y-1">
                          <div>Gross Sales: {currency(summary.grossSales)}</div>
                          <div>
                            Casa Commission: -{currency(summary.casaCommission)}
                          </div>
                          <div>
                            Delivery Fees: -{currency(summary.deliveryFees)}
                          </div>
                        </div>
                      </div>
                      <div className="glass rounded-xl p-4 border border-white/5">
                        <div className="text-white/70 text-sm">Net Amount</div>
                        <div className="text-2xl font-bold text-white mt-2">
                          {currency(summary.finalPayout)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="glass rounded-3xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">
                Export Options
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => handleExport("csv", "weekly")}
                  className="flex items-center justify-center px-6 py-4 glass rounded-2xl text-white hover:bg-white/10 transition-all duration-300 border border-white/20"
                >
                  <FileText className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Weekly CSV</div>
                    <div className="text-sm text-white/60">
                      Download weekly data
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("excel", "weekly")}
                  className="flex items-center justify-center px-6 py-4 glass rounded-2xl text-white hover:bg-white/10 transition-all duration-300 border border-white/20"
                >
                  <Download className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Weekly Excel</div>
                    <div className="text-sm text-white/60">
                      Download weekly data
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("csv", "monthly")}
                  className="flex items-center justify-center px-6 py-4 glass rounded-2xl text-white hover:bg-white/10 transition-all duration-300 border border-white/20"
                >
                  <FileText className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Monthly CSV</div>
                    <div className="text-sm text-white/60">
                      Download monthly data
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("excel", "monthly")}
                  className="flex items-center justify-center px-6 py-4 glass rounded-2xl text-white hover:bg-white/10 transition-all duration-300 border border-white/20"
                >
                  <Download className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Monthly Excel</div>
                    <div className="text-sm text-white/60">
                      Download monthly data
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="glass rounded-3xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                Transaction Breakdown
              </h2>
              <p className="text-white/70 mt-2">
                Detailed view of all transactions and payouts
              </p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-white/80">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 glass rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No Transactions Found
                </h3>
                <p className="text-white/70">
                  No transaction data available for the selected criteria.
                </p>
                <p className="text-white/50 text-sm mt-2">
                  Debug: API returned empty transactions array
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                    <tr>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Sale Price
                      </th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Commission %
                      </th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Delivery Fee
                      </th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Net Amount
                      </th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-white/5">
                        <td className="px-8 py-5 text-white font-mono">
                          #{transaction.orderId}
                        </td>
                        <td className="px-8 py-5 text-white">
                          {transaction.brandName}
                        </td>
                        <td className="px-8 py-5 text-white">
                          {transaction.item}
                        </td>
                        <td className="px-8 py-5 text-white">
                          {currency(transaction.salePrice)}
                        </td>
                        <td className="px-8 py-5 text-white">
                          {transaction.commissionPercent}%
                        </td>
                        <td className="px-8 py-5 text-white">
                          {currency(transaction.deliveryFee)}
                        </td>
                        <td className="px-8 py-5 text-white font-semibold">
                          {currency(transaction.netAmount)}
                        </td>
                        <td className="px-8 py-5">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="px-8 py-5 text-white/70">
                          {formatDate(transaction.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Status Tab */}
        {activeTab === "status" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mr-3" />
                <span className="text-white/70">Loading status data...</span>
              </div>
            ) : !payoutStatus ? (
              <div className="col-span-full text-center py-16">
                <div className="w-16 h-16 glass rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No Status Data Found
                </h3>
                <p className="text-white/70">
                  No payout status data available for the selected criteria.
                </p>
                <p className="text-white/50 text-sm mt-2">
                  Debug: API returned null/empty status data
                </p>
              </div>
            ) : (
              <>
                {/* Payout Status Overview */}
                <div className="glass rounded-3xl p-8 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Payout Status Overview
                  </h2>
                  <div className="space-y-6">
                    <div className="glass rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle2 className="w-8 h-8 text-green-400 mr-4" />
                          <div>
                            <div className="text-white/70">Paid</div>
                            <div className="text-2xl font-bold text-white">
                              {currency(payoutStatus.paid)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white/60">
                            {payoutStatus.total > 0
                              ? `${(
                                  (payoutStatus.paid / payoutStatus.total) *
                                  100
                                ).toFixed(1)}%`
                              : "0%"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="w-8 h-8 text-amber-400 mr-4" />
                          <div>
                            <div className="text-white/70">Pending</div>
                            <div className="text-2xl font-bold text-white">
                              {currency(payoutStatus.pending)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white/60">
                            {payoutStatus.total > 0
                              ? `${(
                                  (payoutStatus.pending / payoutStatus.total) *
                                  100
                                ).toFixed(1)}%`
                              : "0%"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <XCircle className="w-8 h-8 text-red-400 mr-4" />
                          <div>
                            <div className="text-white/70">Failed</div>
                            <div className="text-2xl font-bold text-white">
                              {currency(payoutStatus.failed)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white/60">
                            {payoutStatus.total > 0
                              ? `${(
                                  (payoutStatus.failed / payoutStatus.total) *
                                  100
                                ).toFixed(1)}%`
                              : "0%"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Summary */}
                <div className="glass rounded-3xl p-8 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Status Summary
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 glass rounded-2xl border border-white/10">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-400 rounded-full mr-3"></div>
                        <span className="text-white">
                          Successfully Processed
                        </span>
                      </div>
                      <span className="text-white font-semibold">
                        {payoutStatus.total > 0
                          ? `${(
                              (payoutStatus.paid / payoutStatus.total) *
                              100
                            ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 glass rounded-2xl border border-white/10">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-amber-400 rounded-full mr-3"></div>
                        <span className="text-white">Processing</span>
                      </div>
                      <span className="text-white font-semibold">
                        {payoutStatus.total > 0
                          ? `${(
                              (payoutStatus.pending / payoutStatus.total) *
                              100
                            ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 glass rounded-2xl border border-white/10">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-400 rounded-full mr-3"></div>
                        <span className="text-white">Failed</span>
                      </div>
                      <span className="text-white font-semibold">
                        {payoutStatus.total > 0
                          ? `${(
                              (payoutStatus.failed / payoutStatus.total) *
                              100
                            ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 p-6 glass rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/70">Total Payout Amount</span>
                      <span className="text-2xl font-bold text-white">
                        {currency(payoutStatus.total)}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                        style={{
                          width:
                            payoutStatus.total > 0
                              ? `${
                                  (payoutStatus.paid / payoutStatus.total) * 100
                                }%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-white/60 mt-2">
                      <span>Paid: {currency(payoutStatus.paid)}</span>
                      <span>
                        Remaining:{" "}
                        {currency(payoutStatus.pending + payoutStatus.failed)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutsFinance;
