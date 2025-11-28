import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Heart,
  User,
  ArrowLeft,
  Filter,
  Grid,
  List,
} from "lucide-react";
import { useCuratedList } from "../contexts/CuratedListContext";
import { useUser } from "../contexts/UserContext";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import LoginPopup from "../components/LoginPopup";

interface Product {
  _id: string;
  name: string;
  brand: string | { name: string };
  price: number | { $numberDecimal: string };
  images: string[];
  gender: string;
  category?: string | { name: string };
}

const OffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userData } = useUser();
  const { isInCuratedList, addToCuratedList, removeFromCuratedList } =
    useCuratedList();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest">(
    "price-low"
  );
  const [currentOffer, setCurrentOffer] = useState<string | null>(null);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [curatedListLoading, setCuratedListLoading] = useState<string | null>(
    null
  );

  useEffect(() => {
    const offer = searchParams.get("offer");
    const gender = searchParams.get("gender");

    if (offer) {
      setCurrentOffer(offer);
      fetchProductsForOffer(offer, gender);
      setOfferDetails(offer);
    } else {
      console.error("⚠️ No offer parameter found in URL");
    }
  }, [searchParams]);

  const setOfferDetails = (offerId: string) => {
    switch (offerId) {
      case "starting":
        setOfferTitle("Products Starting at ₹499");
        setOfferDescription(
          "Discover amazing products starting from just ₹499. Quality fashion at unbeatable prices!"
        );
        break;
      case "starting-women":
        setOfferTitle("Products Starting at ₹799");
        setOfferDescription(
          "Ladies, explore our collection starting from just ₹799. Style meets affordability!"
        );
        break;
      case "under1299":
        setOfferTitle("Everything Under ₹1,299");
        setOfferDescription(
          "Shop smart with our collection of premium products all under ₹1,299!"
        );
        break;
      case "under899":
        setOfferTitle("Everything Under ₹899");
        setOfferDescription(
          "Amazing deals on quality products, all under ₹899. Don't miss out!"
        );
        break;

      default:
        setOfferTitle("Special Offers");
        setOfferDescription("Discover amazing deals and offers!");
    }
  };

  const handleCuratedListToggle = async (
    e: React.MouseEvent,
    product: Product
  ) => {
    e.stopPropagation();

    if (!userData?.isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    setCuratedListLoading(product._id);
    try {
      if (isInCuratedList(product._id)) {
        await removeFromCuratedList(product._id);
        showSuccessToast("Removed from wishlist");
      } else {
        const curatedProduct = {
          _id: product._id,
          name: product.name,
          price: getPriceValue(product.price),
          images: product.images,
          brand:
            typeof product.brand === "string"
              ? { name: product.brand }
              : product.brand,
          category:
            typeof product.category === "string"
              ? [product.category]
              : product.category
              ? [product.category]
              : [],
          tags: [],
        };
        await addToCuratedList(curatedProduct);
        showSuccessToast("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling curated list:", error);
      showErrorToast("Failed to update wishlist");
    } finally {
      setCuratedListLoading(null);
    }
  };

  const fetchProductsForOffer = async (
    offerId: string,
    gender?: string | null
  ) => {
    setLoading(true);
    try {
      let apiUrl = `${import.meta.env.VITE_API_URL}/products`;
      const params = new URLSearchParams();

      // Add gender filter for all offers to ensure proper filtering
      if (gender) {
        // Convert gender to match backend enum values
        let normalizedGender;
        if (gender === "MAN") {
          normalizedGender = "male";
        } else if (gender === "WOMAN") {
          normalizedGender = "female";
        } else if (gender === "UNISEX") {
          normalizedGender = "unisex";
        } else {
          normalizedGender = gender.toLowerCase();
        }
        params.append("gender", normalizedGender);
      }

      // Handle different offer types
      if (offerId === "starting" || offerId === "starting-women") {
        const minPrice = offerId === "starting" ? 499 : 799;
        params.append("minPrice", minPrice.toString());
      } else if (offerId === "under1299" || offerId === "under899") {
        const maxPrice = offerId === "under1299" ? 1299 : 899;
        params.append("maxPrice", maxPrice.toString());
      }

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const response = await fetch(apiUrl);

      if (response.ok) {
        const productsData = await response.json();

        // Check if productsData is an array and has items
        if (Array.isArray(productsData) && productsData.length > 0) {
          setProducts(productsData);
        } else if (Array.isArray(productsData) && productsData.length === 0) {
          // No fallback to dummy products - show empty state
          setProducts([]);
          setError(
            "No products found for this offer. Please check back later."
          );
        } else {
          setProducts([]);
          setError("Unexpected response format from server");
        }
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Failed to fetch products for offer:",
          response.status,
          response.statusText
        );
        console.error("❌ Error details:", errorText);
        setError(
          `Failed to fetch products: ${response.status} ${response.statusText}`
        );
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ Error fetching products for offer:", error);

      // No fallback to dummy products - show error state
      setProducts([]);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely extract price value
  const getPriceValue = (
    price: number | { $numberDecimal: string }
  ): number => {
    if (typeof price === "number") {
      return price;
    }
    if (price && typeof price === "object" && "$numberDecimal" in price) {
      return parseFloat(price.$numberDecimal);
    }
    return 0;
  };

  const sortProducts = (products: Product[]) => {
    switch (sortBy) {
      case "price-low":
        return [...products].sort(
          (a, b) => getPriceValue(a.price) - getPriceValue(b.price)
        );
      case "price-high":
        return [...products].sort(
          (a, b) => getPriceValue(b.price) - getPriceValue(a.price)
        );
      case "newest":
        return [...products]; // Assuming newest is already sorted by backend
      default:
        return products;
    }
  };

  const sortedProducts = sortProducts(products);

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border border-gray-700/50 overflow-hidden backdrop-blur-sm">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={
            product.images && product.images.length > 0
              ? product.images[0]
              : "https://via.placeholder.com/300x400"
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => handleCuratedListToggle(e, product)}
            disabled={curatedListLoading === product._id}
            className={`p-2 rounded-full shadow-lg transition-colors ${
              isInCuratedList(product._id)
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-700/90 hover:bg-gray-600"
            } ${curatedListLoading === product._id ? "opacity-50" : ""}`}
          >
            <Heart
              size={16}
              className={`${
                isInCuratedList(product._id)
                  ? "text-white fill-current"
                  : "text-gray-300 hover:text-red-500"
              }`}
            />
          </button>
        </div>

        {/* Offer Badge */}
        {currentOffer &&
          (currentOffer.includes("flat") || currentOffer.includes("buy")) && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
              <Sparkles size={12} className="inline mr-1" />
              OFFER
            </div>
          )}

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={() => navigate(`/product/${product._id}`)}
            className="px-6 py-3 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full font-semibold hover:bg-white transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
          >
            <ShoppingBag size={16} className="inline mr-2" />
            Quick View
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3">
          <h3 className="font-bold text-white text-lg truncate mb-1 group-hover:text-blue-400 transition-colors duration-300">
            {product.name}
          </h3>
          <p className="text-sm text-gray-300 font-medium">
            {typeof product.brand === "object"
              ? product.brand.name
              : product.brand}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ₹{getPriceValue(product.price).toLocaleString("en-IN")}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <Star size={14} className="text-yellow-400 fill-current" />
              <Star size={14} className="text-yellow-400 fill-current" />
              <Star size={14} className="text-yellow-400 fill-current" />
              <Star size={14} className="text-yellow-400 fill-current" />
              <Star size={14} className="text-gray-400" />
              <span className="text-xs text-gray-400 ml-1">(4.0)</span>
            </div>
          </div>

          <button
            onClick={() => navigate(`/product/${product._id}`)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Gift size={16} className="inline mr-1" />
            View
          </button>
        </div>
      </div>
    </div>
  );

  const ProductListItem = ({ product }: { product: Product }) => (
    <div className="group bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-700/50 overflow-hidden backdrop-blur-sm">
      <div className="flex">
        <div className="relative w-40 h-40 flex-shrink-0">
          <img
            src={
              product.images && product.images.length > 0
                ? product.images[0]
                : "https://via.placeholder.com/300x400"
            }
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {currentOffer &&
            (currentOffer.includes("flat") || currentOffer.includes("buy")) && (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
                <Sparkles size={10} className="inline mr-1" />
                OFFER
              </div>
            )}
        </div>

        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white text-lg mb-1">
              {product.name}
            </h3>
            <p className="text-gray-300 mb-2">
              {typeof product.brand === "object"
                ? product.brand.name
                : product.brand}
            </p>
            {product.category && (
              <p className="text-sm text-gray-400 mb-2">
                {typeof product.category === "object"
                  ? product.category.name
                  : product.category}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-blue-400">
              ₹{getPriceValue(product.price)}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={(e) => handleCuratedListToggle(e, product)}
                disabled={curatedListLoading === product._id}
                className={`p-2 rounded-lg transition-colors ${
                  isInCuratedList(product._id)
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-700 hover:bg-gray-600"
                } ${curatedListLoading === product._id ? "opacity-50" : ""}`}
              >
                <Heart
                  size={16}
                  className={`${
                    isInCuratedList(product._id)
                      ? "text-white fill-current"
                      : "text-gray-300"
                  }`}
                />
              </button>
              <button
                onClick={() => navigate(`/product/${product._id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/50">
              <div className="h-8 bg-gray-700/50 rounded-xl w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-700/50 rounded-lg w-1/2"></div>
            </div>

            {/* Filters Skeleton */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/50">
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-700/50 rounded-lg w-32"></div>
                <div className="h-6 bg-gray-700/50 rounded-lg w-24"></div>
              </div>
            </div>

            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-5 border border-gray-700/50 backdrop-blur-sm"
                >
                  <div className="aspect-[3/4] bg-gray-700/50 rounded-xl mb-4"></div>
                  <div className="h-5 bg-gray-700/50 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-700/50 rounded-lg w-2/3 mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-700/50 rounded-lg w-1/3"></div>
                    <div className="h-8 bg-gray-700/50 rounded-xl w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800/95 to-gray-900/95 backdrop-blur-xl shadow-2xl border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate(-1)}
                className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-300 group"
              >
                <ArrowLeft
                  size={22}
                  className="text-gray-300 group-hover:text-white group-hover:scale-110 transition-all duration-200"
                />
              </button>

              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl backdrop-blur-sm border border-blue-500/30">
                  <Gift size={24} className="text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    {offerTitle}
                  </h1>
                  <p className="text-gray-300 text-sm mt-1 flex items-center">
                    <Clock size={14} className="mr-2" />
                    {offerDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/search")}
                className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-300 group"
                title="Search"
              >
                <Search
                  size={20}
                  className="text-gray-300 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200"
                />
              </button>
              <button
                onClick={() => navigate("/curatedList")}
                className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-300 group"
                title="Wishlist"
              >
                <Heart
                  size={20}
                  className="text-gray-300 group-hover:text-red-400 group-hover:scale-110 transition-all duration-200"
                />
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-300 group"
                title="Profile"
              >
                <User
                  size={20}
                  className="text-gray-300 group-hover:text-purple-400 group-hover:scale-110 transition-all duration-200"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Create Offer Section */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/50">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search Input */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                />
              </div>
            </div>

            {/* Create Offer Button */}
            <button
              onClick={() => setShowCreateOffer(!showCreateOffer)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create New Offer</span>
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                  <Filter size={18} className="text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-300">
                  Sort by:
                </span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-600/50 bg-gray-800/50 backdrop-blur-sm text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <TrendingUp size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-300">View:</span>
              </div>
              <div className="flex bg-gray-700/50 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 rounded-lg transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-gray-600/50"
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 rounded-lg transition-all duration-300 ${
                    viewMode === "list"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-gray-600/50"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl backdrop-blur-sm border border-green-500/30">
                <Zap size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-gray-300 text-lg">
                  Showing{" "}
                  <span className="font-bold text-white text-xl">
                    {products.length}
                  </span>{" "}
                  products
                  {currentOffer && (
                    <span className="text-blue-300">
                      {" "}
                      for {offerTitle.toLowerCase()}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {products.length > 0
                    ? "Ready to discover amazing deals!"
                    : "No products found for this offer"}
                </p>
              </div>
            </div>

            {products.length > 0 && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-400">
                <Clock size={16} />
                <span>Updated just now</span>
              </div>
            )}
          </div>

          {/* Special banner for starting offers */}
          {currentOffer === "starting" && (
            <div className="mt-6 p-6 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl border border-green-400/50 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <div className="text-3xl">🎯</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-2xl mb-2">
                    Men's Collection Starting at ₹499
                  </h3>
                  <p className="text-green-100 text-base leading-relaxed">
                    Discover quality fashion pieces starting from just ₹499.
                    Perfect for building your wardrobe on a budget!
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1 text-green-200">
                      <Star size={16} className="fill-current" />
                      <span className="text-sm font-medium">4.8/5 Rating</span>
                    </div>
                    <div className="flex items-center space-x-1 text-green-200">
                      <Clock size={16} />
                      <span className="text-sm font-medium">Limited Time</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special banner for women's starting offers */}
          {currentOffer === "starting-women" && (
            <div className="mt-6 p-6 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl border border-pink-400/50 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <div className="text-3xl">💖</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-2xl mb-2">
                    Women's Collection Starting at ₹799
                  </h3>
                  <p className="text-pink-100 text-base leading-relaxed">
                    Explore our stylish women's collection starting from just
                    ₹799. Fashion that fits your budget!
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1 text-pink-200">
                      <Star size={16} className="fill-current" />
                      <span className="text-sm font-medium">4.9/5 Rating</span>
                    </div>
                    <div className="flex items-center space-x-1 text-pink-200">
                      <Clock size={16} />
                      <span className="text-sm font-medium">Limited Time</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special banner for under price offers */}
          {currentOffer === "under1299" && (
            <div className="mt-6 p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl border border-purple-400/50 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <div className="text-3xl">💰</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-2xl mb-2">
                    Everything Under ₹1,299
                  </h3>
                  <p className="text-purple-100 text-base leading-relaxed">
                    Smart shopping with premium products all under ₹1,299.
                    Quality meets affordability!
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1 text-purple-200">
                      <Star size={16} className="fill-current" />
                      <span className="text-sm font-medium">4.7/5 Rating</span>
                    </div>
                    <div className="flex items-center space-x-1 text-purple-200">
                      <Clock size={16} />
                      <span className="text-sm font-medium">Limited Time</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentOffer === "under899" && (
            <div className="mt-6 p-6 bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 rounded-2xl border border-green-400/50 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <div className="text-3xl">💎</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-2xl mb-2">
                    Everything Under ₹899
                  </h3>
                  <p className="text-green-100 text-base leading-relaxed">
                    Amazing deals on quality products, all under ₹899. Don't
                    miss these incredible offers!
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1 text-green-200">
                      <Star size={16} className="fill-current" />
                      <span className="text-sm font-medium">4.6/5 Rating</span>
                    </div>
                    <div className="flex items-center space-x-1 text-green-200">
                      <Clock size={16} />
                      <span className="text-sm font-medium">Limited Time</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid/List */}
        {products.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-full mx-auto mb-8 flex items-center justify-center backdrop-blur-sm border border-gray-600/50">
              <Search size={40} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-4">
              {error ? "Error Loading Products" : "No products found"}
            </h3>
            <p className="text-gray-400 mb-8 text-lg max-w-md mx-auto">
              {error ||
                "Try adjusting your filters or check back later for new offers"}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate("/")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Back to Explore
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Zap size={20} className="inline mr-2" />
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-6"
            }
          >
            {sortedProducts.map((product) =>
              viewMode === "grid" ? (
                <ProductCard key={product._id} product={product} />
              ) : (
                <ProductListItem key={product._id} product={product} />
              )
            )}
          </div>
        )}

        {/* Load More Button (if needed) */}
        {products.length > 0 && (
          <div className="mt-16 text-center">
            <button className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105">
              <TrendingUp size={20} className="inline mr-2" />
              Load More Products
            </button>
          </div>
        )}
      </div>

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onContinue={() => {
          setShowLoginPopup(false);
        }}
      />
    </div>
  );
};

export default OffersPage;
