import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import { motion, PanInfo } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import { useUser } from "../contexts/UserContext";
import LoginPopup from "../components/LoginPopup";

const FOOTER_H = 104; // px (match your bottom tab height + padding)

const BagPage = () => {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    error,
    updateQuantity,
    removeFromCart,
    fetchCart,
    getCurrentBrand,
    getCartTotal,
  } = useCart();
  const { userData } = useUser();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Helper function to get effective images for a product (handles variants)
  const getEffectiveImages = (product: any): string[] => {
    // Use variant images if available
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants[0].images || [];
    }
    // Fallback to main product images for backward compatibility
    return product.images || [];
  };

  const clearAllItems = async () => {
    for (const item of cart.items) {
      await removeFromCart(item.product._id, item.size);
    }
    setShowClearConfirm(false);
  };

  // Authentication check
  useEffect(() => {
    if (!userData?.isLoggedIn) {
      setShowLoginPopup(true);
      setIsCheckingAuth(false);
      return;
    }
    setIsCheckingAuth(false);
  }, [userData?.isLoggedIn]);

  // ✅ make sure we fetch only once per mount
  const didFetchRef = useRef(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current || inFlightRef.current) return;
    didFetchRef.current = true;
    inFlightRef.current = true;

    (async () => {
      try {
        await fetchCart();
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [fetchCart]);

  const getBrandName = (brand: any) =>
    typeof brand === "string" ? brand : brand?.name ?? "Unknown Brand";

  const handleQuantityChange = async (
    productId: string,
    size: string,
    change: number
  ) => {
    const it = cart.items.find(
      (i) => i.product._id === productId && i.size === size
    );
    if (!it) return;
    await updateQuantity(productId, size, Math.max(0, it.quantity + change));
  };

  const handleRemoveItem = async (productId: string, size: string) => {
    await removeFromCart(productId, size);
  };

  const handleCheckout = () => {
    navigate("/checkout", {
      state: {
        cartItems: cart.items,
        total: cart.totalAmount,
        directBuy: false,
      },
    });
  };

  const isEmpty = cart.items.length === 0;
  const currentBrand = getCurrentBrand();

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="relative max-w-md mx-auto min-h-screen bg-gray-900 text-white overflow-x-hidden">
        <div className="px-4 py-6">
          <h1 className="text-xl font-bold mb-4">Checking authentication...</h1>
          <p className="text-gray-400">
            Please wait while we verify your login status.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800 max-w-[413px] mx-auto px-4 flex items-center h-16">
        <button onClick={() => navigate(-1)} className="p-1 mr-3">
          <ArrowLeft
            size={24}
            className="text-white hover:text-blue-400 transition-colors"
          />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Your Bag</h1>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-sm text-gray-300 font-medium hover:text-white"
          disabled={isEmpty}
        >
          Clear All
        </button>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-20" style={{ paddingBottom: FOOTER_H + 16 }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
            <p className="text-lg">Loading your bag...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <p className="text-lg mb-2">Failed to load bag</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => {
                if (inFlightRef.current) return;
                inFlightRef.current = true;
                fetchCart().finally(() => (inFlightRef.current = false));
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-center">
              Your bag's feeling left out.
            </h2>
            <p className="text-gray-400 text-center mb-8 max-w-sm">
              Fill it with pieces that match your vibe.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full"
            >
              Start shopping
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.items.map((item, index) => {
              // Use variant price if available, otherwise use priceAtAdd
              let originalPrice;
              if (item.variant && item.variant.price) {
                // Use variant price
                if (
                  typeof item.variant.price === "object" &&
                  item.variant.price.$numberDecimal
                ) {
                  originalPrice = parseFloat(item.variant.price.$numberDecimal);
                } else if (typeof item.variant.price === "number") {
                  originalPrice = item.variant.price;
                } else {
                  originalPrice = parseFloat(String(item.variant.price));
                }
              } else {
                // Use stored price
                originalPrice = parseFloat(item.priceAtAdd.$numberDecimal);
              }

              const offerPercentage = item.product.offerPercentage || 0;
              const discountedPrice =
                offerPercentage > 0
                  ? originalPrice - (originalPrice * offerPercentage) / 100
                  : originalPrice;

              return (
                <div
                  key={`${item.product._id}-${item.size}-${index}`}
                  className="relative overflow-hidden rounded-2xl"
                >
                  {/* Hidden Delete Button */}
                  <div className="absolute right-0 top-0 h-full w-40 bg-red-500 flex items-center justify-end rounded-r-2xl">
                    <Trash2 size={20} className="text-white mr-4" />
                  </div>

                  {/* Product Card */}
                  <motion.div
                    className="bg-gray-800 rounded-2xl p-4 shadow-sm relative z-10"
                    drag="x"
                    dragConstraints={{ left: -80, right: 0 }}
                    onDragEnd={(event, info: PanInfo) => {
                      if (info.offset.x < -60) {
                        handleRemoveItem(item.product._id, item.size);
                      }
                    }}
                    dragElastic={0.1}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <button
                        onClick={() => navigate(`/product/${item.product._id}`)}
                        className="flex-shrink-0"
                      >
                        <img
                          src={
                            getEffectiveImages(item.product)[0] ||
                            "https://via.placeholder.com/80x80?text=No+Image"
                          }
                          alt={item.product.name}
                          className="w-25 h-40 rounded-xl object-cover hover:opacity-80 transition-opacity"
                        />
                      </button>

                      {/* Product Details */}
                      <button
                        onClick={() => navigate(`/product/${item.product._id}`)}
                        className="flex-1 text-left hover:opacity-80 transition-opacity"
                      >
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-gray-400">
                          {getBrandName(item.product.brand)}
                        </p>
                        <p className="text-sm text-gray-400">
                          Size: {item.size}
                          {item.color && ` • Color: ${item.color}`}
                        </p>
                        {(() => {
                          if (offerPercentage > 0) {
                            const discount =
                              (originalPrice * offerPercentage) / 100;
                            const discountedPrice = originalPrice - discount;
                            const totalPrice = discountedPrice * item.quantity;

                            return (
                              <div className="mt-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-400 line-through">
                                    ₹{originalPrice.toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-lg font-bold text-green-400">
                                    ₹{discountedPrice.toLocaleString("en-IN")}
                                  </span>
                                </div>
                                {item.quantity > 1 && (
                                  <p className="text-sm text-gray-300 mt-1">
                                    Total: ₹{totalPrice.toLocaleString("en-IN")}
                                  </p>
                                )}
                              </div>
                            );
                          } else {
                            const totalPrice = originalPrice * item.quantity;
                            return (
                              <div className="mt-1">
                                <p className="text-lg font-bold">
                                  ₹{originalPrice.toLocaleString("en-IN")}
                                </p>
                                {item.quantity > 1 && (
                                  <p className="text-sm text-gray-300">
                                    Total: ₹{totalPrice.toLocaleString("en-IN")}
                                  </p>
                                )}
                              </div>
                            );
                          }
                        })()}
                      </button>

                      {/* Controls */}
                      <div className="flex flex-col items-end space-y-2">
                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.product._id, item.size);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors"
                          title="Remove from cart"
                        >
                          <Trash2 size={16} />
                        </button> */}
                        <div className="flex flex-col justify-items-center vertical space-y-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(
                                item.product._id,
                                item.size,
                                1
                              );
                            }}
                            className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600"
                          >
                            <Plus size={14} />
                          </button>
                          <span className="w-11 h-11 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600">
                            {item.quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(
                                item.product._id,
                                item.size,
                                -1
                              );
                            }}
                            className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600"
                          >
                            <Minus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Fixed Footer - Checkout Button */}
      {!isEmpty && !loading && (
        <footer
          className="fixed bottom-[4rem] left-0 right-0 z-50 bg-gray-800 border-t border-gray-700 px-4 py-1 max-w-[413px] mx-auto"
          style={{ height: FOOTER_H }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold">
              Total: ₹{getCartTotal().toLocaleString("en-IN")}
            </span>
            <span className="text-sm text-gray-300">
              {cart.totalItems} item{cart.totalItems > 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition-colors"
          >
            Proceed to Checkout
          </button>
        </footer>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 mx-4 max-w-sm w-full border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">
              Clear All Items?
            </h2>
            <p className="text-gray-300 mb-6">
              This will remove all items from your cart. This action cannot be
              undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-semibold hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={clearAllItems}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600"
              >
                Clear All
              </button>
            </div>
          </div>
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
    </div>
  );
};

export default BagPage;
