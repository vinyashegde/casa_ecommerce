import React from "react";
import { TrendingUp, Users, Heart } from "lucide-react";

interface ProductVariant {
  color: string;
  sizes: { size: string; stock: number }[];
  price: { $numberDecimal: string };
  images: string[];
  sku?: string;
}

interface TrendingProduct {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: {
      $numberDecimal: string;
    };
    images: string[];
    product_variants?: ProductVariant[];
    brand?: {
      name: string;
    };
  };
  engagementScore: number;
  totalSwipes: number;
  engagementRate: number;
}

interface TrendingProductCardProps {
  trendingProduct: TrendingProduct;
  onClick: () => void;
}

const TrendingProductCard: React.FC<TrendingProductCardProps> = ({
  trendingProduct,
  onClick,
}) => {
  // Helper function to get effective images for a product (handles variants)
  const getEffectiveImages = (product: any): string[] => {
    // Always use variant images - no fallback to main product images
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants[0].images || [];
    }
    // Return empty array if no variants (no fallback to main images)
    return [];
  };

  const getBadgeConfig = (score: number) => {
    if (score >= 10)
      return { text: "🔥 HOT", color: "from-red-500 to-orange-500" };
    if (score >= 5)
      return { text: "📈 RISING", color: "from-yellow-500 to-orange-500" };
    if (score >= 0)
      return { text: "👍 LIKED", color: "from-green-500 to-blue-500" };
    return { text: "⭐ NEW", color: "from-purple-500 to-pink-500" };
  };

  const badge = getBadgeConfig(trendingProduct.engagementScore);

  return (
    <div
      className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 border border-gray-700/50 hover:border-blue-400/50"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={
            getEffectiveImages(trendingProduct.product).length > 0
              ? getEffectiveImages(trendingProduct.product)[0]
              : "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400"
          }
          alt={trendingProduct.product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          <div
            className={`bg-gradient-to-r ${badge.color} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm`}
          >
            {badge.text}
          </div>
        </div>

        <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold border border-gray-600">
          +{trendingProduct.engagementScore}
        </div>

        {/* Heart Icon */}
        <div className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 hover:scale-110">
          <Heart size={16} className="text-white group-hover:text-red-100" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Brand and Swipes */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-blue-300 uppercase tracking-wide">
            {trendingProduct.product.brand?.name || "Fashion Brand"}
          </h3>
          <div className="flex items-center space-x-1 text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
            <TrendingUp size={12} />
            <span>{trendingProduct.totalSwipes}</span>
          </div>
        </div>

        {/* Product Name */}
        <p className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-blue-100 transition-colors duration-300">
          {trendingProduct.product.name}
        </p>

        {/* Price and Engagement */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white font-bold text-lg">
              ₹{trendingProduct.product.price?.$numberDecimal || "N/A"}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-400 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-2 py-1 rounded-full border border-blue-400/30">
            <Users size={12} />
            <span>{Math.round(trendingProduct.engagementRate * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out" />
    </div>
  );
};

export default TrendingProductCard;
