import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Calendar,
  Percent,
  DollarSign,
  Target,
  Users,
  Clock,
} from "lucide-react";
import { useBrand } from "../contexts/BrandContext";
import { useNotification } from "../contexts/NotificationContext";

interface Offer {
  _id: string;
  title: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount_amount?: number;
  min_order_value: number;
  coupon_code: string;
  applies_to: "all_products" | "selected_products";
  selected_products: Array<{
    _id: string;
    name: string;
    price: number;
    images: string[];
  }>;
  usage_limit?: number;
  usage_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  is_currently_valid?: boolean;
}

const Offers: React.FC = () => {
  const { brand: selectedBrand } = useBrand();
  const { showNotification } = useNotification();

  // Check if brand is logged in
  const isBrandLoggedIn = selectedBrand || localStorage.getItem("brandToken");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

  useEffect(() => {
    console.log("🔍 Selected brand from context:", selectedBrand);
    console.log(
      "🔍 Brand token from localStorage:",
      localStorage.getItem("brandToken")
    );

    // Try to get brand from localStorage if not in context
    let currentBrand = selectedBrand;
    if (!currentBrand) {
      const storedBrand = localStorage.getItem("brandData");
      if (storedBrand) {
        try {
          currentBrand = JSON.parse(storedBrand);
          console.log("🔍 Brand from localStorage:", currentBrand);
        } catch (e) {
          console.error("❌ Error parsing brand from localStorage:", e);
        }
      }
    }

    if (currentBrand) {
      console.log("✅ Brand found, fetching offers...");
      fetchOffers();
    } else {
      console.log("❌ No brand selected, cannot fetch offers");
      setLoading(false);
    }
  }, [selectedBrand, filter]);

  // Helper function to get offer status
  const getOfferStatus = (offer: Offer) => {
    const now = new Date();
    const startDate = new Date(offer.start_date);
    const endDate = new Date(offer.end_date);

    if (!offer.is_active)
      return { status: "deleted", color: "bg-gray-600", text: "Deleted" };
    if (now < startDate)
      return { status: "scheduled", color: "bg-blue-500", text: "Scheduled" };
    if (now > endDate)
      return { status: "expired", color: "bg-red-500", text: "Expired" };
    if (offer.usage_limit && offer.usage_count >= offer.usage_limit)
      return {
        status: "limit_reached",
        color: "bg-orange-500",
        text: "Limit Reached",
      };

    return { status: "active", color: "bg-green-500", text: "Active" };
  };

  // Memoize filtered offers to prevent unnecessary recalculations
  const filteredOffers = React.useMemo(() => {
    return offers.filter((offer) => {
      const status = getOfferStatus(offer);

      if (filter === "active") {
        // For active filter, only show active offers
        return (
          offer.is_active &&
          (status.status === "active" || status.status === "scheduled")
        );
      }

      if (filter === "expired") {
        // For expired filter, show both expired and deleted offers
        return (
          !offer.is_active ||
          status.status === "expired" ||
          status.status === "deleted" ||
          status.status === "limit_reached"
        );
      }

      // For "all" filter, show all offers including deleted ones
      return true;
    });
  }, [offers, filter]);

  const fetchOffers = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

    // Get current brand (from context or localStorage)
    let currentBrand = selectedBrand;
    if (!currentBrand) {
      const storedBrand = localStorage.getItem("brandData");
      if (storedBrand) {
        try {
          currentBrand = JSON.parse(storedBrand);
        } catch (e) {
          console.error("❌ Error parsing brand from localStorage:", e);
        }
      }
    }

    console.log("🔍 Fetching offers data...", {
      selectedBrand: selectedBrand,
      currentBrand: currentBrand,
      brandId: currentBrand?._id,
      apiUrl: apiUrl,
      filter: filter,
      hasBrandToken: !!localStorage.getItem("brandToken"),
    });

    if (!currentBrand?._id) {
      console.warn("⚠️ No brand ID available for fetching offers");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const url = `${apiUrl}/offers/brand/${currentBrand._id}?filter=${filter}`;
      console.log("🚀 Making API call to:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("brandToken")}`,
        },
      });

      console.log("📊 Offers API Response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📋 Received offers data:", {
          success: data.success,
          data: data.data,
          dataLength: data.data?.length || 0,
          isArray: Array.isArray(data.data),
          message: data.message,
        });

        if (data.success && Array.isArray(data.data)) {
          setOffers(data.data);
          console.log(
            "✅ Offers set successfully:",
            data.data.length,
            "offers"
          );
        } else {
          console.warn("⚠️ Invalid response format:", data);
          setOffers([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API Error:", {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          url: url,
        });
        throw new Error(errorData.message || "Failed to fetch offers");
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      showNotification("Failed to fetch offers", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await fetch(`${apiUrl}/offers/${offerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("brandToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showNotification("Offer deleted successfully", "success");
          // Remove the offer from the local state immediately for better UX
          setOffers((prevOffers) =>
            prevOffers.filter((offer) => offer._id !== offerId)
          );
          // Also refresh from server to ensure consistency
          fetchOffers();
        } else {
          throw new Error(data.message || "Failed to delete offer");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete offer");
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      showNotification("Failed to delete offer", "error");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification("Coupon code copied to clipboard!", "success");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      showNotification("Failed to copy coupon code", "error");
    }
  };

  // Show login message if no brand is logged in
  if (!isBrandLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md mx-auto border border-white/10">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Percent className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Brand Login Required
            </h2>
            <p className="text-white/70 mb-6">
              Please log in as a brand to manage offers and discounts.
            </p>
            <button
              onClick={() => (window.location.href = "/login")}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-indigo-500/25"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && offers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 bg-white/20 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-white/20 rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-12 bg-white/20 rounded w-32 animate-pulse"></div>
          </div>

          {/* Filter Tabs Skeleton */}
          <div className="flex space-x-1 bg-white/10 rounded-2xl p-1 mb-6 backdrop-blur-sm">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-1 h-10 bg-white/20 rounded-xl animate-pulse"
              ></div>
            ))}
          </div>

          {/* Offers Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl p-6 animate-pulse border border-white/10"
              >
                <div className="h-6 bg-white/20 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-white/20 rounded w-full mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-2/3 mb-4"></div>
                <div className="h-20 bg-white/20 rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="flex-1 h-8 bg-white/20 rounded"></div>
                  <div className="flex-1 h-8 bg-white/20 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-10xl mx-auto">
        <div className="text-center mb-12 relative">
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm mb-4">
            Discount Offers
          </h1>

          {/* Decorative underline */}
          <div className="mx-auto w-32 h-1 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full"></div>

          {/* Subtitle */}
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            Grab the latest deals and exclusive discounts tailored just for you.
          </p>
        </div>

        {/* Enhanced Create Button and Filter Tabs in One Row */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Filter Tabs */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                Filter Offers
              </h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: "all", label: "All Offers", count: offers.length },
                  {
                    key: "active",
                    label: "Active",
                    count: offers.filter((o) =>
                      ["active", "scheduled"].includes(getOfferStatus(o).status)
                    ).length,
                  },
                  {
                    key: "expired",
                    label: "Expired",
                    count: offers.filter((o) =>
                      ["expired", "deleted", "limit_reached"].includes(
                        getOfferStatus(o).status
                      )
                    ).length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-6 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all duration-300 hover:scale-105 ${
                      filter === tab.key
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 border border-amber-400/30"
                        : "bg-white/10 text-white/80 hover:text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Create New Offer Button */}
            <div className="lg:ml-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/25 hover:scale-105 group"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                  <Percent className="w-6 h-6" />
                </div>
                <span className="text-lg">Create New Offer</span>
                <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-white/60 transition-colors"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <Percent className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No offers found
            </h3>
            <p className="text-white/70 mb-6">
              Get started by creating your first discount offer
            </p>

            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-indigo-500/25"
            >
              Create Your First Offer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => {
              const status = getOfferStatus(offer);
              return (
                <div
                  key={offer._id}
                  className="bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden border border-white/10 hover:border-white/20 group"
                >
                  {/* Enhanced Offer Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {offer.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium text-white ${status.color} shadow-lg`}
                      >
                        {status.text}
                      </span>
                    </div>
                    {offer.description && (
                      <p className="text-sm text-white/70 line-clamp-2 mb-3">
                        {offer.description}
                      </p>
                    )}

                    {/* Enhanced Discount Badge */}
                    <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-2 rounded-2xl border border-emerald-400/30 backdrop-blur-sm">
                      {offer.discount_type === "percentage" ? (
                        <Percent className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                      )}
                      <span className="font-semibold text-emerald-300">
                        {offer.discount_type === "percentage"
                          ? `${offer.discount_value}% OFF`
                          : `₹${offer.discount_value} OFF`}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Offer Details */}
                  <div className="p-6 space-y-4">
                    {/* Enhanced Coupon Code */}
                    <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wide">
                          Coupon Code
                        </p>
                        <p className="font-mono font-semibold text-white">
                          {offer.coupon_code}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(offer.coupon_code)}
                        className="p-2 text-white/60 hover:text-indigo-400 transition-colors hover:bg-white/10 rounded-xl"
                        title="Copy coupon code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Enhanced Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center bg-white/5 p-3 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-center mb-1">
                          <Users className="w-4 h-4 text-blue-400 mr-1" />
                          <span className="text-xs text-white/60">Used</span>
                        </div>
                        <p className="font-semibold text-white">
                          {offer.usage_count}
                          {offer.usage_limit ? `/${offer.usage_limit}` : ""}
                        </p>
                      </div>
                      <div className="text-center bg-white/5 p-3 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-center mb-1">
                          <Target className="w-4 h-4 text-purple-400 mr-1" />
                          <span className="text-xs text-white/60">
                            Applies To
                          </span>
                        </div>
                        <p className="font-semibold text-white text-xs">
                          {offer.applies_to === "all_products"
                            ? "All Products"
                            : `${offer.selected_products.length} Products`}
                        </p>
                      </div>
                    </div>

                    {/* Enhanced Dates */}
                    <div className="flex items-center justify-between text-xs text-white/60 bg-white/5 p-3 rounded-2xl border border-white/10">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-indigo-400" />
                        {new Date(offer.start_date).toLocaleDateString()}
                      </div>
                      <span className="text-white/40">-</span>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-purple-400" />
                        {new Date(offer.end_date).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Enhanced Actions */}
                    <div className="flex space-x-2 pt-4 border-t border-white/10">
                      {status.status === "deleted" ? (
                        <div className="flex-1 bg-white/10 text-white/50 px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-center space-x-2 border border-white/20">
                          <Trash2 className="w-4 h-4" />
                          <span>Deleted</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingOffer(offer)}
                            className="flex-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 border border-indigo-400/30 hover:border-indigo-400/50 hover:scale-105"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer._id)}
                            className="flex-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-300 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 border border-red-400/30 hover:border-red-400/50 hover:scale-105"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingOffer) && (
        <OfferModal
          offer={editingOffer}
          onClose={() => {
            setShowCreateModal(false);
            setEditingOffer(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingOffer(null);
            fetchOffers();
          }}
        />
      )}
    </div>
  );
};

