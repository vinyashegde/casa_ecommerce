import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MessageSquare,
  X,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import axios from "axios";

/* ================= Types ================= */
interface Decimal128Like {
  $numberDecimal: string;
}
type MaybeDecimal = number | string | Decimal128Like | null | undefined;

interface OrderProduct {
  product?: {
    _id: string;
    name: string;
    price: MaybeDecimal;
    images: string[];
  } | null;
  name: string;
  quantity: number;
  price: MaybeDecimal;
  size: string;
  _cancelRequested?: boolean;
}

interface Order {
  _id: string; // Casa id
  user: { _id: string; display_name: string; email: string; phone: string };
  products: OrderProduct[];
  deliveryStatus: string;
  paymentStatus: string;
  totalAmount: MaybeDecimal;
  address: string;
  estimatedDelivery: string;
  createdAt: string;
  deliveredAt?: string;
  paymentId?: string;
  status?:
    | "pending"
    | "completed"
    | "cancel_requested"
    | "cancelled"
    | "cancel_rejected"
    | "refund_requested"
    | "refund_rejected";
  refundStatus?: "not_initiated" | "initiated" | "completed";
}

/* ================= Helpers ================= */
const toNumber = (v: MaybeDecimal): number => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[₹,\s]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof v === "object" && "$numberDecimal" in v) {
    const n = parseFloat((v as Decimal128Like).$numberDecimal);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v as any);
  return Number.isFinite(n) ? n : 0;
};

const fmtINR = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

/* ================= API base ================= */
const RAW = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5002";
const API_BASE: string = RAW.endsWith("/api")
  ? RAW
  : `${String(RAW).replace(/\/+$/, "")}/api`;

// Shiprocket integration removed - orders handled directly by Casa CRM

// Shiprocket integration removed

// Shiprocket integration removed

// Shiprocket integration removed

// Shiprocket integration removed

// Shiprocket integration removed

