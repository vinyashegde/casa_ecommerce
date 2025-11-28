import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useUser } from "./UserContext";
import { showSuccessToast, showErrorToast } from "../utils/toast";

// Product variant interface
export interface ProductVariant {
  color: string;
  sizes: { size: string; stock: number }[];
  price: number | { $numberDecimal: string };
  images: string[];
  sku?: string;
}

// Cart item interface
export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: string[];
    price: {
      $numberDecimal: string;
    };
    currency: string;
    brand:
      | string
      | {
          _id: string;
          name: string;
          logo_url?: string;
        };
    description?: string;
    tags: string[];
    offerPercentage?: number;
    product_variants?: ProductVariant[]; // Add variant support
  };
  quantity: number;
  size: string;
  color?: string; // Add color for variant products
  variant?: ProductVariant; // Add selected variant data
  addedAt: string;
  priceAtAdd: {
    $numberDecimal: string;
  };
}

// Cart data interface
export interface CartData {
  _id?: string;
  email: string; // Changed from phone to email
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  updatedAt?: string;
}

// Brand validation error interface
interface BrandValidationError {
  error: string;
  message: string;
  currentBrand: {
    id: string;
    name: string;
  };
  newBrand: {
    id: string;
    name: string;
  };
}

// Pending product interface
interface PendingProduct {
  productId: string;
  quantity: number;
  size: string;
  color?: string;
  variant?: ProductVariant;
}

// Cart context interface
interface CartContextType {
  cart: CartData;
  loading: boolean;
  error: string | null;
  brandValidationError: BrandValidationError | null;

  // Cart operations
  fetchCart: () => Promise<void>;
  addToCart: (
    productId: string,
    quantity?: number,
    size?: string,
    color?: string,
    variant?: ProductVariant
  ) => Promise<void>;
  updateQuantity: (
    productId: string,
    size: string,
    quantity: number
  ) => Promise<void>;
  removeFromCart: (productId: string, size?: string) => Promise<void>;
  clearCart: (fromSwitch?: boolean) => Promise<void>;
  switchToNewBrand: () => Promise<void>;

