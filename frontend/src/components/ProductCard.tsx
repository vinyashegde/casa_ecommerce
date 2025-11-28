import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, AlertCircle } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useCuratedList } from "../contexts/CuratedListContext";
import { useCart } from "../contexts/CartContext";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import LoginPopup from "./LoginPopup";

interface ProductVariant {
  color: string;
  sizes: { size: string; stock: number }[];
  price: { $numberDecimal: string };
  images: string[];
  sku?: string;
}

interface Product {
  _id: string;
  name: string;
  images: string[];
  price: { $numberDecimal: string };
  currency: string;
  stock: number; // Main stock field
  brand?: {
    name: string;
    logo_url?: string;
  };
  category?: string[];
  tags?: string[];
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
}

interface ProductCardProps {
  product: Product;
  showAddToBag?: boolean;
  inCart?: boolean;
  addingToCart?: string | null;
  onAddToCart?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showAddToBag = true,
  inCart = false,
  addingToCart = null,
  onAddToCart = () => {},
}) => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const { isInCuratedList, addToCuratedList, removeFromCuratedList } =
    useCuratedList();
  const { getCurrentBrand } = useCart();
  const [curatedListLoading, setCuratedListLoading] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // Helper functions for variant handling
  const hasVariants = (product: Product): boolean => {
    return !!(product.product_variants && product.product_variants.length > 0);
  };

  const getEffectivePrice = (product: Product): number => {
    // If product has variants, use the first variant's price as reference
    if (product.product_variants && product.product_variants.length > 0) {
      return parseFloat(
        product.product_variants[0].price.$numberDecimal || "0"
      );
    }
    return parseFloat(product.price?.$numberDecimal || "0");
  };

  const getEffectiveImages = (product: Product): string[] => {
    // Always use variant images - no fallback to main product images
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants[0].images || [];
    }
    // Return empty array if no variants (no fallback to main images)
    return [];
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

  const price = getEffectivePrice(product);

  // Check if this product's brand matches the current cart brand
  const currentBrand = getCurrentBrand();
  const isBrandMismatch =
    currentBrand && product.brand && currentBrand.name !== product.brand.name;

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: product.currency || "INR",
    }).format(val);

  // Calculate discounted price if offer percentage or coupon is assigned
  const calculateDiscountedPrice = () => {
    const originalPrice = price;
    let discount = 0;
    let discountType = "";
    let discountCode = "";

    // Check for offer percentage first (product-level offer)
    if (product.offerPercentage && product.offerPercentage > 0) {
      discount = (originalPrice * product.offerPercentage) / 100;
      discountType = "offer";
    }
    // Check for coupon discount if no offer percentage
    else if (
      product.assigned_coupon &&
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
      offerPercentage: product.offerPercentage,
    };
  };

  const pricingInfo = calculateDiscountedPrice();

  const handleCuratedListToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userData?.isLoggedIn) {
      // Show login popup if not logged in
      setShowLoginPopup(true);
      return;
    }

    setCuratedListLoading(true);
    try {
      if (isInCuratedList(product._id)) {
        // Remove from curated list
        await removeFromCuratedList(product._id);
        showSuccessToast("Removed from wishlist");
      } else {
        // Add to curated list
        const curatedProduct = {
          _id: product._id,
          name: product.name,
          price: price,
          images: product.images,
          brand: product.brand || { name: "Unknown Brand" },
          category: product.category || [],
          tags: product.tags || [],
        };
        await addToCuratedList(curatedProduct);
        showSuccessToast("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling curated list:", error);
      showErrorToast("Failed to toggle curated list");
    } finally {
      setCuratedListLoading(false);
    }
  };

  return (
    <article className="rounded-2xl overflow-hidden border border-gray-900 bg-gray-925 focus-within:ring-2 focus-within:ring-blue-600">
      <button
        onClick={() => navigate(`/product/${product._id}`)}
        className="block w-full text-left"
        aria-label={`Open ${product.name}`}
      >
        <div className="relative">
          <div className="aspect-[3/4] bg-gray-900 overflow-hidden">
            {getEffectiveImages(product)[0] ? (
              <img
                src={getEffectiveImages(product)[0]}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                No image
              </div>
            )}
          </div>
          <span className="absolute top-2 left-2 text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded-full">
            TRY 'n BUY
          </span>

          {/* Variant Indicator */}
          {hasVariants(product) && (
            <span className="absolute top-2 left-20 text-[10px] font-bold bg-blue-500 text-white px-2 py-1 rounded-full">
              {product.product_variants!.length} Colors
            </span>
          )}

          {/* Brand Mismatch Warning */}
          {isBrandMismatch && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-[10px] font-bold">
              <AlertCircle size={10} />
              New Brand
            </div>
          )}

          {/* Curated List Heart Button */}
          <button
            onClick={handleCuratedListToggle}
            disabled={curatedListLoading}
            className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
              isInCuratedList(product._id)
                ? "bg-red-500 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            } ${curatedListLoading ? "opacity-50" : ""}`}
            aria-label={
              isInCuratedList(product._id)
                ? "Remove from curated list"
                : "Add to curated list"
            }
          >
            <Heart
              size={16}
              className={isInCuratedList(product._id) ? "fill-current" : ""}
            />
          </button>

          {/* Stock Status Badge */}
          <div className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full ${
            getStockStatus(product) === 'out-of-stock'
              ? 'bg-red-500 text-white'
              : getStockStatus(product) === 'low-stock'
              ? 'bg-orange-500 text-white'
              : 'bg-green-500 text-white'
          }`}>
            {getStockStatus(product) === 'out-of-stock'
              ? 'Out of Stock'
              : getStockStatus(product) === 'low-stock'
              ? `${getTotalStock(product)} Left`
              : `${getTotalStock(product)} In Stock`}
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug">
            {product.name}
          </h3>
          {pricingInfo ? (
            <div className="mt-2 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400 line-through">
                  {formatINR(pricingInfo.original)}
                </span>
                <span className="text-base font-bold text-green-400">
                  {formatINR(pricingInfo.discounted)}
                </span>
              </div>
              <div className="text-xs text-green-400 font-medium">
                {pricingInfo.discountType === "offer" ? (
                  <>Limited Offer: {pricingInfo.offerPercentage}% Off!</>
                ) : (
                  <>
                    Save {formatINR(pricingInfo.discount)} with{" "}
                    {pricingInfo.discountCode}
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-base font-bold">{formatINR(price)}</p>
          )}
        </div>
      </button>

      {showAddToBag && (
        <div className="px-3 pb-3">
          <button
            onClick={() => onAddToCart(product._id)}
            disabled={inCart || addingToCart === product._id || getStockStatus(product) === 'out-of-stock'}
            className={`w-full py-2 rounded-xl text-sm font-semibold active:scale-95 transition disabled:opacity-60 ${
              getStockStatus(product) === 'out-of-stock'
                ? "bg-gray-500 text-gray-300"
                : inCart
                ? "bg-green-600 text-white"
                : addingToCart === product._id
                ? "bg-blue-400 text-white"
                : isBrandMismatch
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            aria-live="polite"
          >
            {getStockStatus(product) === 'out-of-stock'
              ? "Out of Stock"
              : inCart
              ? "✓ Added to Bag"
              : addingToCart === product._id
              ? "Adding…"
              : isBrandMismatch
              ? "Switch Brand"
              : "Add to Bag"}
          </button>
        </div>
      )}

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onContinue={(email) => {
          setShowLoginPopup(false);
        }}
      />
    </article>
  );
};

export default ProductCard;
