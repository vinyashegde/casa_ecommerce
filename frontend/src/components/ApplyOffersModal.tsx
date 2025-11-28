import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Percent,
  DollarSign,
  Calendar,
  Clock,
  Gift,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { showSuccessToast, showErrorToast } from "../utils/toast";

interface Offer {
  _id: string;
  title: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount_amount?: number;
  min_order_value: number;
  coupon_code: string;
  start_date: string;
  end_date: string;
  usage_limit?: number;
  usage_count: number;
  calculated_discount: number;
  calculated_final_price: number;
  original_price: number;
  brand: {
    name: string;
    logo_url?: string;
  };
}

interface ProductData {
  _id: string;
  name: string;
  price: number;
  brand: {
    _id: string;
    name: string;
  };
}

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductData;
}

const ApplyOffersModal: React.FC<OfferModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { userData } = useUser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimedOffers, setClaimedOffers] = useState<Set<string>>(new Set());
  const [claimingOffer, setClaimingOffer] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      fetchOffers();
      fetchClaimedOffers();
    }
  }, [isOpen, product]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/offers/product/${product._id}`
      );
      const data = await response.json();

      if (data.success) {
        setOffers(data.data.offers || []);
      } else {
        throw new Error(data.message || "Failed to fetch offers");
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      showErrorToast("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimedOffers = async () => {
    if (!userData?.isLoggedIn || !userData._id) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/offers/user/${userData._id}/claims`
      );
      const data = await response.json();

      if (data.success) {
        const claimedOfferIds = new Set(
          data.data.map((claim: any) => claim.offer._id)
        );
        setClaimedOffers(claimedOfferIds);
      }
    } catch (error) {
      console.error("Error fetching claimed offers:", error);
    }
  };

  const handleClaimOffer = async (offerId: string) => {
    if (!userData?.isLoggedIn || !userData._id) {
      showErrorToast("Please login to claim offers");
      return;
    }

    try {
      setClaimingOffer(offerId);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/offers/${offerId}/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userData._id,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setClaimedOffers((prev) => new Set([...prev, offerId]));
        showSuccessToast("Offer claimed successfully!");
      } else {
        throw new Error(data.message || "Failed to claim offer");
      }
    } catch (error: any) {
      console.error("Error claiming offer:", error);
      showErrorToast(error.message || "Failed to claim offer");
    } finally {
      setClaimingOffer(null);
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
    });
  };

  const getDiscountBadge = (offer: Offer) => {
    if (offer.discount_type === "percentage") {
      return `${offer.discount_value}% OFF`;
    } else {
      return `₹${offer.discount_value} OFF`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Available Offers</h2>
              <p className="text-indigo-100 text-sm mt-1">{product.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Product Price */}
          <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-100">Original Price</span>
              <span className="text-lg font-bold">
                ₹{product.price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Loading offers...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No offers available
              </h3>
              <p className="text-gray-600 text-sm">
                There are currently no active offers for this product from{" "}
                {product.brand.name}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => {
                const isClaimedByUser = claimedOffers.has(offer._id);
                const isClaimingThis = claimingOffer === offer._id;
                const isCopied = copiedCoupon === offer.coupon_code;

                return (
                  <div
                    key={offer._id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                  >
                    {/* Offer Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {offer.title}
                        </h3>
                        {offer.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {offer.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-3">
                        <span className="inline-flex items-center space-x-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          {offer.discount_type === "percentage" ? (
                            <Percent className="w-3 h-3" />
                          ) : (
                            <DollarSign className="w-3 h-3" />
                          )}
                          <span>{getDiscountBadge(offer)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Price Calculation */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-4 border border-blue-100">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Original Price:</span>
                          <span className="font-medium">
                            ₹{offer.original_price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-green-600">
                            -₹{offer.calculated_discount.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-blue-200 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">
                              Final Price:
                            </span>
                            <span className="text-xl font-bold text-indigo-600">
                              ₹{offer.calculated_final_price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Offer Details */}
                    <div className="space-y-2 mb-4">
                      {offer.min_order_value > 0 && (
                        <div className="flex items-center text-xs text-gray-500">
                          <DollarSign className="w-3 h-3 mr-1" />
                          <span>Min order: ₹{offer.min_order_value}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>Valid till {formatDate(offer.end_date)}</span>
                        </div>
                        {offer.usage_limit && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>
                              {offer.usage_count}/{offer.usage_limit} used
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Coupon Code & Actions */}
                    {isClaimedByUser ? (
                      <div className="space-y-3">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Coupon Code
                              </p>
                              <p className="font-mono font-semibold text-gray-900">
                                {offer.coupon_code}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleCopyCoupon(offer.coupon_code)
                              }
                              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Copy coupon code"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="inline-flex items-center space-x-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
                            <Check className="w-4 h-4" />
                            <span>Claimed</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimOffer(offer._id)}
                        disabled={isClaimingThis || !userData?.isLoggedIn}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isClaimingThis ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4" />
                            <span>Claim Offer</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {offers.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              * Offers can be used during checkout. Terms and conditions apply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyOffersModal;