// Offer Modal Component
interface OfferModalProps {
  offer?: Offer | null;
  onClose: () => void;
  onSuccess: () => void;
}

const OfferModal: React.FC<OfferModalProps> = ({
  offer,
  onClose,
  onSuccess,
}) => {
  const { brand: selectedBrand } = useBrand();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: offer?.title || "",
    description: offer?.description || "",
    discount_type: offer?.discount_type || "percentage",
    discount_value: offer?.discount_value || 0,
    max_discount_amount: offer?.max_discount_amount || "",
    min_order_value: offer?.min_order_value || 0,
    applies_to: offer?.applies_to || "all_products",
    selected_products: offer?.selected_products?.map((p) => p._id) || [],
    usage_limit: offer?.usage_limit || "",
    start_date: offer?.start_date
      ? new Date(offer.start_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    end_date: offer?.end_date
      ? new Date(offer.end_date).toISOString().slice(0, 16)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
    is_active: offer?.is_active ?? true,
  });

  // Sample price for real-time calculation
  const [samplePrice, setSamplePrice] = useState(1000);

  const calculateDiscount = () => {
    const price = samplePrice;
    let discount = 0;

    if (formData.discount_type === "percentage") {
      discount = (price * formData.discount_value) / 100;
      if (
        formData.max_discount_amount &&
        discount > parseFloat(formData.max_discount_amount.toString())
      ) {
        discount = parseFloat(formData.max_discount_amount.toString());
      }
    } else {
      discount = Math.min(formData.discount_value, price);
    }

    const finalPrice = Math.max(0, price - discount);
    return {
      discount: Math.round(discount * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        brand: selectedBrand?._id,
        created_by: localStorage.getItem("brandEmail") || "unknown",
        max_discount_amount: formData.max_discount_amount
          ? parseFloat(formData.max_discount_amount.toString())
          : undefined,
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit.toString())
          : undefined,
      };

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const url = offer ? `${apiUrl}/offers/${offer._id}` : `${apiUrl}/offers`;

      const method = offer ? "PUT" : "POST";

      console.log("🚀 Submitting offer:", method, url);
      console.log("📦 Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("brandToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showNotification(
            `Offer ${offer ? "updated" : "created"} successfully!`,
            "success"
          );
          onSuccess();
        } else {
          throw new Error(data.message || "Failed to save offer");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save offer");
      }
    } catch (error: any) {
      console.error("Error saving offer:", error);
      showNotification(error.message || "Failed to save offer", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculation = calculateDiscount();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white mt-6">
              {offer ? "Edit Offer" : "Create New Offer"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              {/* Enhanced Basic Info */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border border-indigo-400/20 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-indigo-400" />
                  Offer Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Offer Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full text-white bg-white/10 px-4 py-3 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all placeholder-white/50"
                      placeholder="e.g., Summer Sale 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 text-white bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all resize-none placeholder-white/50"
                      rows={2}
                      placeholder="Describe your offer..."
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Discount Configuration */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 rounded-2xl border border-emerald-400/20 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Percent className="w-5 h-5 mr-2 text-emerald-400" />
                  Discount Settings
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Discount Type *
                      </label>
                      <select
                        required
                        value={formData.discount_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_type: e.target.value as
                              | "percentage"
                              | "fixed",
                          })
                        }
                        className="w-full px-4 text-white bg-white/10 py-3 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all"
                      >
                        <option value="percentage" className="bg-slate-800">
                          Percentage (%)
                        </option>
                        <option value="fixed" className="bg-slate-800">
                          Fixed Amount (₹)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.discount_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_value: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 text-white bg-white/10 py-3 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all placeholder-white/50"
                        placeholder={
                          formData.discount_type === "percentage" ? "10" : "100"
                        }
                      />
                    </div>
                  </div>

                  {formData.discount_type === "percentage" && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Maximum Discount (₹) - Optional
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.max_discount_amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_discount_amount: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-white bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all placeholder-white/50"
                        placeholder="No limit"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Minimum Order Value (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.min_order_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_order_value: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 text-white bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all placeholder-white/50"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Validity Period */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-400/20 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                  Validity Period
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="w-full px-4 py-3 text-white bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      End Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="w-full px-4 py-3 text-white bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Right Column - Real-time Preview */}
            <div className="lg:pl-6">
              <div className="sticky top-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-indigo-400" />
                  Live Preview
                </h3>

                {/* Enhanced Sample Price Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Test with Sample Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={samplePrice}
                    onChange={(e) =>
                      setSamplePrice(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-4 py-3 text-white bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all placeholder-white/50"
                    placeholder="Enter a price to test discount"
                  />
                </div>

                {/* Enhanced Price Calculation Card */}
                <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/50 to-slate-800/50 p-6 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-sm">
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      Discount Preview
                    </h4>
                    <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      {formData.discount_type === "percentage"
                        ? `${formData.discount_value}% OFF`
                        : `₹${formData.discount_value} OFF`}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-white/70 font-medium">
                        Original Price:
                      </span>
                      <span className="font-bold text-white text-lg">
                        ₹{samplePrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 bg-red-500/20 rounded-2xl px-3 border border-red-400/30">
                      <span className="text-red-300 font-medium">
                        Discount:
                      </span>
                      <span className="font-bold text-red-300 text-lg">
                        -₹{calculation.discount.toFixed(2)}
                      </span>
                    </div>

                    <div className="border-t-2 border-indigo-400/30 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-white">
                          Final Price:
                        </span>
                        <span className="text-3xl font-bold text-indigo-400">
                          ₹{calculation.finalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="text-center mt-4">
                      <div className="text-sm text-white/60">
                        You save{" "}
                        <span className="font-bold text-emerald-400">
                          {((calculation.discount / samplePrice) * 100).toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-white/20 mb-14">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 border border-white/30 rounded-2xl text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105 disabled:transform-none"
            >
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              )}
              <span>{offer ? "Update Offer" : "Create Offer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Offers;
