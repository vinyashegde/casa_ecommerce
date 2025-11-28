import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  useTransform,
  useMotionValue,
  motion,
  AnimatePresence,
  animate,
  PanInfo,
} from "framer-motion";
import { ShoppingCart, Heart, Share2, HelpCircle, Filter, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useUser } from "../contexts/UserContext";
import { useCuratedList } from "../contexts/CuratedListContext";
import LoginPopup from "../components/LoginPopup";
import SwipeTutorialOverlay from "../components/SwipeTutorialOverlay";
import MasterFilters, { ActiveFilters } from "../components/MasterFilters";
import fetchProducts, { ProductFilters } from "../utils/fetchProductforSwipe";
import {
  trackSwipe,
  generateSessionId,
  getDeviceInfo,
} from "../utils/analytics";
import { showSuccessToast } from "../utils/toast";

// Product interface to match backend data
interface Product {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  price: {
    $numberDecimal: string;
  };
  currency: string;
  tags: string[];
  brand?: {
    name: string;
    logo_url?: string;
  };
  category?: string[];
  gender?: string;
  offerPercentage?: number;
  // Adding exitDirection for framer-motion exit animation
  exitDirection?: "left" | "right";
}

// Define props interface for SwipeableCard
interface SwipeableCardProps {
  product: Product;
  index: number;
  total: number;
  addToCart: (productId: string, quantity?: number, size?: string) => void;
  onSwipe: (productId: string, direction: "left" | "right") => void;
  isInCuratedList: (productId: string) => boolean;
  onCuratedListToggle: (productId: string) => void;
  onShare: (product: Product) => void;
  userData: {
    isLoggedIn: boolean;
    _id?: string;
  };
  onShowLoginPopup: () => void;
}