/* ================= Component ================= */
const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUser();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<
    number | null
  >(null);
  const [cancelReason, setCancelReason] = useState("");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [customRefundReason, setCustomRefundReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Shiprocket integration removed - orders handled directly by Casa CRM

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData._id) {
        setError("User not found");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/orders/user/${userData._id}`);
        if (res.data?.success) {
          setOrders(res.data.orders || []);
        } else {
          setError("Failed to fetch orders");
        }
      } catch (e) {
        console.error(e);
        setError("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userData._id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle size={20} className="text-green-500" />;
      case "Out for Delivery":
      case "Shipped":
        return <Truck size={20} className="text-blue-500" />;
      case "Processing":
      case "Accepted":
        return <Clock size={20} className="text-yellow-500" />;
      case "Cancelled":
        return <AlertCircle size={20} className="text-red-500" />;
      case "Cancellation Requested":
        return <Clock size={20} className="text-orange-500" />;
      default:
        return <Package size={20} className="text-gray-500" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-green-500";
      case "Out for Delivery":
      case "Shipped":
        return "text-blue-500";
      case "Processing":
      case "Accepted":
        return "text-yellow-500";
      case "Cancelled":
        return "text-red-500";
      case "Cancellation Requested":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };
  const formatDate = (s: string) =>
    new Date(s).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const isProductCancellable = (order: Order) => {
    const blocked = new Set([
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Cancellation Requested",
    ]);
    return !blocked.has(order.deliveryStatus);
  };

  // Shiprocket integration removed - orders handled directly by Casa CRM

  /** Open cancellation modal */
  const handleCancelProduct = (
    order: Order,
    _productId?: string,
    productIndex?: number
  ) => {
    // Check if order is shipped or delivered - cannot cancel
    if (
      order.deliveryStatus === "Shipped" ||
      order.deliveryStatus === "Out for Delivery" ||
      order.deliveryStatus === "Delivered"
    ) {
      setToastMessage(
        "Cannot cancel this item. Order has already been shipped or delivered."
      );
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
      return;
    }

    setSelectedOrder(order);
    setSelectedProductIndex(productIndex || null);
    setCancelReason("");
    setCustomCancelReason("");
    setShowCancelModal(true);
  };

  /** Submit cancellation request */
  const handleSubmitCancellation = async () => {
    if (!selectedOrder) return;

    setIsSubmitting(true);

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o._id === selectedOrder._id
          ? {
              ...o,
              products: o.products.map((p, i) => {
                const match =
                  selectedProductIndex !== null
                    ? i === selectedProductIndex
                    : false;
                return match ? { ...p, _cancelRequested: true } : p;
              }),
            }
          : o
      )
    );

    try {
      // Call Casa CRM API to create cancellation request
      await axios.post(`${API_BASE}/cancel-requests/create`, {
        orderId: selectedOrder._id,
        productId:
          selectedOrder.products[selectedProductIndex || 0]?.product?._id,
        productIndex: selectedProductIndex,
        reason: cancelReason === "Other" ? customCancelReason || "Other" : cancelReason || null,
      });

      // Update order status to show cancellation requested
      setOrders((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id
            ? { ...o, deliveryStatus: "Cancellation Requested", status: "cancel_requested" }
            : o
        )
      );

      // Show success toast
      setToastMessage(
        "Cancellation request submitted successfully. You will be notified once it's processed."
      );
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);

      // Close modal
      setShowCancelModal(false);
      setSelectedOrder(null);
      setSelectedProductIndex(null);
      setCancelReason("");
      setCustomCancelReason("");
    } catch (e: any) {
      console.error("Cancellation request failed:", e?.response?.data || e);

      // Show error toast
      setToastMessage(
        "Failed to submit cancellation request. Please contact support."
      );
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);

      // Rollback optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id
            ? {
                ...o,
                products: o.products.map((p, i) => {
                  const match =
                    selectedProductIndex !== null
                      ? i === selectedProductIndex
                      : false;
                  return match ? { ...p, _cancelRequested: false } : p;
                }),
              }
            : o
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine delayed orders: Delivered and (deliveredAt > estimatedDelivery) or (now > estimatedDelivery if deliveredAt not recorded)
  const isDelayedOrder = (order: Order) => {
    // Debug logging
    console.log("Checking order for delay:", {
      orderId: order._id,
      deliveryStatus: order.deliveryStatus,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      status: order.status
    });

    if (order.deliveryStatus !== "Delivered") return false;
    if (!order.estimatedDelivery) return false;
    
    const est = new Date(order.estimatedDelivery).getTime();
    if (order.deliveredAt) {
      const delivered = new Date(order.deliveredAt).getTime();
      const isDelayed = delivered > est;
      console.log("Order delay check (with deliveredAt):", {
        estimated: new Date(order.estimatedDelivery).toISOString(),
        delivered: new Date(order.deliveredAt).toISOString(),
        isDelayed
      });
      return isDelayed;
    }
    
    const isDelayed = Date.now() > est;
    console.log("Order delay check (without deliveredAt):", {
      estimated: new Date(order.estimatedDelivery).toISOString(),
      now: new Date().toISOString(),
      isDelayed
    });
    return isDelayed;
  };

  const openRefundModal = (order: Order) => {
    setSelectedOrder(order);
    setRefundReason("Delayed Order Refund");
    setShowRefundModal(true);
  };

  const submitRefundRequest = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    
    const finalReason = refundReason === "Other" ? customRefundReason.trim() : refundReason;
    
    const requestData = {
      reason: finalReason || "Product return request",
    };
    
    console.log("Submitting refund request:", {
      orderId: selectedOrder._id,
      apiUrl: `${API_BASE}/orders/${selectedOrder._id}/refund-request`,
      requestData,
      apiBase: API_BASE
    });
    
    try {
      const response = await axios.patch(`${API_BASE}/orders/${selectedOrder._id}/refund-request`, requestData);
      console.log("Refund request successful:", response.data);
      
      setOrders((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id
            ? { ...o, status: "refund_requested" as Order["status"] }
            : o
        )
      );
      setToastMessage("Refund request submitted successfully.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
      setShowRefundModal(false);
      setSelectedOrder(null);
    } catch (e: any) {
      console.error("Refund request failed:", e.response?.data || e.message);
      setToastMessage(`Failed to submit refund request: ${e.response?.data?.error || e.message}`);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate("/profile");

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  My Orders
                </h1>
                <p className="text-sm text-gray-400">Loading...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
            </div>
            <p className="text-gray-400">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  My Orders
                </h1>
                <p className="text-sm text-gray-400">Error occurred</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                My Orders
              </h1>
              <p className="text-sm text-gray-400">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 py-6 space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={40} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              No Orders Yet
            </h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
              Start shopping to see your orders here
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const totalAmountNum = toNumber(order.totalAmount);
              return (
                <div
                  key={order._id}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                        <Package size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          Order #{order._id.slice(-8)}
                        </p>
                        <p className="font-semibold text-white">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.deliveryStatus)}
                        <span className={`text-sm font-medium ${getStatusColor(order.deliveryStatus)}`}>
                          {order.status === "cancelled"
                            ? "Order cancelled successfully"
                            : order.status === "cancel_rejected"
                            ? "Cancellation rejected by brand"
                            : order.status === "refund_requested"
                            ? "Refund requested"
                            : order.status === "refund_approved"
                            ? "Refund approved"
                            : order.status === "refunded"
                            ? "Refunded"
                            : order.status === "refund_rejected"
                            ? "Refund rejected"
                            : order.deliveryStatus}
                        </span>
                        {isDelayedOrder(order) && (
                          <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Delayed Order
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="space-y-4 mb-6">
                    {order.products.map((p, idx) => {
                      const showCancel = isProductCancellable(order);
                      const disabled = p._cancelRequested || !showCancel;

                      const imgSrc =
                        p.product?.images?.[0] ||
                        "https://placehold.co/80x80/1f2937/ffffff?text=Item";
                      const title =
                        p.product?.name || p.name || "Item unavailable";
                      const priceValNum =
                        toNumber(p.product?.price) || toNumber(p.price);

                      return (
                        <div
                          key={idx}
                          className="relative flex items-center space-x-4 bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 hover:bg-gray-700/50 transition-all duration-200"
                        >
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={imgSrc}
                              alt={title}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  "https://placehold.co/80x80/1f2937/ffffff?text=Item";
                              }}
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm mb-1 truncate">
                              {title}
                            </h3>
                            <div className="flex items-center space-x-3 text-xs text-gray-400 mb-2">
                              <span>Size: {p.size || "—"}</span>
                              <span>•</span>
                              <span>Qty: {p.quantity}</span>
                            </div>
                            <p className="text-sm font-medium text-green-400">
                              ₹{fmtINR(priceValNum)}
                            </p>
                            {!p.product && (
                              <p className="text-xs text-amber-400 mt-1">
                                Product was removed
                              </p>
                            )}
                          </div>

                          {/* Cancel Button */}
                          <div className="flex-shrink-0">
                            <button
                              disabled={disabled}
                              onClick={() =>
                                handleCancelProduct(order, p.product?._id, idx)
                              }
                              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                disabled
                                  ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                                  : "bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30"
                              }`}
                              title={
                                p._cancelRequested
                                  ? "Cancellation already requested"
                                  : showCancel
                                  ? "Cancel this item"
                                  : "Item cannot be cancelled at this stage"
                              }
                            >
                              <XCircle size={14} />
                              {p._cancelRequested
                                ? "Requested"
                                : order.deliveryStatus ===
                                  "Cancellation Requested"
                                ? "Requested"
                                : "Cancel"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-gray-700/50 pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-8">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Payment</p>
                          <div className="flex items-center space-x-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                order.paymentStatus === "Paid"
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                              }`}
                            ></div>
                            <span
                              className={`text-sm font-medium ${
                                order.paymentStatus === "Paid"
                                  ? "text-green-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Delivery</p>
                          <p className="text-sm text-gray-300">
                            {formatDate(order.estimatedDelivery)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                          <p className="text-xl font-bold text-white">
                            ₹{fmtINR(totalAmountNum)}
                          </p>
                        </div>
                        {order.status === "cancelled" && (
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">Refund</p>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.refundStatus === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : order.refundStatus === "initiated"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-yellow-500/20 text-yellow-300"
                              }`}
                            >
                              {order.refundStatus === "completed"
                                ? "Completed"
                                : order.refundStatus === "initiated"
                                ? "Initiated"
                                : "Not Initiated"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end ml-4">
                        
                        {/* Debug info */}
                        {order.deliveryStatus === "Delivered" && (
                          <div className="mb-3 text-xs text-gray-500">
                            Debug: {isDelayedOrder(order) ? "Delayed" : "Not delayed"} | Status: {order.status || "none"}
                          </div>
                        )}
                        
                        {/* Action buttons section with improved styling */}
                        <div className="space-y-3 w-full flex flex-col items-end">
                          {/* Show refund button for delivered orders that haven't been refunded */}
                          {order.deliveryStatus === "Delivered" && 
                           order.status !== "refund_requested" && 
                           order.status !== "refund_approved" && 
                           order.status !== "refunded" && (
                            <button
                              onClick={() => openRefundModal(order)}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-500/90 to-orange-500/90 hover:from-red-500 hover:to-orange-500 text-white text-xs font-semibold border border-red-400/20 hover:border-red-400/40 transform hover:scale-[1.01] transition-all duration-200 shadow-md hover:shadow-lg shadow-red-500/20 flex items-center justify-center gap-1 group backdrop-blur-sm"
                            >
                              <svg className="w-3 h-3 group-hover:rotate-6 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                              </svg>
                              Return & Refund
                            </button>
                          )}
                          
                          {/* Status indicators with improved design */}
                          {order.status === "refund_requested" && (
                            <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 backdrop-blur-sm text-sm">
                              <svg className="w-3.5 h-3.5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="font-medium">Refund Requested</span>
                            </div>
                          )}
                          
                          {order.status === "refund_approved" && (
                            <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 backdrop-blur-sm text-sm">
                              <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Refund Approved</span>
                            </div>
                          )}
                          
                          {order.status === "refunded" && (
                            <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-500/10 text-green-300 border border-green-500/20 backdrop-blur-sm text-sm">
                              <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span className="font-medium">Amount Refunded</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl p-4 max-w-sm w-full border-t sm:border border-gray-700 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Cancel Order Item
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 mb-3 text-sm">
                Are you sure you want to cancel this item? This request will be
                reviewed by Casa CRM.
              </p>

              {selectedProductIndex !== null &&
                selectedOrder.products[selectedProductIndex] && (
                  <div className="bg-gray-700 rounded-lg p-2.5 mb-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          selectedOrder.products[selectedProductIndex].product
                            ?.images?.[0] ||
                          "https://placehold.co/60x60/1f2937/ffffff?text=Product"
                        }
                        alt={selectedOrder.products[selectedProductIndex].name}
                        className="w-10 h-10 object-cover rounded-lg"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://placehold.co/60x60/1f2937/ffffff?text=Product";
                        }}
                      />
                      <div>
                        <p className="font-semibold text-white text-xs">
                          {selectedOrder.products[selectedProductIndex].name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Size:{" "}
                          {selectedOrder.products[selectedProductIndex].size} |
                          Qty:{" "}
                          {
                            selectedOrder.products[selectedProductIndex]
                              .quantity
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              <div>
                <label className="block text-xs text-gray-300 mb-2">
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  Select Cancellation Reason
                </label>
                <div className="space-y-1.5">
                  {[
                    "Want to change the item/variant",
                    "Product is not required anymore",
                    "Order placed by mistake",
                    "Found cheaper price elsewhere",
                    "Expected delivery time is too long",
                    "Payment issues/Changed payment method",
                    "Other"
                  ].map((reason) => (
                    <label key={reason} className="flex items-center gap-2.5 p-2 bg-gray-700 rounded-md hover:bg-gray-600 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={cancelReason === reason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-3.5 h-3.5 text-red-500 bg-gray-600 border-gray-500 focus:ring-red-500 focus:ring-1"
                      />
                      <span className="text-gray-300 text-xs leading-tight">{reason}</span>
                    </label>
                  ))}
                </div>
                {cancelReason === "Other" && (
                  <div className="mt-2">
                    <textarea
                      value={customCancelReason}
                      onChange={(e) => setCustomCancelReason(e.target.value)}
                      placeholder="Please provide a specific reason..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 text-xs resize-none"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-3 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-500 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCancellation}
                disabled={isSubmitting || !cancelReason || (cancelReason === "Other" && !customCancelReason.trim())}
                className="flex-1 px-3 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl p-4 max-w-sm w-full border-t sm:border border-gray-700 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Return & Refund
              </h3>
              <button onClick={() => setShowRefundModal(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-4 text-sm">
              Request a refund for this delivered order. Your request will be reviewed by the brand.
            </p>

            {/* Refund Reasons */}
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-300">Select reason for refund:</p>
              {[
                "Product received is damaged/defective",
                "Wrong product delivered",
                "Product doesn't match description",
                "Size/fit issues",
                "Quality not as expected",
                "Changed my mind",
                "Other"
              ].map((reason) => (
                <label key={reason} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="refundReason"
                    value={reason}
                    checked={refundReason === reason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="mt-1 w-4 h-4 text-green-500 bg-gray-700 border-gray-600 focus:ring-green-500/20 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300 leading-relaxed">{reason}</span>
                </label>
              ))}
            </div>

            {/* Custom reason textarea */}
            {refundReason === "Other" && (
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Please specify:</label>
                <textarea
                  value={customRefundReason}
                  onChange={(e) => setCustomRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-sm resize-none"
                  rows={3}
                  placeholder="Please provide more details about your refund reason..."
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRefundRequest}
                disabled={isSubmitting || !refundReason || (refundReason === "Other" && !customRefundReason.trim())}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Refund Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{toastMessage}</p>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-white/70 hover:text-white ml-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{toastMessage}</p>
            <button
              onClick={() => setShowErrorToast(false)}
              className="text-white/70 hover:text-white ml-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
