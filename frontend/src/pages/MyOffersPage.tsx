import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Percent,
  DollarSign,
  
  Gift,
  ShoppingBag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { showSuccessToast, showErrorToast } from "../utils/toast";

interface ClaimedOffer {
  _id: string;
  coupon_code: string;
  claimed_at: string;
  used_at?: string;
  is_used: boolean;
  discount_amount: number;
  original_price: number;
  final_price: number;
  offer: {
    _id: string;
    title: string;
    description?: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    max_discount_amount?: number;
    min_order_value: number;
    start_date: string;
    end_date: string;
    brand: {
      name: string;
      logo_url?: string;
    };
  };
}

const MyOffersPage: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const [claimedOffers, setClaimedOffers] = useState<ClaimedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "available" | "used">("all");
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    if (userData?.isLoggedIn && userData._id) {
      fetchClaimedOffers();
    }
  }, [userData, filter]);

  const fetchClaimedOffers = async () => {
    try {
      setLoading(true);
      const filterParam =
        filter === "available" ? "false" : filter === "used" ? "true" : "";
      const url = `${import.meta.env.VITE_API_URL}/offers/user/${
        userData?.user?._id
      }/claims${filterParam ? `?is_used=${filterParam}` : ""}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setClaimedOffers(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch claimed offers");
      }
    } catch (error) {
      console.error("Error fetching claimed offers:", error);
      showErrorToast("Failed to load your offers");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCoupon = async (couponCode: string) => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopiedCoupon(couponCode);
      showSuccessToast("Coupon code copied to clipboard!");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedCoupon(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy coupon code:", error);
      showErrorToast("Failed to copy coupon code");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDiscountBadge = (offer: ClaimedOffer["offer"]) => {
    if (offer.discount_type === "percentage") {
      return `${offer.discount_value}% OFF`;
    } else {
      return `₹${offer.discount_value} OFF`;
    }
  };

  const isOfferExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const filteredOffers = claimedOffers.filter((claim) => {
    if (filter === "available")
      return !claim.is_used && !isOfferExpired(claim.offer.end_date);
    if (filter === "used") return claim.is_used;
    return true;
  });

  if (!userData?.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Login Required</h2>
          <p className="text-gray-400 mb-6">
            Please login to view your claimed offers
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">My Offers</h1>
              <p className="text-sm text-gray-400">
                Your claimed discount offers
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Gift className="w-6 h-6 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-400">
              {claimedOffers.length} claimed
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 px-4 pb-4">
          {[
            { key: "all", label: "All", count: claimedOffers.length },
            {
              key: "available",
              label: "Available",
              count: claimedOffers.filter(
                (c) => !c.is_used && !isOfferExpired(c.offer.end_date)
              ).length,
            },
            {
              key: "used",
              label: "Used",
              count: claimedOffers.filter((c) => c.is_used).length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === tab.key
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-400">Loading your offers...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              {filter === "available" ? (
                <Gift className="w-8 h-8 text-gray-400" />
              ) : filter === "used" ? (
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              ) : (
                <Gift className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {filter === "available" && "No available offers"}
              {filter === "used" && "No used offers"}
              {filter === "all" && "No claimed offers"}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {filter === "available" &&
                "You don't have any unused offers at the moment."}
              {filter === "used" && "You haven't used any offers yet."}
              {filter === "all" &&
                "Start exploring products to find amazing offers!"}
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Explore Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((claim) => {
              const isCopied = copiedCoupon === claim.coupon_code;
              const expired = isOfferExpired(claim.offer.end_date);

              return (
                <div
                  key={claim._id}
                  className={`bg-gray-800 rounded-xl p-4 border transition-all duration-300 hover:shadow-lg ${
                    claim.is_used
                      ? "border-gray-700 opacity-75"
                      : expired
                      ? "border-red-500/30 bg-red-900/10"
                      : "border-gray-700 hover:border-indigo-500/50"
                  }`}
                >
                  {/* Offer Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-white">
                          {claim.offer.title}
                        </h3>
                        {claim.is_used && (
                          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                            Used
                          </span>
                        )}
                        {expired && !claim.is_used && (
                          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {claim.offer.brand.name}
                      </p>
                      {claim.offer.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {claim.offer.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-3">
                      <span className="inline-flex items-center space-x-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {claim.offer.discount_type === "percentage" ? (
                          <Percent className="w-3 h-3" />
                        ) : (
                          <DollarSign className="w-3 h-3" />
                        )}
                        <span>{getDiscountBadge(claim.offer)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                          Coupon Code
                        </p>
                        <p className="font-mono font-semibold text-white text-lg">
                          {claim.coupon_code}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyCoupon(claim.coupon_code)}
                        className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                        title="Copy coupon code"
                      >
                        {isCopied ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Offer Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Claimed on</p>
                      <p className="text-white font-medium">
                        {formatDate(claim.claimed_at)}
                      </p>
                    </div>
                    {claim.is_used && claim.used_at && (
                      <div>
                        <p className="text-gray-400">Used on</p>
                        <p className="text-white font-medium">
                          {formatDate(claim.used_at)}
                        </p>
                      </div>
                    )}
                    {!claim.is_used && (
                      <div>
                        <p className="text-gray-400">Valid till</p>
                        <p
                          className={`font-medium ${
                            expired ? "text-red-400" : "text-white"
                          }`}
                        >
                          {formatDate(claim.offer.end_date)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Usage Stats */}
                  {claim.is_used && claim.discount_amount > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">
                        Savings Applied
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">
                          Original: ₹{claim.original_price.toFixed(2)}
                        </span>
                        <span className="text-green-400">
                          Saved: ₹{claim.discount_amount.toFixed(2)}
                        </span>
                        <span className="text-white font-semibold">
                          Final: ₹{claim.final_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Minimum Order Value */}
                  {claim.offer.min_order_value > 0 && (
                    <div className="mt-3 text-xs text-gray-400">
                      * Minimum order value: ₹{claim.offer.min_order_value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOffersPage;