// Enhanced Swipeable Card Component with dynamic animations
const SwipeableCard = React.memo(function SwipeableCard({
  product,
  onSwipe,
  index,
  total,
  addToCart,
  isInCuratedList,
  onCuratedListToggle,
  onShare,
  userData,
  onShowLoginPopup,
}: SwipeableCardProps) {
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Enhanced transforms with more dynamic ranges
  const rotate = useTransform(x, [-350, 0, 350], [-30, 0, 30]);
  const scale = useTransform(x, [-350, 0, 350], [0.85, 1, 0.85]);
  const rotateY = useTransform(x, [-350, 0, 350], [15, 0, -15]);
  const brightness = useTransform(x, [-200, 0, 200], [0.7, 1, 0.7]);
  
  // Card stack transforms for background cards
  const backgroundScale = 0.95 - (index * 0.03);
  const backgroundY = index * 8;
  const backgroundRotate = index * 2;
  const backgroundOpacity = 1 - (index * 0.2);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const offsetX = info.offset.x;
    const offsetY = info.offset.y;
    const velocityX = info.velocity.x;
    const velocityY = info.velocity.y;

    // Enhanced swipe detection with velocity consideration
    const swipeThreshold = 120;
    const velocityThreshold = 800;
    const isSwipeAttempt =
      Math.abs(offsetX) > swipeThreshold || 
      Math.abs(velocityX) > velocityThreshold ||
      (Math.abs(offsetX) > 80 && Math.abs(velocityX) > 400);

    if (isSwipeAttempt && !userData?.isLoggedIn) {
      // Enhanced bounce back animation for non-logged in users
      onShowLoginPopup();
      animate(x, 0, { 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 0.8
      });
      animate(y, 0, { 
        type: "spring", 
        stiffness: 400, 
        damping: 25 
      });
      return;
    }

    // Enhanced swipe logic with complete exit - no return to middle
    if (offsetX > swipeThreshold || velocityX > velocityThreshold) {
      // Swipe right - animate completely off screen
      const finalX = window.innerWidth + 200;
      const finalRotation = 30;
      
      animate(x, finalX, { 
        type: "tween", 
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      });
      animate(y, Math.random() * 100 - 50, { 
        type: "tween", 
        duration: 0.4 
      });
      
      // Trigger swipe callback after a short delay
      setTimeout(() => {
        onSwipe(product._id, "right");
      }, 150);
      
    } else if (offsetX < -swipeThreshold || velocityX < -velocityThreshold) {
      // Swipe left - animate completely off screen
      const finalX = -window.innerWidth - 200;
      const finalRotation = -30;
      
      animate(x, finalX, { 
        type: "tween", 
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      });
      animate(y, Math.random() * 100 - 50, { 
        type: "tween", 
        duration: 0.4 
      });
      
      // Trigger swipe callback after a short delay
      setTimeout(() => {
        onSwipe(product._id, "left");
      }, 150);
      
    } else {
      // Smooth spring animation back to center (only for insufficient swipe)
      animate(x, 0, { 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        mass: 0.7
      });
      animate(y, 0, { 
        type: "spring", 
        stiffness: 500, 
        damping: 30 
      });
    }
  };

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product._id}`);
  }, [navigate, product._id]);

  // Memoize button handlers
  const handleAddToCart = useCallback(() => {
    addToCart(product._id, 1, "M");
  }, [addToCart, product._id]);

  const handleCuratedListToggle = useCallback(() => {
    onCuratedListToggle(product._id);
  }, [onCuratedListToggle, product._id]);

  const handleShare = useCallback(() => {
    onShare(product);
  }, [onShare, product]);

  // Removed swipe indicators - no longer needed

  // Calculate price display with offer pricing
  const originalPrice = product.price?.$numberDecimal
    ? parseFloat(product.price.$numberDecimal)
    : 0;
  const offerPercentage = product.offerPercentage || 0;

  const priceDisplay =
    originalPrice > 0 ? originalPrice.toLocaleString("en-IN") : "N/A";

  // Calculate discounted price if offer exists
  const discountedPrice =
    offerPercentage > 0
      ? originalPrice - (originalPrice * offerPercentage) / 100
      : originalPrice;
  const discountedPriceDisplay =
    discountedPrice > 0 ? discountedPrice.toLocaleString("en-IN") : "N/A";

  // Check if product is in curated list
  const isInList = isInCuratedList(product._id);

  return (
    <motion.div
      className="absolute w-full h-full will-change-transform flex items-center justify-center"
      style={{ 
        zIndex: total - index,
        scale: backgroundScale,
        y: backgroundY,
        rotate: backgroundRotate,
        opacity: backgroundOpacity
      }}
      initial={{ 
        scale: 0.8, 
        y: 50, 
        opacity: 0,
        rotate: Math.random() * 10 - 5 // Random initial rotation
      }}
      animate={{ 
        scale: backgroundScale, 
        y: backgroundY, 
        opacity: backgroundOpacity,
        rotate: backgroundRotate
      }}
      exit={{
        x: product.exitDirection === "right" ? window.innerWidth + 300 : -window.innerWidth - 300,
        y: Math.random() * 200 - 100, // More dramatic random exit trajectory
        scale: 0.5,
        rotate: product.exitDirection === "right" ? 45 : -45,
        opacity: 0,
        transition: { 
          duration: 0.5, 
          ease: [0.4, 0, 0.2, 1],
          type: "tween"
        },
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        mass: 0.8,
        delay: index * 0.05 // Staggered animation
      }}
      onClick={handleCardClick}
    >
      <motion.div
        className="bg-zinc-800 w-full h-full will-change-transform rounded-2xl touch-none select-none cursor-grab shadow-2xl"
        style={{
          x,
          y,
          rotate,
          scale,
          rotateY,
          filter: brightness,
          transformStyle: "preserve-3d",
          transform: "translateZ(0)", // Force hardware acceleration
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{
          left: 0.3,
          right: 0.3,
        }}
        dragMomentum={true}
        dragTransition={{
          bounceStiffness: 600,
          bounceDamping: 20,
          power: 0.3
        }}
        onDragEnd={handleDragEnd}
        whileTap={{ 
          cursor: "grabbing",
          scale: 0.98,
          transition: { duration: 0.1 }
        }}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
      >
        <div className="relative w-full h-full rounded-2xl overflow-hidden">
          {/* Removed BAG and SKIP indicators */}

          {/* Enhanced image with loading animation */}
          <motion.img
            src={
              product.images && product.images.length > 0
                ? product.images[0]
                : "https://placehold.co/400x600/27272a/ffffff?text=No+Image"
            }
            className="w-full h-full object-cover select-none pointer-events-none"
            alt={product.name}
            loading={index < 2 ? "eager" : "lazy"}
            draggable={false}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/400x600/27272a/ffffff?text=No+Image";
            }}
          />

          <motion.div 
            className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 text-white select-none"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {/* Brand Logo */}
            {product.brand && (
              <motion.div 
                className="mb-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                {product.brand.logo_url ? (
                  <img
                    src={product.brand.logo_url}
                    alt={product.brand.name}
                    className="h-8 w-auto object-contain bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg"
                    onError={(e) => {
                      // Fallback to brand name if logo fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`${product.brand.logo_url ? 'hidden' : ''} inline-flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg`}>
                  <span className="text-sm font-bold text-white/90">{product.brand.name}</span>
                </div>
              </motion.div>
            )}
            {offerPercentage > 0 ? (
              <div className="space-y-1">
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg text-zinc-400 line-through">
                    ₹{priceDisplay}
                  </span>
                  <p className="text-2xl font-bold text-green-400">
                    ₹{discountedPriceDisplay}
                  </p>
                  <p className="text-sm text-zinc-300">
                    {product.currency || "INR"}
                  </p>
                </div>
                <p className="text-sm text-green-400 font-medium">
                  {offerPercentage}% Off!
                </p>
              </div>
            ) : (
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">₹{priceDisplay}</p>
                <p className="text-sm text-zinc-300">
                  {product.currency || "INR"}
                </p>
              </div>
            )}
            <p className="text-lg font-bold mt-1">
              {product.name || "Product Name"}
            </p>
            {product.description && (
              <p className="text-sm text-zinc-200 truncate">
                {product.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {product.tags
                ?.slice(0, 3)
                .map((tag: string, tagIndex: number) => (
                  <span
                    key={tagIndex}
                    className="text-xs bg-white/20 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
            </div>
            <div className="absolute right-4 bottom-4 flex flex-col items-center gap-2">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click from bubbling to parent card
                  if (!userData?.isLoggedIn) {
                    onShowLoginPopup();
                    return;
                  }
                  handleAddToCart();
                }}
                className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.85 }}
                title="Buy Now"
              >
                <ShoppingCart size={20} />
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click from bubbling to parent card
                  if (!userData?.isLoggedIn) {
                    onShowLoginPopup();
                    return;
                  }
                  handleCuratedListToggle();
                }}
                className={`p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
                  isInList
                    ? "bg-red-500 text-white hover:bg-red-600 ring-2 ring-red-300"
                    : "bg-white/90 text-gray-700 hover:bg-red-100 hover:text-red-500"
                }`}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.85 }}
                animate={isInList ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
                title={
                  isInList ? "Remove from Curated List" : "Add to Curated List"
                }
              >
                <Heart
                  size={20}
                  className={
                    isInList ? "fill-current text-white" : "hover:fill-current"
                  }
                />
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click from bubbling to parent card
                  handleShare();
                }}
                className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-900 transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.85 }}
                title="Share Product on WhatsApp"
              >
                <Share2 size={20} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
});

function Deck() {
  const { addToCart } = useCart();
  const { userData } = useUser();
  const { isInCuratedList, addToCuratedList, removeFromCuratedList } =
    useCuratedList();

  // Master filters state
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    colors: [],
    brands: [],
    categories: [],
    gender: 'all',
    sizes: [],
  });
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [focusSection, setFocusSection] = useState<'gender' | 'colors' | 'brands' | 'categories' | 'sizes' | undefined>(undefined);

  // Optimized lazy loading system
  const PRODUCTS_PER_BATCH = 8; // Reduced batch size for better performance
  const PRELOAD_THRESHOLD = 3; // Start loading when only 3 products remain
  const MAX_VISIBLE_CARDS = 3; // Only render 3 cards at a time

  // State for lazy loading system
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [swipedProducts, setSwipedProducts] = useState<Product[]>([]); // Track swiped products
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [seenProductIds, setSeenProductIds] = useState<Set<string>>(new Set());

  // Refs for performance optimization
  const preloadTimeoutRef = useRef<number | null>(null);
  const preloadedImages = useRef<Set<string>>(new Set());

  // Image preloading function
  const preloadImage = useCallback((src: string) => {
    if (preloadedImages.current.has(src)) return;

    const img = new Image();
    img.onload = () => {
      preloadedImages.current.add(src);
    };
    img.src = src;
  }, []);

  // Preload images for upcoming products
  const preloadUpcomingImages = useCallback(
    (products: Product[]) => {
      products.slice(0, 3).forEach((product) => {
        if (product.images && product.images.length > 0) {
          preloadImage(product.images[0]);
        }
      });
    },
    [preloadImage]
  );

  // Memoized function to load initial batch of products with filters
  const loadInitialProducts = useCallback(async () => {
    setLoading(true);

    try {
      // Convert activeFilters to ProductFilters format
      const productFilters: ProductFilters = {
        gender: activeFilters.gender !== 'all' ? activeFilters.gender as 'male' | 'female' | 'unisex' : undefined,
        brands: activeFilters.brands.length > 0 ? activeFilters.brands : undefined,
        categories: activeFilters.categories.length > 0 ? activeFilters.categories : undefined,
        sizes: activeFilters.sizes.length > 0 ? activeFilters.sizes : undefined,
        colors: activeFilters.colors.length > 0 ? activeFilters.colors : undefined,
      };

      // Fetch only first batch of products with filters
      const initialProducts = await fetchProducts(
        1,
        PRODUCTS_PER_BATCH,
        [],
        activeFilters.gender !== 'all' ? activeFilters.gender as 'male' | 'female' | 'unisex' : undefined,
        productFilters
      );

      // Set initial products
      setDisplayedProducts(initialProducts);

      // Preload images for initial products
      preloadUpcomingImages(initialProducts);

      // Set initial seen products
      const initialProductIds = initialProducts.map((product) => product._id);
      setSeenProductIds(new Set(initialProductIds));

      // Check if more products are available
      setHasMoreProducts(initialProducts.length === PRODUCTS_PER_BATCH);
      setCurrentPage(1);

      setLoading(false);
      
      // Show tutorial for new users
      const hasSeenTutorial = localStorage.getItem('hasSeenSwipeTutorial');
      if (!hasSeenTutorial) {
        setTimeout(() => setShowTutorial(true), 1000);
      }
    } catch (error) {
      console.error("❌ Error loading initial products:", error);
      setLoading(false);
    }
  }, [activeFilters, PRODUCTS_PER_BATCH, preloadUpcomingImages]);

  // Memoized function to load next batch of products with filters
  const loadNextBatch = useCallback(async () => {
    if (loadingMore || !hasMoreProducts) return;

    setLoadingMore(true);

    try {
      const excludeIds = Array.from(seenProductIds);
      
      // Convert activeFilters to ProductFilters format
      const productFilters: ProductFilters = {
        gender: activeFilters.gender !== 'all' ? activeFilters.gender as 'male' | 'female' | 'unisex' : undefined,
        brands: activeFilters.brands.length > 0 ? activeFilters.brands : undefined,
        categories: activeFilters.categories.length > 0 ? activeFilters.categories : undefined,
        sizes: activeFilters.sizes.length > 0 ? activeFilters.sizes : undefined,
        colors: activeFilters.colors.length > 0 ? activeFilters.colors : undefined,
      };
      
      const newProducts = await fetchProducts(
        currentPage + 1,
        PRODUCTS_PER_BATCH,
        excludeIds,
        activeFilters.gender !== 'all' ? activeFilters.gender as 'male' | 'female' | 'unisex' : undefined,
        productFilters
      );

      if (newProducts.length === 0) {
        setHasMoreProducts(false);
      } else {
        // Add new products to display
        setDisplayedProducts((prev) => [...prev, ...newProducts]);

        // Preload images for new products
        preloadUpcomingImages(newProducts);

        // Update seen products
        const newProductIds = newProducts.map((product) => product._id);
        setSeenProductIds((prev) => new Set([...prev, ...newProductIds]));

        // Update page and check if more available
        setCurrentPage((prev) => prev + 1);
        setHasMoreProducts(newProducts.length === PRODUCTS_PER_BATCH);
      }
    } catch (error) {
      console.error("❌ Error loading next batch:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMoreProducts,
    currentPage,
    seenProductIds,
    activeFilters,
    PRODUCTS_PER_BATCH,
    preloadUpcomingImages,
  ]);

  // Memoized check for preloading
  const shouldPreload = useMemo(
    () =>
      displayedProducts.length <= PRELOAD_THRESHOLD &&
      hasMoreProducts &&
      !loadingMore,
    [displayedProducts.length, hasMoreProducts, loadingMore, PRELOAD_THRESHOLD]
  );

  // Memoized visible products for virtualization
  const visibleProducts = useMemo(
    () => displayedProducts.slice(0, MAX_VISIBLE_CARDS),
    [displayedProducts, MAX_VISIBLE_CARDS]
  );

  // Filter change handler
  const handleFiltersChange = useCallback((newFilters: ActiveFilters) => {
    setActiveFilters(newFilters);
    // Reset state and reload products with new filters
    setDisplayedProducts([]);
    setSeenProductIds(new Set());
    setCurrentPage(1);
    setHasMoreProducts(true);
  }, []);

  // Initial product load and reload on filter change
  useEffect(() => {
    loadInitialProducts();
  }, [loadInitialProducts]);

  // Optimized preloading with debouncing
  useEffect(() => {
    if (shouldPreload) {
      // Clear any existing timeout
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }

      // Debounce preloading to avoid rapid API calls
      preloadTimeoutRef.current = setTimeout(() => {
        loadNextBatch();
      }, 500);
    }

    // Cleanup timeout on unmount
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [shouldPreload, loadNextBatch]);

  // Memoized function to trigger real-time updates
  const triggerTrendingUpdate = useCallback(() => {
    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("trendingUpdated", {
        detail: { timestamp: Date.now() },
      })
    );
  }, []);

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenSwipeTutorial', 'true');
  }, []);

  // Handle the swipe action from the card component
  const handleSwipe = useCallback(
    async (productId: string, direction: "left" | "right") => {
      // If user is not logged in, show login popup
      if (userData.isLoggedIn === false) {
        setShowLoginPopup(true);
        return;
      }

      // Find the swiped product and add to swiped products history
      const swipedProduct = displayedProducts.find(p => p._id === productId);
      if (swipedProduct) {
        setSwipedProducts(prev => [swipedProduct, ...prev]); // Add to beginning of array
      }

      // Track swipe analytics (non-blocking)
      const trackAnalytics = async () => {
        try {
          const action = direction === "right" ? "like" : "dislike";
          const sessionId = generateSessionId();
          const deviceInfo = getDeviceInfo();

          await trackSwipe({
            userId: userData._id,
            productId,
            action,
            sessionId,
            deviceInfo,
          });

          // Trigger real-time trending update
          triggerTrendingUpdate();
        } catch (error) {
          console.error("Error tracking swipe:", error);
        }
      };

      // Don't await analytics to avoid blocking UI
      trackAnalytics();

      // Set exit direction for the animation
      setDisplayedProducts((prev) =>
        prev.map((c) =>
          c._id === productId ? { ...c, exitDirection: direction } : c
        )
      );

      // After the animation, remove the card from the state
      setTimeout(() => {
        setDisplayedProducts((prev) => {
          const newProducts = prev.filter((c) => c._id !== productId);

          // Check if we need to load more products
          if (
            newProducts.length <= PRELOAD_THRESHOLD &&
            hasMoreProducts &&
            !loadingMore
          ) {
            loadNextBatch();
          }

          return newProducts;
        });
      }, 300); // Increased timeout to match the longer animation
    },
    [
      userData.isLoggedIn,
      userData._id,
      displayedProducts,
      triggerTrendingUpdate,
      hasMoreProducts,
      loadingMore,
      loadNextBatch,
      PRELOAD_THRESHOLD,
    ]
  );

  // Handle retrieving last swiped product
  const handleRetrieveLastSwiped = useCallback(() => {
    if (swipedProducts.length === 0) return;
    
    const lastSwipedProduct = swipedProducts[0];
    
    // Remove from swiped history
    setSwipedProducts(prev => prev.slice(1));
    
    // Add back to the beginning of displayed products
    setDisplayedProducts(prev => [lastSwipedProduct, ...prev]);
  }, [swipedProducts]);

  // const handleBack = () => navigate('/');
  // const handleViewBag = () => navigate('/bag');

  // Handle curated list toggle
  const handleCuratedListToggle = useCallback(
    async (productId: string) => {

      if (!userData.isLoggedIn) {
        setShowLoginPopup(true);
        return;
      }

      try {
        const isCurrentlyInList = isInCuratedList(productId);

        if (isCurrentlyInList) {
          // Remove from curated list
          await removeFromCuratedList(productId);
          showSuccessToast("Removed from wishlist");
        } else {
          // Add to curated list
          const product = displayedProducts.find((p) => p._id === productId);
          if (product) {
            const curatedProduct = {
              _id: product._id,
              name: product.name,
              price: parseFloat(product.price.$numberDecimal),
              images: product.images,
              brand: { name: product.brand?.name || "Unknown Brand" },
              category: product.category || [],
              tags: product.tags || [],
            };
            await addToCuratedList(curatedProduct);
            showSuccessToast("Added to wishlist");
          }
        }
      } catch (error) {
        console.error("❌ Error in curated list toggle:", error);
        // You could show a toast notification here
      }
    },
    [
      userData.isLoggedIn,
      isInCuratedList,
      removeFromCuratedList,
      addToCuratedList,
      displayedProducts,
    ]
  );

  // Memoized share function
  const handleShare = useCallback((product: Product) => {
    // Create the product URL
    const productUrl = `${window.location.origin}/product/${product._id}`;

    // Create the share message with better formatting and instructions
    const shareMessage = `🛍 ${product.name}\n\n💰 Price: ₹${
      product.price?.$numberDecimal
        ? parseFloat(product.price.$numberDecimal).toLocaleString("en-IN")
        : "N/A"
    }