  // Helper functions
  getItemCount: () => number;
  getCartTotal: () => number;
  isInCart: (productId: string, size?: string) => boolean;
  getCurrentBrand: () => { id: string; name: string } | null;
  clearBrandValidationError: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const defaultCart: CartData = {
  email: "", // Changed from phone to email
  items: [],
  totalItems: 0,
  totalAmount: 0,
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { userData } = useUser();
  const [cart, setCart] = useState<CartData>(defaultCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandValidationError, setBrandValidationError] =
    useState<BrandValidationError | null>(null);
  const [pendingProduct, setPendingProduct] = useState<PendingProduct | null>(
    null
  );

  // API base URL
  const API_BASE = import.meta.env.VITE_API_URL + "/cart";

  // Get email (with fallback to phone)
  const getEmail = () => userData.email || userData.phoneNumber;

  // Fetch cart from backend
  const fetchCart = async () => {
    if (userData.isLoggedIn === false) {
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const email = getEmail();

      if (!email || email === undefined) {
        return;
      }

      const response = await fetch(
        `${API_BASE}?email=${encodeURIComponent(email)}`
      );
      const result = await response.json();

      if (result.success) {
        setCart(result.data.cart);
      } else {
        setError(result.error || "Failed to fetch cart");
        console.error("❌ Failed to fetch cart:", result.error);
      }
    } catch (error) {
      console.error("❌ Error fetching cart:", error);
      setError("Failed to fetch cart");
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (
    productId: string,
    quantity: number = 1,
    size: string = "M",
    color?: string,
    variant?: ProductVariant
  ) => {
    try {
      setLoading(true);
      setError(null);
      setBrandValidationError(null);

      const email = getEmail();

      const response = await fetch(`${API_BASE}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          productId,
          quantity,
          size,
          color,
          variant,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCart(result.data.cart);
        showSuccessToast("Product added to cart successfully!");
      } else {
        // Check if it's a brand validation error
        if (result.error === "Brand mismatch") {
          setPendingProduct({ productId, quantity, size, color, variant });
          setBrandValidationError({
            error: result.error,
            message: result.message,
            currentBrand: result.currentBrand,
            newBrand: result.newBrand,
          });
          console.error("❌ Brand mismatch error:", result.message);
          throw new Error(result.message);
        }
        // Check if it's a stock validation error
        else if (result.error === "Insufficient stock") {
          const stockMessage =
            result.message ||
            `Only ${result.availableStock || 0} items available`;
          setError(stockMessage);
          showErrorToast(stockMessage);
          console.error("❌ Insufficient stock:", result.message);
          throw new Error(stockMessage);
        } else {
          setError(result.error || "Failed to add product to cart");
          console.error("❌ Failed to add product to cart:", result.error);
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error("❌ Error adding product to cart:", error);
      // Only set generic error if it's not a brand validation error
      if (error instanceof Error && !error.message.includes("Brand mismatch")) {
        setError("Failed to add product to cart");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (
    productId: string,
    size: string,
    quantity: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      const email = getEmail();

      const response = await fetch(`${API_BASE}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          productId,
          size,
          quantity,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCart(result.data.cart);
      } else {
        // Handle stock validation errors with user-friendly messages
        if (result.error === "Insufficient stock") {
          const stockMessage =
            result.availableStock !== undefined
              ? `Only ${result.availableStock} items in stock`
              : "Insufficient stock";
          showErrorToast(stockMessage);
          setError(stockMessage);
        } else {
          setError(result.error || "Failed to update cart item");
        }
        console.error("❌ Failed to update cart item:", result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Error updating cart item:", error);
      setError("Failed to update cart item");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: string, size?: string) => {
    try {
      setLoading(true);
      setError(null);

      const email = getEmail();

      const response = await fetch(`${API_BASE}/remove`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          productId,
          size,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCart(result.data.cart);
      } else {
        setError(result.error || "Failed to remove product from cart");
        console.error("❌ Failed to remove product from cart:", result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Error removing product from cart:", error);
      setError("Failed to remove product from cart");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async (fromSwitch: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const email = getEmail();

      const response = await fetch(`${API_BASE}/clear`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCart(result.data.cart);
        if (!fromSwitch) {
          showSuccessToast("Bag cleared successfully!");
        }
      } else {
        setError(result.error || "Failed to clear cart");
        console.error("❌ Failed to clear cart:", result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Error clearing cart:", error);
      setError("Failed to clear cart");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Switch to new brand
  const switchToNewBrand = async () => {
    if (!pendingProduct) return;

    try {
      await clearCart(true); // Clear cart without showing toast
      await addToCart(
        pendingProduct.productId,
        pendingProduct.quantity,
        pendingProduct.size,
        pendingProduct.color,
        pendingProduct.variant
      );
      setPendingProduct(null);
      clearBrandValidationError();
    } catch (error) {
      console.error("❌ Error switching brand:", error);
      showErrorToast("Failed to switch brand. Please try again.");
    }
  };

  // Helper functions
  const getItemCount = () => cart.totalItems;

  const getCartTotal = () => {
    // Calculate total with offer discounts
    const totalWithOffers = cart.items.reduce((total, item) => {
      const originalPrice = parseFloat(item.priceAtAdd.$numberDecimal);
      const offerPercentage = item.product.offerPercentage || 0;

      let price = originalPrice;
      if (offerPercentage > 0) {
        const discount = (originalPrice * offerPercentage) / 100;
        price = originalPrice - discount;
      }

      return total + price * item.quantity;
    }, 0);

    return totalWithOffers;
  };

  const isInCart = (productId: string, size?: string) => {
    if (size) {
      return cart.items.some(
        (item) => item.product._id === productId && item.size === size
      );
    }
    return cart.items.some((item) => item.product._id === productId);
  };

  const getCurrentBrand = (): { id: string; name: string } | null => {
    if (cart.items.length === 0) return null;
    const firstItem = cart.items[0];
    if (typeof firstItem.product.brand === "string") {
      return { id: firstItem.product.brand, name: "Unknown Brand" };
    }
    return {
      id: firstItem.product.brand._id,
      name: firstItem.product.brand.name,
    };
  };

  const clearBrandValidationError = () => {
    setBrandValidationError(null);
  };

  // Load cart when user changes
  useEffect(() => {
    if (getEmail()) {
      fetchCart();
    }
  }, [userData.email, userData.phoneNumber]); // Watch both email and phone

  const value: CartContextType = {
    cart,
    loading,
    error,
    brandValidationError,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    switchToNewBrand,
    getItemCount,
    getCartTotal,
    isInCart,
    getCurrentBrand,
    clearBrandValidationError,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
