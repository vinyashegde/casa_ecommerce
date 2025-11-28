import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Search,
  User,
  Filter,
  Percent,
  Star,
  ShoppingCart,
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
  offerPercentage?: number;
  originalPrice?: number;
}

const DealsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userData } = useUser();
  const { isInCuratedList, addToCuratedList, removeFromCuratedList } =
    useCuratedList();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [curatedListLoading, setCuratedListLoading] = useState<string | null>(
    null
  );

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [discountFilter, setDiscountFilter] = useState<string>("");

  // Get discount filter from URL
  useEffect(() => {
    const discount = searchParams.get("discount");
    if (discount) {
      setDiscountFilter(discount);
    }
    fetchDealsProducts();
  }, [searchParams]);

  const fetchDealsProducts = async () => {
    setLoading(true);
    try {
      const discount = searchParams.get("discount");
      const gender = searchParams.get("gender");

      let apiUrl = `${import.meta.env.VITE_API_URL}/products`;
      const params = new URLSearchParams();

      // Add gender filter if specified
      if (gender) {
        params.append("gender", gender.toLowerCase());
      }

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const response = await fetch(apiUrl);

      if (response.ok) {
        const productsData = await response.json();

        // Filter products that have the EXACT discount percentage specified
        let dealsProducts = [];
        if (Array.isArray(productsData)) {
          if (discount) {
            // Show only products with the exact discount percentage
            const targetDiscount = parseInt(discount);
            dealsProducts = productsData.filter(
              (product) =>
                product.offerPercentage &&
                product.offerPercentage === targetDiscount
            );
          } else {
            // If no specific discount, show all products with any discount
            dealsProducts = productsData.filter(
              (product) =>
                product.offerPercentage && product.offerPercentage > 0
            );
          }
        }

        setProducts(dealsProducts);
      } else {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error fetching deals products:", error);
      setError("Failed to load deals. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
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
              : Array.isArray(product.category)
              ? product.category.map((cat) =>
                  typeof cat === "string" ? cat : cat.name
                )
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

  const calculateDiscountedPrice = (product: Product) => {
    const originalPrice = getPriceValue(product.price);
    const offerPercentage = product.offerPercentage || 0;
    const discountedPrice =
      originalPrice - (originalPrice * offerPercentage) / 100;
    return { originalPrice, discountedPrice, offerPercentage };
  };

  // Category filter options (derived from current products)
  const categories = [
    ...new Set(
      products
        .map((p) =>
          typeof p.category === "string" ? p.category : p.category?.name
        )
        .filter(Boolean)
    ),
  ];

  // Filter products based on selected categories
  const filteredProducts =
    selectedCategories.length > 0
      ? products.filter((product) => {
          const productCategory =
            typeof product.category === "string"
              ? product.category
              : product.category?.name;
          return selectedCategories.includes(productCategory || "");
        })
      : products;

  // Standard product card component for 2-column grid
  const ProductCard = ({ product }: { product: Product }) => {
    const { originalPrice, discountedPrice, offerPercentage } =
      calculateDiscountedPrice(product);

    return (
      <div
        className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border border-gray-700/50"
        onClick={() => navigate(`/product/${product._id}`)}
      >
        {/* Product Image */}
        <div className="relative aspect-[3/4]">
          <img
            src={product.images?.[0] || "https://via.placeholder.com/300x400"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Discount Badge */}
          {offerPercentage > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-10">
              <Percent size={12} className="inline mr-1" />
              {offerPercentage}% OFF
            </div>
          )}

          {/* Heart Icon */}
          <button
            onClick={(e) => handleCuratedListToggle(e, product)}
            disabled={curatedListLoading === product._id}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all duration-300 z-10 justify-items-center ${
              isInCuratedList(product._id)
                ? "bg-red-500 hover:bg-red-600"
                : "bg-black/30 hover:bg-black/50"
            } ${curatedListLoading === product._id ? "opacity-50" : ""}`}
          >
            <Heart
              size={16}
              className={`${
                isInCuratedList(product._id)
                  ? "text-white fill-current"
                  : "text-white hover:text-red-400"
              }`}
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="font-bold text-lg leading-tight mb-1 text-white group-hover:text-blue-300 transition-colors duration-300 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-sm text-gray-300 opacity-90">
              {typeof product.brand === "object"
                ? product.brand.name
                : product.brand}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-green-400">
                  ₹{Math.round(discountedPrice).toLocaleString("en-IN")}
                </span>
                {offerPercentage > 0 && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{Math.round(originalPrice).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {/* Star Rating */}
              <div className="flex items-center space-x-1 mt-1">
                {[...Array(4)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className="text-yellow-400 fill-current"
                  />
                ))}
                <Star size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400 ml-1">(4.2)</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                // Add to cart logic would go here
                showSuccessToast("Added to cart");
              }}
              className="p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 justify-items-center"
            >
              <ShoppingCart size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-blue-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-10 h-10 bg-gray-700/50 rounded-xl"></div>
              <div className="h-8 bg-gray-700/50 rounded-xl w-1/3"></div>
            </div>

            {/* Filter Skeleton */}
            <div className="flex space-x-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-20 bg-gray-700/50 rounded-full"
                ></div>
              ))}
            </div>

            {/* Skeleton for 2-column grid */}
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-700/50 rounded-2xl overflow-hidden"
                >
                  <div className="aspect-[3/4] bg-gray-600/50"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-600/50 rounded mb-2"></div>
                    <div className="h-3 bg-gray-600/50 rounded w-2/3 mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-600/50 rounded w-1/3"></div>
                      <div className="h-8 w-8 bg-gray-600/50 rounded-full"></div>
                    </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-blue-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-300"
              >
                <ArrowLeft
                  size={20}
                  className="text-gray-300 hover:text-white"
                />
              </button>

              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  🔥 Hot Deals
                </h1>
                <p className="text-sm text-gray-400">
                  {discountFilter
                    ? `${discountFilter}% OFF`
                    : "Best discounts available"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/search")}
                className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-300"
              >
                <Search
                  size={20}
                  className="text-gray-300 hover:text-blue-400"
                />
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-300"
              >
                <User
                  size={20}
                  className="text-gray-300 hover:text-purple-400"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Filter Chips */}
        <div className="flex items-center space-x-3 mb-6 overflow-x-auto pb-2">
          {categories.slice(0, 5).map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategories((prev) =>
                  prev.includes(category!)
                    ? prev.filter((c) => c !== category)
                    : [...prev, category!]
                );
              }}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 whitespace-nowrap ${
                selectedCategories.includes(category!)
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-gray-300">
            Showing{" "}
            <span className="font-bold text-white">
              {filteredProducts.length}
            </span>{" "}
            deals
            {selectedCategories.length > 0 && (
              <span className="text-blue-300">
                {" "}
                in {selectedCategories.join(", ")}
              </span>
            )}
          </p>
        </div>

        {/* Products Grid - 2 Column Layout */}
        {filteredProducts.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-full mx-auto mb-8 flex items-center justify-center">
              <Percent size={40} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-4">
              No deals found
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {discountFilter
                ? `No products with ${discountFilter}% discount are currently available.`
                : "No products with discounts are currently available."}{" "}
              Check back later for amazing deals!
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onContinue={() => setShowLoginPopup(false)}
      />
    </div>
  );
};

export default DealsPage;