🔗 Product Link:
${productUrl}

📱 To view the product:
1. Copy the link above
2. Paste it in your browser
3. Enjoy shopping! 🎉`;

    // Create WhatsApp share URL
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      shareMessage
    )}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank");
  }, []);

  // Optimized keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (visibleProducts.length === 0) return;

      const topCard = visibleProducts[0];
      if (e.key === "ArrowLeft") {
        handleSwipe(topCard._id, "left");
      } else if (e.key === "ArrowRight") {
        handleSwipe(topCard._id, "right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visibleProducts, handleSwipe]);

  // const swipedInBatch = useMemo(() => currentBatchSize.current - displayedProducts.length, [displayedProducts.length]);


    const [returnPolicyOpen, setReturnPolicyOpen] = useState(false);
  const [shippingPolicyOpen, setShippingPolicyOpen] = useState(false);
  
  if (loading) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <motion.div 
            className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-white text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading amazing products...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  if (!loading && displayedProducts.length === 0 && !hasMoreProducts) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <motion.p 
            className="text-white text-xl mb-4"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎉 You've discovered everything!
          </motion.p>
          <p className="text-xs opacity-80 mt-1">
            {seenProductIds.size} products explored
          </p>
          <motion.button
            onClick={() => window.location.reload()}
            className="mt-4 bg-white text-purple-900 px-6 py-2 rounded-lg font-semibold"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            Start Over
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-gray-900 text-white flex flex-col overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
        <motion.div 
          className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={() => setShowFilters(true)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-full font-semibold transition-all duration-200 ${
                Object.values(activeFilters).some(filter => 
                  Array.isArray(filter) ? filter.length > 0 : filter !== 'all'
                )
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter size={16} />
              <span>Filters</span>
              <ChevronDown size={14} />
              {Object.values(activeFilters).some(filter => 
                Array.isArray(filter) ? filter.length > 0 : filter !== 'all'
              ) && (
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                  {activeFilters.colors.length + 
                   activeFilters.brands.length + 
                   activeFilters.categories.length + 
                   activeFilters.sizes.length + 
                   (activeFilters.gender !== 'all' ? 1 : 0)}
                </span>
              )}
            </motion.button>
            
            {/* Sub-filter buttons */}
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => {
                  setFocusSection('brands');
                  setShowFilters(true);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                  activeFilters.brands.length > 0 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center space-x-1">
                  <span>Brand</span>
                  <ChevronDown size={12} />
                </span>
                {activeFilters.brands.length > 0 && (activeFilters.brands.length)}
              </motion.button>
              <motion.button
                onClick={() => {
                  setFocusSection('categories');
                  setShowFilters(true);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                  activeFilters.categories.length > 0 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center space-x-1">
                  <span>Product</span>
                  <ChevronDown size={12} />
                </span>
                {activeFilters.categories.length > 0 && (activeFilters.categories.length)}
              </motion.button>
              <motion.button
                onClick={() => {
                  setFocusSection('colors');
                  setShowFilters(true);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                  activeFilters.colors.length > 0 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center space-x-1">
                  <span>Colors</span>
                  <ChevronDown size={12} />
                </span>
                {activeFilters.colors.length > 0 && (activeFilters.colors.length)}
              </motion.button>
              <motion.button
                onClick={() => {
                  setFocusSection('sizes');
                  setShowFilters(true);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                  activeFilters.sizes.length > 0 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center space-x-1">
                  <span>Size</span>
                  <ChevronDown size={12} />
                </span>
                {activeFilters.sizes.length > 0 && (activeFilters.sizes.length)}
              </motion.button>
            </div>
            
            {/* Active Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {activeFilters.gender !== 'all' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/30"
                >
                  {activeFilters.gender}
                </motion.span>
              )}
              {activeFilters.colors.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-purple-600/20 text-purple-400 text-xs px-2 py-1 rounded-full border border-purple-500/30"
                >
                  {activeFilters.colors.length} color{activeFilters.colors.length > 1 ? 's' : ''}
                </motion.span>
              )}
              {activeFilters.brands.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-green-600/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30"
                >
                  {activeFilters.brands.length} brand{activeFilters.brands.length > 1 ? 's' : ''}
                </motion.span>
              )}
              {activeFilters.categories.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-yellow-600/20 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/30"
                >
                  {activeFilters.categories.length} categor{activeFilters.categories.length > 1 ? 'ies' : 'y'}
                </motion.span>
              )}
              {activeFilters.sizes.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-pink-600/20 text-pink-400 text-xs px-2 py-1 rounded-full border border-pink-500/30"
                >
                  {activeFilters.sizes.length} size{activeFilters.sizes.length > 1 ? 's' : ''}
                </motion.span>
              )}
            </div>
          </div>
          
          {/* Help button */}
          <motion.button
            onClick={() => setShowTutorial(true)}
            className="p-2.5 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            title="Show swipe tutorial"
          >
            <HelpCircle size={20} />
          </motion.button>
        </motion.div>
      {/* Card Deck */}

      {/* Optimized Card Deck with Virtualization */}
      <div className="py-4 flex items-center justify-center w-full overflow-hidden px-4 select-none relative">
        {/* Back Button - Upper Left of Card Deck */}
        {swipedProducts.length > 0 && (
          <motion.button
            onClick={handleRetrieveLastSwiped}
            className="absolute top-6 left-6 z-20 p-3 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-black/80 transition-all duration-200 shadow-lg"
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            title="Retrieve last swiped product"
          >
            <ArrowLeft size={20} />
          </motion.button>
        )}
        
        <div className="w-full max-w-sm h-[600px] relative">
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, index) => (
              <SwipeableCard
                key={product._id}
                product={product}
                onSwipe={handleSwipe}
                index={index}
                total={visibleProducts.length}
                addToCart={addToCart}
                isInCuratedList={isInCuratedList}
                onCuratedListToggle={handleCuratedListToggle}
                onShare={handleShare}
                userData={userData}
                onShowLoginPopup={() => setShowLoginPopup(true)}
              />
            ))}
          </AnimatePresence>

          {/* Loading indicator for next batch */}
          {loadingMore && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="text-center text-white bg-black/50 backdrop-blur-md p-4 rounded-lg"
                animate={{ scale: [0.9, 1, 0.9] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div 
                  className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p>Loading more...</p>
              </motion.div>
            </motion.div>
          )}
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

      {/* Master Filters Component */}
      <MasterFilters
        isOpen={showFilters}
        onClose={() => {
          setShowFilters(false);
          setFocusSection(undefined);
        }}
        onFiltersChange={handleFiltersChange}
        initialFilters={activeFilters}
        focusSection={focusSection}
      />
        
      {/* Swipe Tutorial Overlay */}
      <SwipeTutorialOverlay
        isVisible={showTutorial}
        onComplete={handleTutorialComplete}
      />

      {/* Combined Policy Section */}
        <div className="px-4 py-8">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            {/* Policy Toggle Header */}
            <div className="grid grid-cols-2">
              {/* Return Policy Tab */}
              <motion.button
                onClick={() => {
                  setReturnPolicyOpen(true);
                  setShippingPolicyOpen(false);
                }}
                className={`p-6 flex items-center justify-center border-r border-gray-700 transition-all duration-300 ${
                  returnPolicyOpen
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  backgroundColor: returnPolicyOpen ? 'rgba(34, 197, 94, 0.2)' : 'rgba(75, 85, 99, 0.3)'
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-3">
                  <motion.span 
                    className="w-3 h-3 bg-green-500 rounded-full"
                    animate={{
                      scale: returnPolicyOpen ? 1.2 : 1,
                      opacity: returnPolicyOpen ? 1 : 0.7
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <h3 className="text-lg font-bold">Return Policy</h3>
                </div>
              </motion.button>
              
              {/* Shipping Policy Tab */}
              <motion.button
                onClick={() => {
                  setShippingPolicyOpen(true);
                  setReturnPolicyOpen(false);
                }}
                className={`p-6 flex items-center justify-center transition-all duration-300 ${
                  shippingPolicyOpen
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  backgroundColor: shippingPolicyOpen ? 'rgba(59, 130, 246, 0.2)' : 'rgba(75, 85, 99, 0.3)'
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-3">
                  <motion.span 
                    className="w-3 h-3 bg-blue-500 rounded-full"
                    animate={{
                      scale: shippingPolicyOpen ? 1.2 : 1,
                      opacity: shippingPolicyOpen ? 1 : 0.7
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <h3 className="text-lg font-bold">Shipping Policy</h3>
                </div>
              </motion.button>
            </div>

            {/* Policy Content */}
            <AnimatePresence mode="wait">
              {returnPolicyOpen && (
                <motion.div
                  key="return-policy"
                  className="px-6 py-6 space-y-4 text-gray-300 border-t border-gray-700 bg-green-600/5"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="space-y-3"
                  >
                    <p className="text-sm leading-relaxed">
                      <strong className="text-green-400">30-Day Return Window:</strong>{" "}
                      Return any item within 30 days of delivery for a full refund.
                    </p>
                    <p className="text-sm leading-relaxed">
                      <strong className="text-green-400">Condition:</strong> Items must
                      be unworn, unwashed, and in original packaging with tags
                      attached.
                    </p>
                    <p className="text-sm leading-relaxed">
                      <strong className="text-green-400">Process:</strong> Contact our
                      support team to initiate your return. We'll provide a prepaid
                      return label.
                    </p>
                    <p className="text-sm leading-relaxed">
                      <strong className="text-green-400">Refund:</strong> Full refund
                      will be processed within 5-7 business days after we receive
                      your return.
                    </p>
                  </motion.div>
                </motion.div>
              )}
              
              {shippingPolicyOpen && (
                <motion.div
                  key="shipping-policy"
                  className="px-6 py-6 space-y-4 text-gray-300 border-t border-gray-700 bg-blue-600/5"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="space-y-3"
                  >
                    <p className="text-sm leading-relaxed">
                      <strong className="text-blue-400">Free Shipping:</strong> Enjoy
                      free shipping on all orders above ₹999 across India.
                    </p>
                    <p className="text-sm leading-relaxed">
                      <strong className="text-blue-400">Delivery Time:</strong>{" "}
                      Standard delivery takes 3-7 business days. Express delivery
                      available in select cities.
                    </p>
                    <p className="text-sm leading-relaxed">
                      <strong className="text-blue-400">Tracking:</strong> Get
                      real-time tracking updates via SMS and email once your order
                      ships.
                    </p>
                    <p className="text-sm leading-relaxed">
                      <strong className="text-blue-400">International:</strong>{" "}
                      Currently shipping within India only. International shipping
                      coming soon!
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
    </motion.div>

    
  );
}

const SwipeProductsPage: React.FC = () => {
  return <Deck />;
};

export default SwipeProductsPage;

