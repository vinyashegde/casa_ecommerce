import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, ArrowLeft, TrendingUp, Users, Flame, Star, Clock, Eye } from "lucide-react";
import { getTrendingProducts, TrendingProduct } from "../utils/analytics";
import { useImages } from "../contexts/ImageContext";
import InfiniteCarousel from "../components/InfiniteCarousel";

const TrendsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGender, setSelectedGender] = useState<"M" | "W" | "U">("M");
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<"24h" | "7d" | "30d">("7d");

  // Use image context
  const {
    featuredTrendImage,
    trendImages,
    loading: imagesLoading,
  } = useImages();

  // Enhanced carousel items for trends
  const trendCarouselItems = [
    {
      id: "trending-now",
      title: "TRENDING NOW",
      subtitle: "Most swiped products this week",
      image: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=800",
      buttonText: "Explore",
      gradient: "from-red-600 to-pink-600",
      onClick: () => setTimeWindow("7d")
    },
    {
      id: "hot-picks",
      title: "HOT PICKS",
      subtitle: "Rising stars in fashion",
      image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=800",
      buttonText: "Discover",
      gradient: "from-orange-600 to-red-600",
      onClick: () => setTimeWindow("24h")
    },
    {
      id: "viral-styles",
      title: "VIRAL STYLES",
      subtitle: "Community favorites",
      image: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800",
      buttonText: "Join Trend",
      gradient: "from-purple-600 to-indigo-600",
      onClick: () => setTimeWindow("30d")
    }
  ];

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleGenderChange = (gender: "M" | "W" | "U") => {
    setSelectedGender(gender);
  };

  // Fetch trending products from analytics API
  const fetchTrendingProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTrendingProducts(
        selectedGender,
        timeWindow,
        20
      );
      setTrendingProducts(response.data.trendingProducts || []);
    } catch (error) {
      console.error("Error fetching trending products:", error);
      setTrendingProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGender, timeWindow]);

  // Fetch trending products when gender or time window changes
  useEffect(() => {
    fetchTrendingProducts();
  }, [fetchTrendingProducts]);

  // Add real-time update listener
  useEffect(() => {
    const handleTrendingUpdate = () => {
      fetchTrendingProducts();
    };

    window.addEventListener("trendingUpdated", handleTrendingUpdate);

    return () => {
      window.removeEventListener("trendingUpdated", handleTrendingUpdate);
    };
  }, [fetchTrendingProducts]);

  const formatPrice = (price: unknown) => {
    if (price && typeof price === "object" && "$numberDecimal" in price) {
      const decimalPrice = (price as { $numberDecimal: string }).$numberDecimal;
      return `₹${parseFloat(decimalPrice).toLocaleString("en-IN")}`;
    }
    return "₹N/A";
  };

  const getEngagementBadge = (engagementScore: number) => {
    if (engagementScore >= 10) return { text: "🔥 VIRAL", color: "from-red-500 to-orange-500" };
    if (engagementScore >= 5) return { text: "📈 HOT", color: "from-orange-500 to-yellow-500" };
    if (engagementScore >= 0) return { text: "👍 TRENDING", color: "from-green-500 to-blue-500" };
    return { text: "⭐ NEW", color: "from-purple-500 to-pink-500" };
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-purple-950 text-white min-h-screen pb-20">
      {/* Enhanced Header */}
      <div className="px-4 py-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate("/")} 
              className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <ArrowLeft size={24} className="text-white hover:text-blue-400 transition-colors" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                TRENDS
              </h1>
              <p className="text-sm text-gray-400">Discover what's hot</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate("/search")} 
              className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <Search size={20} className="text-white hover:text-blue-400 transition-colors" />
            </button>
            <button 
              onClick={() => navigate("/profile")} 
              className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <User size={20} className="text-white hover:text-blue-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Enhanced Gender Toggle */}
        <div className="flex justify-center">
          <div className="flex space-x-2 p-1 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-600/30">
            {[
              { key: "M" as const, label: "MEN", gradient: "from-blue-600 to-blue-500", image: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100" },
              { key: "W" as const, label: "WOMEN", gradient: "from-pink-600 to-pink-500", image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100" },
              { key: "U" as const, label: "UNISEX", gradient: "from-purple-600 to-purple-500", image: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100" }
            ].map(({ key, label, gradient, image }) => (
              <button
                key={key}
                onClick={() => handleGenderChange(key)}
                className={`relative flex items-center px-4 py-2 rounded-xl font-bold text-sm transition-all duration-500 ${
                  selectedGender === key
                    ? `bg-gradient-to-r ${gradient} text-white shadow-xl scale-105`
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <img src={image} alt={label} className="w-5 h-5 rounded-full mr-2 object-cover" />
                <span className="tracking-wide">{label}</span>
                {selectedGender === key && (
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${gradient} opacity-20 animate-pulse`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Infinite Carousel for Trends */}
      <div className="px-4 py-6">
        <InfiniteCarousel 
          items={trendCarouselItems}
          autoScrollInterval={4000}
          showDots={false}
          showArrows={false}
        />
      </div>

      {/* Time Window Selector */}
      <div className="px-4 mb-6">
        <div className="flex justify-center">
          <div className="flex space-x-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-1 border border-gray-600/30">
            {(["24h", "7d", "30d"] as const).map((window) => (
              <button
                key={window}
                onClick={() => setTimeWindow(window)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  timeWindow === window
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>
                    {window === "24h" ? "24H" : window === "7d" ? "7D" : "30D"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-600/30">
          <div className="flex justify-between items-center text-center">
            <div className="flex-1">
              <div className="text-2xl font-black text-purple-400">{trendingProducts.length}</div>
              <div className="text-xs text-gray-400">Trending Items</div>
            </div>
            <div className="w-px h-8 bg-gray-600"></div>
            <div className="flex-1">
              <div className="text-2xl font-black text-pink-400">
                {trendingProducts.reduce((sum, p) => sum + p.totalSwipes, 0)}
              </div>
              <div className="text-xs text-gray-400">Total Swipes</div>
            </div>
            <div className="w-px h-8 bg-gray-600"></div>
            <div className="flex-1">
              <div className="text-2xl font-black text-blue-400">
                {timeWindow === "24h" ? "Today" : timeWindow === "7d" ? "Week" : "Month"}
              </div>
              <div className="text-xs text-gray-400">Time Frame</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Products Grid */}
      <div className="px-4">
        <div className="flex items-center mb-6">
          <TrendingUp className="text-red-400 mr-3" size={24} />
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
            Trending for {selectedGender === "M" ? "Men" : selectedGender === "W" ? "Women" : "Unisex"}
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-400 border-t-transparent mb-4"></div>
            <p className="text-gray-400 font-medium">Analyzing trends...</p>
          </div>
        ) : trendingProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {trendingProducts.map((product, index) => {
              const badge = getEngagementBadge(product.engagementScore);
              return (
                <div
                  key={product._id}
                  className="group bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-500 border border-gray-700/50 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/20"
                  onClick={() => handleProductClick(product.product._id)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative">
                    <img
                      src={
                        product.product.images && product.product.images.length > 0
                          ? product.product.images[0]
                          : "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400"
                      }
                      alt={product.product.name}
                      className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Engagement Badge */}
                    <div className={`absolute top-3 left-3 bg-gradient-to-r ${badge.color} text-white px-2 py-1 rounded-xl text-xs font-bold shadow-lg`}>
                      {badge.text}
                    </div>
                    
                    {/* Score Badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-xl text-xs font-bold flex items-center space-x-1">
                      <Star size={12} className="text-yellow-400" />
                      <span>{product.engagementScore}</span>
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-black text-sm text-white mb-1 truncate">
                      {product.product.brand?.name || "Premium Brand"}
                    </h3>
                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                      {product.product.name}
                    </p>
                    
                    {/* Price */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-bold text-lg">
                        {formatPrice(product.product.price)}
                      </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-blue-400">
                        <Eye size={12} />
                        <span>{product.totalSwipes}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-400">
                        <Users size={12} />
                        <span>{Math.round(product.engagementRate * 100)}%</span>
                      </div>
                      <div className="text-gray-400">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800/30 rounded-3xl border border-gray-700/50">
            <Flame className="mx-auto mb-4 text-gray-500" size={48} />
            <p className="text-gray-400 font-medium mb-2">
              No trending products found for this period
            </p>
            <p className="text-gray-500 text-sm">
              Be the first to discover trending styles by swiping more products!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendsPage;