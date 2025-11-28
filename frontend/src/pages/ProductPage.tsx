import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Share, Heart } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useCuratedList } from "../contexts/CuratedListContext";
import { showSuccessToast } from "../utils/toast";
import LoginPopup from "../components/LoginPopup";
import { useCart, ProductVariant } from "../contexts/CartContext";

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number | { $numberDecimal: string };
  currency: string;
  images: string[];
  brand: {
    _id: string;
    name: string;
    logo_url?: string;
  };
  category: {
    _id: string;
    name: string;
  };
  tags: string[];
  gender: string;
  sizes?: string[]; // Assuming products might not always have sizes
  stock: number; // Main stock field for products without variants
  product_variants?: ProductVariant[]; // New field for variants
  offerPercentage?: number;
  assigned_coupon?: {
    _id: string;
    title: string;
    coupon_code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    max_discount_amount?: number;
    is_currently_valid: boolean;
  };
  specifications?: {
    pattern?: string;
    length?: string;
    fabric?: string;
    sleeveLength?: string;
    fit?: string;
    distress?: string;
    [key: string]: string | undefined; // Allow for other string-based specifications
  };
}

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Specify type for useParams
  const navigate = useNavigate();
  const { userData } = useUser();
  const { isInCuratedList, addToCuratedList, removeFromCuratedList } =
    useCuratedList();
  const { addToCart } = useCart(); // Updated to support variant parameters

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(""); // Changed default to empty
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"SPECIFICATION" | "DESCRIPTION">(
    "SPECIFICATION"
  );
  const [curatedListLoading, setCuratedListLoading] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // Helper functions for variant handling
  const hasVariants = (product: Product): boolean => {
    return !!(product.product_variants && product.product_variants.length > 0);
  };

  const getEffectivePrice = (product: Product): number => {
    if (selectedVariant) {
      const variantPrice = selectedVariant.price;
      if (typeof variantPrice === "number") {
        return variantPrice;
      } else if (
        typeof variantPrice === "object" &&
        variantPrice.$numberDecimal
      ) {
        return parseFloat(variantPrice.$numberDecimal);
      }
    }

    // Fallback to main product price
    if (typeof product.price === "number") {
      return product.price;
    } else if (
      typeof product.price === "object" &&
      product.price.$numberDecimal
    ) {
      return parseFloat(product.price.$numberDecimal);
    }
    return 0;
  };

  const getEffectiveImages = (product: Product): string[] => {
    // Use variant images if available
    if (selectedVariant) {
      return selectedVariant.images || [];
    }
    // If no variant selected but product has variants, use first variant's images
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants[0].images || [];
    }
    // Fallback to main product images for backward compatibility
    return product.images || [];
  };

  const getAvailableSizes = (product: Product): string[] => {
    if (selectedVariant) {
      return selectedVariant.sizes.map((size) => size.size);
    }
    return product.sizes || [];
  };

  const getStockForSize = (product: Product, size: string): number => {
    if (selectedVariant) {
      const variantSize = selectedVariant.sizes.find((s) => s.size === size);
      return variantSize ? variantSize.stock : 0;
    }
    // For products without variants, return the main stock
    return product.stock || 0;
  };

  // Helper function to get total stock for a product
  const getTotalStock = (product: Product): number => {
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants.reduce((total, variant) => {
        return total + variant.sizes.reduce((variantTotal, size) => variantTotal + size.stock, 0);
      }, 0);
    }
    return product.stock || 0;
  };

  // Helper function to get stock status
  const getStockStatus = (product: Product): 'out-of-stock' | 'low-stock' | 'in-stock' => {
    const totalStock = getTotalStock(product);
    if (totalStock === 0) return 'out-of-stock';
    if (totalStock <= 5) return 'low-stock';
    return 'in-stock';
  };

  // Helper function to check if selected size has stock
  const hasStockForSelectedSize = (): boolean => {
    if (!product || !selectedSize) return false;
    return getStockForSize(product, selectedSize) > 0;
  };

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  // Add to recently viewed when product loads
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product);
    }
  }, [product]);

  const addToRecentlyViewed = (product: Product) => {
    try {
      const savedRecentlyViewed = localStorage.getItem("recentlyViewed");
      let recentlyViewed = savedRecentlyViewed
        ? JSON.parse(savedRecentlyViewed)
        : [];

      // Remove if already exists and add to front
      recentlyViewed = recentlyViewed.filter((p: any) => p._id !== product._id);
      recentlyViewed.unshift(product);

      // Keep only last 5 products
      recentlyViewed = recentlyViewed.slice(0, 5);

      localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error("Error saving to recently viewed:", error);
    }
  };

  const handleCuratedListToggle = async () => {
    if (!userData?.isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    if (!product) {
      return;
    }

    setCuratedListLoading(true);
    try {
      const isCurrentlyInList = isInCuratedList(product._id);

      if (isCurrentlyInList) {
        await removeFromCuratedList(product._id);
        showSuccessToast("Removed from wishlist");
      } else {
        const curatedProduct = {
          _id: product._id,
          name: product.name,
          price:
            typeof product.price === "object" &&
            product.price !== null &&
            "$numberDecimal" in product.price
              ? parseFloat(product.price.$numberDecimal)
              : (product.price as number),
          images: product.images,
          brand: { name: product.brand.name },
          category: product.category ? [product.category.name] : [],
          tags: product.tags || [],
        };
        await addToCuratedList(curatedProduct);
        showSuccessToast("Added to wishlist");
      }
    } catch (error) {
      console.error("❌ Error toggling curated list:", error);
      // You could show a toast notification here
    } finally {
      setCuratedListLoading(false);
    }
  };

  const handleShare = () => {
    if (!product) return;

    // Create the product URL
    const productUrl = `${window.location.origin}/product/${product._id}`;

    // Get the price value using effective price
    const price = getEffectivePrice(product);

    // Create a simple message that will trigger WhatsApp's link preview
    // WhatsApp will automatically show the product image and details from the URL
    const shareMessage = `🛍️ Check out this amazing product!\n\n*${
      product.name
    }*\n💰 Price: ₹${price.toLocaleString("en-IN")}\n\n${productUrl}`;

    // Create WhatsApp share URL
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      shareMessage
    )}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank");
  };

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/products/id/${id}`
      );
      const data: Product = await response.json(); // Explicitly type data

      setProduct(data);

      // Initialize variant selection if product has variants
      if (data.product_variants && data.product_variants.length > 0) {
        setSelectedVariant(data.product_variants[0]);
        // Set default size from first variant
        if (data.product_variants[0].sizes.length > 0) {
          setSelectedSize(data.product_variants[0].sizes[0].size);
        }
      } else {
        // Fallback to main product sizes
        if (data.sizes && data.sizes.length > 0 && !selectedSize) {
          setSelectedSize(data.sizes[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleBuyNow = async () => {
    if (!selectedSize) {
      alert("Please select a size"); // Using alert for simplicity
      console.error("Please select a size");
      return;
    }
    if (!product) {
      console.error("Product not loaded");
      return;
    }

    // Check if user is logged in
    if (!userData?.isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    try {
      // First add the product to cart with variant data
      await addToCart(
        product._id,
        1,
        selectedSize,
        selectedVariant?.color || undefined,
        selectedVariant || undefined
      );

      // Then navigate to checkout with complete product data including selected size
      const productData = {
        id: product._id,
        name: product.name,
        brand: product.brand.name,
        price: selectedVariant
          ? typeof selectedVariant.price === "object" &&
            selectedVariant.price !== null &&
            "$numberDecimal" in selectedVariant.price
            ? selectedVariant.price.$numberDecimal
            : selectedVariant.price
          : typeof product.price === "object" &&
            product.price !== null &&
            "$numberDecimal" in product.price
          ? product.price.$numberDecimal
          : product.price,
        images: selectedVariant
          ? selectedVariant.images
          : getEffectiveImages(product),
        selectedSize: selectedSize,
        sizes: product.sizes || [], // Pass available sizes
        quantity: 1,
        offerPercentage: product.offerPercentage,
        assigned_coupon: product.assigned_coupon, // Include assigned coupon
        color: selectedVariant?.color || undefined, // Include selected color
      };

      navigate("/checkout", {
        state: {
          product: productData,
          directBuy: true,
        },
      });
    } catch (error) {
      console.error("❌ Failed to add product to cart:", error);
      // Don't show generic error - let BrandValidationError component handle it
    }
  };

  // Remove handleAddToBag function and all swipe handlers

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>
    );
  if (!product)
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        Product not found.
      </div>
    );

  const price = getEffectivePrice(product);

  // Calculate discounted price if offer percentage or coupon is assigned
  const calculateDiscountedPrice = () => {
    const originalPrice = price;
    let discount = 0;
    let discountType = "";
    let discountCode = "";

    // Check for offer percentage first (product-level offer)
    if (product?.offerPercentage && product.offerPercentage > 0) {
      discount = (originalPrice * product.offerPercentage) / 100;
      discountType = "offer";
    }
    // Check for coupon discount if no offer percentage
    else if (
      product?.assigned_coupon &&
      product.assigned_coupon.is_currently_valid
    ) {
      if (product.assigned_coupon.discount_type === "percentage") {
        discount =
          (originalPrice * product.assigned_coupon.discount_value) / 100;
        if (
          product.assigned_coupon.max_discount_amount &&
          discount > product.assigned_coupon.max_discount_amount
        ) {
          discount = product.assigned_coupon.max_discount_amount;
        }
      } else {
        discount = Math.min(
          product.assigned_coupon.discount_value,
          originalPrice
        );
      }
      discountType = "coupon";
      discountCode = product.assigned_coupon.coupon_code;
    }

    // Return null if no discount
    if (discount === 0) {
      return null;
    }

    return {
      original: originalPrice,
      discounted: originalPrice - discount,
      discount: discount,
      discountType: discountType,
      discountCode: discountCode,
      offerPercentage: product?.offerPercentage,
    };
  };

  const pricingInfo = calculateDiscountedPrice();

  return (
    <div className="relative max-w-md mx-auto min-h-screen bg-gray-900 text-white overflow-x-hidden">
      <div className="pb-24">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <span className="text-sm text-gray-400">Back</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/search")}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center w-10 h-10"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleCuratedListToggle}
              disabled={curatedListLoading}
              className={`p-2 rounded-full transition-all flex items-center justify-center w-10 h-10 ${
                isInCuratedList(product._id)
                  ? "bg-red-500 text-white"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              } ${curatedListLoading ? "opacity-50" : ""}`}
              aria-label={
                isInCuratedList(product._id)
                  ? "Remove from curated list"
                  : "Add to curated list"
              }
            >
              <Heart
                size={20}
                className={isInCuratedList(product._id) ? "fill-current" : ""}
              />
            </button>
          </div>
        </div>

        {/* Main Product Image */}
        <div className="relative">
          <div className="relative h-96 bg-gradient-to-br from-red-900 to-red-700 rounded-2xl mx-4 overflow-hidden">
            <div className="absolute bottom-4 right-4 z-10 bg-black bg-opacity-60 text-white p-2 rounded-full flex items-center justify-center">
              <Share className="w-5 h-5" />
            </div>
            {/* Curated List Heart Button */}
            <button
              onClick={handleCuratedListToggle}
              disabled={curatedListLoading}
              className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-all flex items-center justify-center ${
                isInCuratedList(product._id)
                  ? "bg-red-500 text-white"
                  : "bg-black bg-opacity-60 text-white hover:bg-opacity-80"
              } ${curatedListLoading ? "opacity-50" : ""}`}
              aria-label={
                isInCuratedList(product._id)
                  ? "Remove from curated list"
                  : "Add to curated list"
              }
            >
              <Heart
                size={20}
                className={isInCuratedList(product._id) ? "fill-current" : ""}
              />
            </button>
            <img
              src={getEffectiveImages(product)[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/600x600/ef4444/ffffff?text=Image+Failed";
              }}
            />
          </div>

          {/* Thumbnail Images */}
          <div className="flex justify-center space-x-2 mt-4 px-4">
            {getEffectiveImages(product).map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentImageIndex
                    ? "border-blue-500"
                    : "border-gray-600"
                }`}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/64x64/374151/ffffff?text=Img";
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {product.brand.name}
              </h1>
              <p className="text-gray-400">{product.name}</p>
            </div>
            <div className="text-right">
              {pricingInfo ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="text-lg text-gray-400 line-through">
                      {product.currency}
                      {pricingInfo.original.toFixed(2)}
                    </span>
                    <span className="text-2xl font-bold text-green-400">
                      {product.currency}
                      {pricingInfo.discounted.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-green-400 font-medium">
                    {pricingInfo.discountType === "offer" ? (
                      <>Limited Offer: {pricingInfo.offerPercentage}% Off!</>
                    ) : (
                      <>
                        Save {product.currency}
                        {pricingInfo.discount.toFixed(2)} with{" "}
                        {pricingInfo.discountCode}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-2xl font-bold text-white">
                  {product.currency}
                  {price}
                </span>
              )}
            </div>
          </div>

          {/* Variant Selection */}
          {hasVariants(product) && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Color</h3>
              <div className="flex space-x-3 mb-4">
                {product.product_variants!.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedVariant(variant);
                      // Reset size selection when variant changes
                      if (variant.sizes.length > 0) {
                        setSelectedSize(variant.sizes[0].size);
                      }
                      setCurrentImageIndex(0); // Reset to first image
                    }}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      selectedVariant === variant
                        ? "border-white bg-white text-black"
                        : "border-gray-600 text-white hover:border-white"
                    }`}
                  >
                    {variant.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Size</h3>
              <button className="text-white underline text-sm">
                size chart
              </button>
            </div>
            <div className="flex space-x-3 mb-2">
              {getAvailableSizes(product).map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    selectedSize === size
                      ? "border-white bg-white text-black"
                      : "border-gray-600 text-white hover:border-white"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {/* Conditional rendering for low stock only */}
            {selectedSize && getStockForSize(product, selectedSize) > 0 && getStockForSize(product, selectedSize) <= 5 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Low Stock
                </span>
                <p className="text-sm text-red-400">
                  ⚡ {getStockForSize(product, selectedSize)} left
                </p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div>
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab("SPECIFICATION")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "SPECIFICATION"
                    ? "border-white text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                SPECIFICATION
              </button>
              <button
                onClick={() => setActiveTab("DESCRIPTION")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "DESCRIPTION"
                    ? "border-white text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                DESCRIPTION
              </button>
            </div>

            <div className="pt-4">
              {activeTab === "SPECIFICATION" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {/* Use optional chaining for specifications */}
                  <div>
                    <p className="text-gray-400">Pattern</p>
                    <p className="text-white font-medium">
                      {product.specifications?.pattern}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Length</p>
                    <p className="text-white font-medium">
                      {product.specifications?.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Fabric</p>
                    <p className="text-white font-medium">
                      {product.specifications?.fabric}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Sleeve length</p>
                    <p className="text-white font-medium">
                      {product.specifications?.sleeveLength}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Fit</p>
                    <p className="text-white font-medium">
                      {product.specifications?.fit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Distress</p>
                    <p className="text-white font-medium">
                      {product.specifications?.distress}
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "DESCRIPTION" && (
                <p className="text-gray-300">{product.description}</p>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 py-4"></div>
        </div>
      </div>

      {/* Bottom Action Bar: Simple Buy Now Button */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
        <div className="px-4 py-3">
          <button
            onClick={handleBuyNow}
            disabled={!selectedSize || !hasStockForSelectedSize()}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              selectedSize && hasStockForSelectedSize()
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            {!selectedSize
              ? "SELECT SIZE TO BUY"
              : !hasStockForSelectedSize()
              ? "OUT OF STOCK"
              : "BUY NOW"}
          </button>
        </div>
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

export default ProductPage;
