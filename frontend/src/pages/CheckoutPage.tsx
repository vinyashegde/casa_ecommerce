import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  Component,
  ErrorInfo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Minus,
  Plus,
  AlertTriangle,
  Trash2,
  Clock,
  Zap,
  Gift,
} from "lucide-react";
import axios from "axios";
import { CartData, useCart } from "../contexts/CartContext";
import { useUser } from "../contexts/UserContext";
import AnimatedList from "../components/AnimatedList";
import LoginPopup from "../components/LoginPopup";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../components/alert-dialog";

/* ================= Error Boundary ================= */
interface ErrorBoundaryState {
  hasError: boolean;
}

class CouponErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Coupon section error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            Coupon feature temporarily unavailable. Please proceed with your
            order.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ================= Config ================= */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const WAREHOUSE_PINCODE = import.meta.env.VITE_WAREHOUSE_PINCODE || "400001"; // Default Mumbai pincode
// Shiprocket integration removed - orders now handled directly by Casa CRM

/* ================= Types ================= */
interface Product {
  id: string;
  name: string;
  brand: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image?: string;
  images?: string[];
  selectedSize: string;
  sizes?: string[]; // Available sizes for the product
  quantity: number;
  offerPercentage?: number;
  assigned_coupon?: {
    _id: string;
    title: string;
    coupon_code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    max_discount_amount?: number;
    is_active: boolean;
    is_currently_valid: boolean;
  };
}

const HEADER_H = 64; // px
const FOOTER_H = 80; // px (reduced for better spacing)

interface Address {
  _id: string;
  billing_customer_name: string;
  billing_phone: string;
  billing_email: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  isDefault?: boolean;
  createdAt?: string;
}

interface PaymentMethod {
  id: number;
  type: string;
  name: string;
  icon: string;
}

interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  time: string;
  price: number;
  icon: React.ReactNode;
  isQuick: boolean;
  disabled?: boolean;
}

/* ================= Helpers ================= */

/* ---------- Calculate delivery time based on pincode distance ---------- */
const calculateDeliveryTime = (
  pincode: string
): { time: string; description: string } => {
  // Extract first 2 digits of pincode for rough distance estimation
  const pincodePrefix = pincode.substring(0, 2);

  // Mumbai specific pincodes (40) - Same city
  if (pincodePrefix === "40") {
    return { time: "60-90 min", description: "Same city delivery (Mumbai)" };
  }

  // Pune specific pincodes (41) - Same state
  if (pincodePrefix === "41") {
    return { time: "2-4 hours", description: "Same state delivery (Pune)" };
  }

  // Other Maharashtra state pincodes (42, 43, 44, 50-59) - Same state
  if (
    [
      "42",
      "43",
      "44",
      "50",
      "51",
      "52",
      "53",
      "54",
      "55",
      "56",
      "57",
      "58",
      "59",
    ].includes(pincodePrefix)
  ) {
    return {
      time: "2-4 hours",
      description: "Same state delivery (Maharashtra)",
    };
  }

  // Neighboring states (Gujarat: 36, 37, 38, 39, 45, 46, 47, 48, 49)
  if (
    ["36", "37", "38", "39", "45", "46", "47", "48", "49"].includes(
      pincodePrefix
    )
  ) {
    return { time: "4-8 hours", description: "Neighboring state delivery" };
  }

  // South India (Karnataka: 56, 57, 58, 59, Tamil Nadu: 60, 61, 62, 63, 64, Kerala: 67, 68, 69)
  if (
    ["60", "61", "62", "63", "64", "67", "68", "69"].includes(pincodePrefix)
  ) {
    return { time: "8-12 hours", description: "South India delivery" };
  }

  // North India (Delhi: 11, 12, 13, 14, 15, 16, 17, UP: 20, 21, 22, 23, 24, 25, 26, 27, 28, 29)
  if (
    [
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
    ].includes(pincodePrefix)
  ) {
    return { time: "12-18 hours", description: "North India delivery" };
  }

  // East India (West Bengal: 70, 71, 72, 73, 74, 75, 76, 77, Odisha: 75, 76, 77, Assam: 78, 79)
  if (
    ["70", "71", "72", "73", "74", "75", "76", "77", "78", "79"].includes(
      pincodePrefix
    )
  ) {
    return { time: "18-24 hours", description: "East India delivery" };
  }

  // Rest of India (Remote areas)
  return { time: "24-30 hours", description: "Express delivery" };
};

const normalizeShipments = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.shipment)) return data.shipment;
  if (Array.isArray(data?.shipments)) return data.shipments;
  if (Array.isArray(data?.user?.shipment)) return data.user.shipment;
  if (Array.isArray(data?.user?.shipments)) return data.user.shipments;
  if (Array.isArray(data?.shipmentAddresses)) return data.shipmentAddresses;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

// const saveNumericForCasa = (casaId: string, numericId: number) => {
//   try {
//     const m = JSON.parse(localStorage.getItem(SR_NUMERIC_BY_CASA_KEY) || "{}");
//     m[casaId] = numericId;
//     localStorage.setItem(SR_NUMERIC_BY_CASA_KEY, JSON.stringify(m));
//   } catch (error) {
//     console.error("Error saving numeric for casa:", error);
//   }
// };
// const saveChannelForCasa = (casaId: string, channelOrderId: string) => {
//   try {
//     const m = JSON.parse(localStorage.getItem(SR_CHANNEL_BY_CASA_KEY) || "{}");
//     m[casaId] = channelOrderId;
//     localStorage.setItem(SR_CHANNEL_BY_CASA_KEY, JSON.stringify(m));
//   } catch (error) {
//     console.error("Error saving channel for casa:", error);
//   }
// };

/* join all address parts safely (also used when saving order) */
const formatAddressOneLine = (a: Address) =>
  [
    a.billing_address,
    a.billing_address_2,
    a.billing_city,
    a.billing_state,
    a.billing_pincode,
    a.billing_country || "India",
  ]
    .filter(Boolean)
    .join(", ");

// Shiprocket integration removed

/* ---------- read your primary storage key `casa_user_data` ---------- */
type CasaStored = {
  _id?: string;
  email?: string;
  phoneNumber?: string;
  isLoggedIn?: boolean;
};
const readCasaUser = (): CasaStored | null => {
  try {
    const raw = localStorage.getItem("casa_user_data");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") return obj as CasaStored;
  } catch (error) {
    console.error("Error reading casa user:", error);
  }
  return null;
};
const getFlatEmail = () =>
  (localStorage.getItem("email") || readCasaUser()?.email || "") as string;
const getFlatPhone = () =>
  (localStorage.getItem("phone") ||
    readCasaUser()?.phoneNumber ||
    "") as string;

/* ================= Component ================= */
const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, updateQuantity, addToCart, removeFromCart } = useCart();
  const { userData } = useUser();
  const { product, bagItems, directBuy } = (location.state || {}) as any;

  /* ---------- Authentication Check ---------- */
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!userData?.isLoggedIn) {
      setShowLoginPopup(true);
      setIsCheckingAuth(false);
      return;
    }
    setIsCheckingAuth(false);
  }, [userData?.isLoggedIn]);

  /* ---------- Direct buy state ---------- */
  const [selectedSize, setSelectedSize] = useState<string>(
    product?.selectedSize || "M"
  ); // Use selected size from product page

  // Helper function to get effective images for a product (handles variants)
  const getEffectiveImages = (product: any): string[] => {
    // Use variant images if available
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants[0].images || [];
    }
    // Fallback to main product images for backward compatibility
    return product.images || [];
  };

  // Helper function to get effective price for a product (handles variants)
  const getEffectivePrice = (product: any): number => {
    // Use variant price if available
    if (product.product_variants && product.product_variants.length > 0) {
      const variantPrice = product.product_variants[0].price;
      if (typeof variantPrice === "number") {
        return variantPrice;
      } else if (
        typeof variantPrice === "object" &&
        variantPrice.$numberDecimal
      ) {
        return parseFloat(variantPrice.$numberDecimal);
      }
    }
    // Fallback to main product price for backward compatibility
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

  // Update selectedSize when product changes
  useEffect(() => {
    if (product?.selectedSize) {
      setSelectedSize(product.selectedSize);
    }
  }, [product?.selectedSize, product, directBuy]);

  /* ---------- Cart → Products ---------- */
  // Use the same simple approach as BagPage - directly use cart.items
  const cartItems = cart?.items || [];

  // Track if product should be shown (for direct buy)
  const [showProduct, setShowProduct] = useState(true);
  // Force re-render when cart changes
  const [forceUpdate, setForceUpdate] = useState(0);

  const orderItems: Product[] = useMemo(() => {
    if (directBuy && product) {
      // For direct buy, check if the product is in cart and get its quantity
      const cartItem = cartItems.find(
        (item) => item.product._id === product.id && item.size === selectedSize
      );

      // Show product if it should be shown and either exists in cart with quantity > 0 or is not in cart yet
      if (showProduct && (cartItem ? cartItem.quantity > 0 : true)) {
        const quantity = cartItem ? cartItem.quantity : 1;
        const productImage = product.image || getEffectiveImages(product)[0];

        const orderItem = {
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          image: productImage || product.images[0], // Handle both single image and images array
          images: product.images,
          selectedSize: selectedSize,
          sizes: product.sizes || [], // Add available sizes for direct buy products
          quantity: quantity,
          offerPercentage: product.offerPercentage,
          assigned_coupon: product.assigned_coupon, // Include assigned coupon
          color: product.color, // Add color for variant products
        };

        return [orderItem];
      } else {
        // Product should not be shown
        return [];
      }
    } else if (bagItems) {
      return bagItems;
    } else {
      // For cart items, use the same structure as BagPage
      const mappedItems = cartItems.map((item) => ({
        id: item.product._id,
        name: item.product.name,
        brand:
          typeof item.product.brand === "string"
            ? item.product.brand
            : item.product.brand.name,
        price: `₹${getEffectivePrice(item.product).toFixed(2)}`,
        image: getEffectiveImages(item.product)[0] || undefined,
        images: getEffectiveImages(item.product),
        selectedSize: item.size,
        sizes: (item.product as any).sizes || [], // Add available sizes for each product
        quantity: item.quantity,
        offerPercentage: item.product.offerPercentage,
        assigned_coupon: item.product.assigned_coupon, // Include assigned coupon
        color: item.color, // Add color for variant products
      }));

      return mappedItems;
    }
  }, [
    directBuy,
    product,
    bagItems,
    cartItems,
    selectedSize,
    showProduct,
    forceUpdate,
  ]);

  // Track if user has interacted with quantity controls
  const [hasInteracted, setHasInteracted] = useState(false);

  // Update selectedSize when product changes
  useEffect(() => {
    if (product?.selectedSize) {
      setSelectedSize(product.selectedSize);
    }
  }, [product?.selectedSize, product?.id]);

  // Listen for cart changes and force update
  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [cartItems.length, cart?.totalAmount, cartItems, cart]);

  // Handle when all items are removed from checkout
  useEffect(() => {
    if (orderItems.length === 0 && directBuy && product && hasInteracted) {
      // Only redirect if user has actually interacted with quantity controls
      const timer = setTimeout(() => {
        window.history.back();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [orderItems.length, directBuy, product, hasInteracted]);

  const orderTotal: number = useMemo(() => {
    // Always calculate total based on orderItems and their quantities (ignore passed total)
    if (orderItems.length > 0) {
      const calculatedTotal = orderItems.reduce((total, item) => {
        let price =
          typeof item.price === "string"
            ? parseInt(item.price.replace("₹", "").replace(",", ""))
            : item.price;

        // Apply offer discount if available
        if (item.offerPercentage && item.offerPercentage > 0) {
          const discount = (price * item.offerPercentage) / 100;
          price = price - discount;
        }

        const itemTotal = price * item.quantity;
        return total + itemTotal;
      }, 0);

      return calculatedTotal;
    }

    // Fallback to cart total
    return cart?.totalAmount || 0;
  }, [orderItems, cart?.totalAmount, forceUpdate]);

  /* ---------- Coupon validation and discount calculation ---------- */
  const validateCoupon = async (code: string) => {
    if (!code?.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError(null);

      const userId = userData?._id;

      // Prepare cart items for brand-specific validation
      const cartItemsForValidation = orderItems.map((item) => {
        // Get the actual cart item to access the full product data
        const cartItem = cartItems.find(
          (cartItem) => cartItem.product._id === item.id
        );

        return {
          product: {
            _id: item.id,
            brand: cartItem?.product?.brand || item.brand, // Use the full brand object from cart
          },
        };
      });

      // Use the new cart-specific validation endpoint
      const apiUrl = `${API_BASE}/offers/coupon/${encodeURIComponent(
        code.toUpperCase()
      )}/validate-cart`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          cartItems: cartItemsForValidation,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.success && data?.data?.offer) {
        const { offer } = data.data;

        // Validate offer properties
        if (!offer || typeof offer !== "object") {
          setCouponError("Invalid coupon data received");
          return;
        }

        // Check if coupon is valid for current order
        const minOrderValue = Number(offer.min_order_value) || 0;
        if (minOrderValue > orderTotal) {
          setCouponError(`Minimum order value of ₹${minOrderValue} required`);
          return;
        }

        // Calculate discount amount
        let calculatedDiscount = 0;
        const discountValue = Number(offer.discount_value) || 0;
        const maxDiscountAmount = Number(offer.max_discount_amount) || null;

        if (offer.discount_type === "percentage") {
          calculatedDiscount = (orderTotal * discountValue) / 100;
          if (maxDiscountAmount && calculatedDiscount > maxDiscountAmount) {
            calculatedDiscount = maxDiscountAmount;
          }
        } else {
          calculatedDiscount = discountValue;
        }

        // Ensure discount doesn't exceed order total
        calculatedDiscount = Math.min(calculatedDiscount, orderTotal);
        calculatedDiscount = Math.max(0, calculatedDiscount); // Ensure non-negative

        setAppliedCoupon(offer);
        setDiscountAmount(calculatedDiscount);
        setCouponError(null);
      } else {
        setCouponError(data?.message || "Invalid coupon code");
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      setCouponError("Failed to validate coupon code. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    try {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponCode("");
      setCouponError(null);
    } catch (error) {
      console.error("Error removing coupon:", error);
    }
  };

  // Fetch available coupons for products in cart (using assigned_coupon field)
  const fetchAvailableCoupons = async () => {
    if (!orderItems.length) return;

    try {
      setCouponsLoading(true);

      const allCoupons = [];

      // Extract assigned coupons directly from cart items
      for (const item of orderItems) {
        // Check if the item has an assigned_coupon field
        if (item.assigned_coupon && typeof item.assigned_coupon === "object") {
          const coupon = item.assigned_coupon;

          // Add product information to the coupon
          // Ensure all fields including virtual fields are properly copied
          const couponWithProductInfo = {
            _id: coupon._id,
            title: coupon.title,
            coupon_code: coupon.coupon_code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            max_discount_amount: coupon.max_discount_amount,
            min_order_value: coupon.min_order_value,
            is_active: coupon.is_active,
            is_currently_valid: coupon.is_currently_valid,
            assignedProductName: item.name,
            assignedProductId: item.id,
          };

          allCoupons.push(couponWithProductInfo);
        } else {
          console.error("❌ No assigned coupon found for item:", item.name);
        }
      }

      // Filter active coupons that are valid
      const validCoupons = allCoupons.filter((coupon) => {
        return coupon.is_active && coupon.is_currently_valid;
      });

      setAvailableCoupons(validCoupons);
    } catch (error) {
      console.error("Error fetching available coupons:", error);
    } finally {
      setCouponsLoading(false);
    }
  };

  // Load available coupons when cart changes
  useEffect(() => {
    if (orderItems.length > 0) {
      fetchAvailableCoupons();
    }
  }, [orderItems]);

  // Apply coupon from dropdown
  const applyCouponFromDropdown = (coupon: any) => {
    try {
      setCouponError(null);

      // Check minimum order value
      const minOrderValue = Number(coupon.min_order_value) || 0;
      if (minOrderValue > orderTotal) {
        setCouponError(`Minimum order value of ₹${minOrderValue} required`);
        return;
      }

      // Calculate discount amount
      let calculatedDiscount = 0;
      if (coupon.discount_type === "percentage") {
        calculatedDiscount = (orderTotal * coupon.discount_value) / 100;
        if (
          coupon.max_discount_amount &&
          calculatedDiscount > coupon.max_discount_amount
        ) {
          calculatedDiscount = coupon.max_discount_amount;
        }
      } else {
        calculatedDiscount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed order total
      calculatedDiscount = Math.min(calculatedDiscount, orderTotal);
      calculatedDiscount = Math.max(0, calculatedDiscount);

      setAppliedCoupon(coupon);
      setDiscountAmount(calculatedDiscount);
      setCouponCode(coupon.coupon_code);
      setCouponError(null);
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError("Failed to apply coupon. Please try again.");
    }
  };

  /* ---------- Address state ---------- */
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number>(-1);
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrError, setAddrError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  /* ---------- Payment state ---------- */
  const [selectedPayment, setSelectedPayment] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  /* ---------- Delivery speed state ---------- */
  const [selectedDeliverySpeed, setSelectedDeliverySpeed] =
    useState<string>("standard");
  // Shiprocket integration removed

  /* ---------- Coupon state ---------- */
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState<boolean>(false);

  // Calculate final total with discount
  const finalTotal: number = useMemo(() => {
    try {
      const subtotal = Number(orderTotal) || 0;
      const deliveryFee = selectedDeliverySpeed === "quick" ? 99 : 0;
      const discount = Number(discountAmount) || 0;
      const total = subtotal + deliveryFee - discount;
      return Math.max(0, total); // Ensure total is not negative
    } catch (error) {
      console.error("Error calculating final total:", error);
      return orderTotal || 0; // Fallback to order total
    }
  }, [orderTotal, selectedDeliverySpeed, discountAmount]);

  const paymentMethods: PaymentMethod[] = [
    { id: 1, type: "Razorpay", name: "Pay with Razorpay", icon: "💳" },
  ];

  /* ---------- Get dynamic delivery time based on selected address ---------- */
  /* ---------- Get dynamic delivery time based on selected address ---------- */
  const getCurrentDeliveryTime = (): { time: string; description: string } => {
    if (selectedAddress >= 0 && addresses[selectedAddress]) {
      const pincode = addresses[selectedAddress].billing_pincode;
      if (pincode) {
        return calculateDeliveryTime(pincode);
      }
    }
    // Default fallback
    return { time: "60-90 min", description: "Express delivery" };
  };

  /* ---------- Calculate distance between pincodes for quick delivery availability ---------- */
  const calculatePincodeDistance = (
    pincode1: string,
    pincode2: string
  ): number => {
    // Simple distance calculation based on pincode patterns
    // This is a simplified version - in production you might want to use a proper geocoding service

    const p1 = parseInt(pincode1.substring(0, 3));
    const p2 = parseInt(pincode2.substring(0, 3));

    // Basic distance calculation (this is approximate)
    const diff = Math.abs(p1 - p2);

    // Convert to approximate kilometers (very rough estimation)
    // This is just for demonstration - real implementation would use proper geocoding
    return Math.round(diff * 10); // Rough estimate: 10km per 100 pincode difference
  };

  /* ---------- Enhanced distance calculation (for future geocoding integration) ---------- */
  const calculateRealDistance = async (
    pincode1: string,
    pincode2: string
  ): Promise<number> => {
    // TODO: Replace with actual geocoding service (Google Maps, OpenStreetMap, etc.)
    // This is a placeholder for future implementation
    try {
      // Example API call structure:
      // const response = await fetch(`/api/geocoding/distance?from=${pincode1}&to=${pincode2}`);
      // const data = await response.json();
      // return data.distance;

      // For now, use the simple calculation
      return calculatePincodeDistance(pincode1, pincode2);
    } catch (error) {
      console.warn(
        "Geocoding service unavailable, using fallback calculation:",
        error
      );
      return calculatePincodeDistance(pincode1, pincode2);
    }
  };

  /* ---------- Check if Casa Express is available based on distance from warehouse ---------- */
  const isQuickDeliveryAvailable = (): boolean => {
    if (!addresses.length || selectedAddress < 0) return false;

    const currentAddress = addresses[selectedAddress];
    const userPincode = currentAddress.billing_pincode;

    if (!userPincode) return false;

    // Calculate distance from warehouse
    const distance = calculatePincodeDistance(WAREHOUSE_PINCODE, userPincode);

    // Quick delivery available within 50km radius (adjustable)
    const MAX_QUICK_DELIVERY_DISTANCE = 50;

    return distance <= MAX_QUICK_DELIVERY_DISTANCE;
  };

  /* ---------- Auto-switch to standard delivery if quick becomes unavailable ---------- */
  useEffect(() => {
    if (selectedDeliverySpeed === "quick" && !isQuickDeliveryAvailable()) {
      setSelectedDeliverySpeed("standard");
    }
  }, [selectedAddress, addresses, selectedDeliverySpeed]);

  /* ---------- Delivery options - Casa CRM integration ---------- */
  const deliveryOptions: DeliveryOption[] = useMemo(() => {
    const currentDeliveryTime = getCurrentDeliveryTime();
    const quickAvailable = isQuickDeliveryAvailable();

    // Calculate distance for display
    let distanceInfo = "";
    if (addresses.length && selectedAddress >= 0) {
      const currentAddress = addresses[selectedAddress];
      const userPincode = currentAddress.billing_pincode;
      if (userPincode) {
        const distance = calculatePincodeDistance(
          WAREHOUSE_PINCODE,
          userPincode
        );
        distanceInfo = ` (~${distance}km from warehouse)`;
      }
    }

    return [
      {
        id: "standard",
        name: "Standard Delivery",
        description: "2-3 business days",
        time: "2-3 days",
        price: 0,
        icon: <Truck size={20} className="text-blue-400" />,
        isQuick: false,
      },
      {
        id: "quick",
        name: "Casa Express",
        description: quickAvailable
          ? `Same day delivery${distanceInfo}`
          : `Express delivery not available${distanceInfo}`,
        time: quickAvailable ? "Same day" : "Unavailable",
        price: 99,
        icon: (
          <Zap
            size={20}
            className={quickAvailable ? "text-yellow-400" : "text-red-400"}
          />
        ),
        isQuick: true,
        disabled: !quickAvailable,
      },
    ];
  }, [selectedAddress, addresses]); // Re-calculate when address selection or addresses change

  /* ---------- Robust user id resolver (checks casa_user_data) ---------- */
  const resolvedUserIdRef = useRef<string | null>(null);
  const resolveUserId = async (): Promise<string | null> => {
    if (resolvedUserIdRef.current) return resolvedUserIdRef.current;

    if (userData?._id) {
      resolvedUserIdRef.current = String(userData._id);
      localStorage.setItem("userId", resolvedUserIdRef.current);
      return resolvedUserIdRef.current;
    }

    const casa = readCasaUser();
    if (casa?._id) {
      resolvedUserIdRef.current = String(casa._id);
      localStorage.setItem("userId", resolvedUserIdRef.current);
      return resolvedUserIdRef.current;
    }

    const cached =
      localStorage.getItem("userId") || sessionStorage.getItem("userId");
    if (cached) {
      resolvedUserIdRef.current = String(cached);
      return resolvedUserIdRef.current;
    }

    const keys = ["userData", "user", "currentUser", "auth"];
    for (const k of keys) {
      const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        const id =
          obj?._id ||
          obj?.id ||
          obj?.user?._id ||
          obj?.user?.id ||
          obj?.profile?._id ||
          obj?.data?._id;
        if (id) {
          resolvedUserIdRef.current = String(id);
          localStorage.setItem("userId", resolvedUserIdRef.current);
          return resolvedUserIdRef.current;
        }
      } catch (error) {
        console.error("Error resolving user id:", error);
      }
    }

    const email = userData?.email || getFlatEmail();
    const phone = userData?.phoneNumber || getFlatPhone();

    try {
      if (email) {
        const r = await axios.get(`${API_BASE}/users`, {
          params: { email },
          withCredentials: false,
        });
        const id = r?.data?.[0]?._id || r?.data?.user?._id;
        if (id) {
          resolvedUserIdRef.current = String(id);
          localStorage.setItem("userId", resolvedUserIdRef.current);
          return resolvedUserIdRef.current;
        }
      }
    } catch (error) {
      console.error("Error resolving user id:", error);
    }

    try {
      if (phone) {
        const r = await axios.get(`${API_BASE}/users`, {
          params: { phone },
          withCredentials: false,
        });
        const id = r?.data?.[0]?._id || r?.data?.user?._id;
        if (id) {
          resolvedUserIdRef.current = String(id);
          localStorage.setItem("userId", resolvedUserIdRef.current);
          return resolvedUserIdRef.current;
        }
      }
    } catch (error) {
      console.error("Error resolving user id:", error);
    }

    return null;
  };

  /* ---------- Address fetching (mount + when returning to tab) ---------- */
  const fetchAddresses = async () => {
    try {
      setAddrLoading(true);
      setAddrError(null);

      const userId = await resolveUserId();
      if (!userId) throw new Error("User not found. Please log in again.");

      const res = await axios.get(`${API_BASE}/users/${userId}/shipment`, {
        withCredentials: false,
      });
      const list = normalizeShipments(res.data);

      const mapped: Address[] = list.map((s: any) => ({
        _id: s._id,
        billing_customer_name: s.billing_customer_name,
        billing_phone: s.billing_phone,
        billing_email: s.billing_email || "",
        billing_address: s.billing_address,
        billing_address_2: s.billing_address_2 || "",
        billing_city: s.billing_city,
        billing_pincode: s.billing_pincode,
        billing_state: s.billing_state,
        billing_country: s.billing_country || "India",
        isDefault: !!s.isDefault,
        createdAt: s.createdAt,
      }));

      setAddresses(mapped);
      const defIndex = mapped.findIndex((a) => a.isDefault);
      setSelectedAddress(defIndex >= 0 ? defIndex : mapped.length ? 0 : -1);
    } catch (err: any) {
      setAddrError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not fetch addresses."
      );
      setAddresses([]);
      setSelectedAddress(-1);
    } finally {
      setAddrLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (alive) await fetchAddresses();
    })();
    const onFocus = () => fetchAddresses();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [userData?._id]);

  // keep selection valid if list size changes
  useEffect(() => {
    if (!addresses.length) {
      setSelectedAddress(-1);
      return;
    }
    setSelectedAddress((prev) =>
      prev < 0 ? 0 : Math.min(prev, addresses.length - 1)
    );
  }, [addresses.length]);

  /* ---------- Delete address ---------- */
  const deleteAddress = async (addressId: string) => {
    const userId = await resolveUserId();
    if (!userId) {
      alert("Please log in again.");
      return;
    }
    try {
      setDeletingId(addressId);
      await axios.delete(`${API_BASE}/users/${userId}/shipment/${addressId}`, {
        withCredentials: false,
      });
      await fetchAddresses();
    } catch (err: any) {
      console.error("Delete address failed:", err);
      alert(err?.response?.data?.message || "Failed to delete address.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- Quantity handlers ---------- */
  const handleQuantityChange = async (
    productId: string,
    size: string,
    change: number
  ) => {
    // Mark that user has interacted with quantity controls
    setHasInteracted(true);
    // Force re-render to update calculations
    setForceUpdate((prev) => prev + 1);

    if (directBuy && product) {
      // For direct buy, check current quantity in cart first

      const cartItem = cartItems.find(
        (item) => item.product._id === productId && item.size === size
      );
      if (cartItem) {
        // Product exists in cart, update quantity
        const currentQuantity = cartItem.quantity;
        const newQuantity = Math.max(0, currentQuantity + change);

        if (newQuantity > 0) {
          await updateQuantity(productId, size, newQuantity);
        } else {
          await removeFromCart(productId, size);
          setShowProduct(false); // Hide product when quantity reaches 0
        }

        // Force update after cart operation
        setTimeout(() => {
          setForceUpdate((prev) => prev + 1);
        }, 100);
      } else {
        // Product not in cart, add it with quantity 1 + change
        const newQuantity = Math.max(0, 1 + change);

        if (newQuantity > 0) {
          await addToCart(productId, newQuantity, size);
        } else {
          // User clicked minus when product not in cart, hide it
          setShowProduct(false);
        }

        // Force update after cart operation
        setTimeout(() => {
          setForceUpdate((prev) => prev + 1);
        }, 100);
      }
    } else {
      // For cart items, use the same approach as BagPage
      const item = cartItems.find(
        (i) => i.product._id === productId && i.size === size
      );
      if (!item) {
        console.error("❌ Cart item not found:", {
          productId,
          size,
          cartItems,
        });
        return;
      }
      await updateQuantity(
        productId,
        size,
        Math.max(0, item.quantity + change)
      );

      // Force update after cart operation
      setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
      }, 100);
    }
  };

  const handleSizeChange = async (
    productId: string,
    oldSize: string,
    newSize: string
  ) => {
    if (!userData?.isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    try {
      // Find the cart item
      const cartItem = cartItems.find(
        (item) => item.product._id === productId && item.size === oldSize
      );

      if (cartItem) {
        // Remove the old size item
        await removeFromCart(productId, oldSize);

        // Add the new size item with the same quantity
        await addToCart(productId, cartItem.quantity, newSize);

        // Force update after cart operation
        setTimeout(() => {
          setForceUpdate((prev) => prev + 1);
        }, 100);
      }
    } catch (error) {
      console.error("Error changing size:", error);
    }
  };

  /* ---------- Order creation ---------- */
  const createOrder = async (
    cartData: CartData,
    deliveryAddress: string,
    paymentStatus: string,
    paymentId?: string
  ) => {
    try {
      // Check if there are items to order
      if (orderItems.length === 0) {
        console.error("❌ Cannot create order: No items in cart");
        alert("Your cart is empty. Please add items before placing an order.");
        return { success: false, error: "No items in cart" };
      }
      const selectedDelivery = deliveryOptions.find(
        (opt) => opt.id === selectedDeliverySpeed
      );
      const isQuickDelivery = selectedDelivery?.isQuick || false;

      // Calculate estimated delivery time based on selected option
      let estimatedDelivery: Date;
      if (isQuickDelivery) {
        // 60 minutes from now
        estimatedDelivery = new Date(Date.now() + 60 * 60 * 1000);
      } else {
        // Standard 2-3 business days
        estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      }

      // Extract brandId from the first product in cart (assuming all products are from the same brand)
      const firstProduct = cartData.items[0]?.product;
      const brandId = firstProduct?.brand?._id || firstProduct?.brand;

      if (!brandId) {
        throw new Error("Brand ID not found in cart items");
      }

      const orderData = {
        user: resolvedUserIdRef.current || userData?._id,
        brandId: brandId,
        products: cartData.items,
        address: deliveryAddress,
        estimatedDelivery,
        paymentStatus,
        deliveryStatus: "pending",
        totalAmount: finalTotal,
        paymentId,
        deliverySpeed: selectedDeliverySpeed,
        isQuickDelivery,
        deliveryFee: selectedDelivery?.price || 0,
      };

      const response = await axios.post(
        `${API_BASE}/orders/create`,
        orderData,
        { withCredentials: false }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Error creating order:",
        error.response?.data || error.message
      );
      return { success: false };
    }
  };

  const deleteCart = async () => {
    try {
      await axios.delete(`${API_BASE}/cart/delete`, {
        data: { phone: userData?.phoneNumber },
        withCredentials: false,
      });
    } catch (error: any) {
      console.error(
        "Error deleting cart:",
        error.response?.data || error.message
      );
    }
  };

  // Shiprocket integration removed

  // Shiprocket integration removed

  /* ---------- Create order with Casa CRM (handles both standard and express) ---------- */
  async function createCasaOrder(
    casaOrderId?: string
  ): Promise<{ numeric?: number; channel: string }> {
    // Check if quick delivery is selected
    const isQuickDelivery = selectedDeliverySpeed === "quick";

    if (isQuickDelivery) {
      // Send express delivery request to Casa CRM
      try {
        const response = await axios.post(
          `${API_BASE}/orders/express-delivery`,
          {
            orderId: casaOrderId,
            deliveryType: "express",
            deliveryFee: 99,
            estimatedTime: getCurrentDeliveryTime().time,
          }
        );

        if (response.data?.success) {
          return {
            numeric: response.data.deliveryId,
            channel: `EXP${Date.now()}`,
          };
        }
      } catch (error) {
        console.warn(
          "⚠️ Express delivery request failed, falling back to standard:",
          error
        );
        // Fall back to standard delivery if express fails
        setSelectedDeliverySpeed("standard");
      }
    }

    // Standard delivery or fallback
    return { channel: `ORD${Date.now()}` };
  }

  /* ---------- Payment ---------- */
  const handleRazorpayPayment = async () => {
    try {
      if (!addresses.length || selectedAddress < 0) {
        alert("Please add a delivery address first.");
        return;
      }
      const selected = addresses[selectedAddress];

      // Calculate total amount including delivery fee and discount
      const totalAmount = finalTotal;

      // Test payment configuration first
      try {
        const configTestResponse = await axios.get(
          `${API_BASE}/payments/test-config`
        );

        if (!configTestResponse.data.success) {
          throw new Error(
            `Payment configuration error: ${configTestResponse.data.error}`
          );
        }
      } catch (configError) {
        console.warn("⚠️ Payment config test failed:", configError);
        // Continue with payment creation even if config test fails
      }

      const paymentOrderResponse = await axios.post(
        `${API_BASE}/payments/create-order`,
        {
          amount: totalAmount,
          currency: "INR",
          receipt: "order_" + Date.now(),
        },
        { withCredentials: false }
      );

      if (!paymentOrderResponse.data.success) {
        throw new Error(
          `Failed to create payment order: ${
            paymentOrderResponse.data.error || "Unknown error"
          }`
        );
      }
      const { order } = paymentOrderResponse.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_R6oU0KqqF5qUxh",
        amount: order.amount,
        currency: order.currency,
        name: "CASA",
        description: "Payment for your order",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyResponse = await axios.post(
              `${API_BASE}/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: false }
            );

            if (verifyResponse.data.success) {
              const orderResponse = await createOrder(
                cart,
                formatAddressOneLine(selected),
                "Paid",
                response.razorpay_payment_id
              );

              if (orderResponse.success) {
                const casaOrderId =
                  orderResponse?.order?._id ||
                  orderResponse?._id ||
                  "ORD" + Date.now();

                await deleteCart();

                // Create order with Casa CRM (handles both standard and express delivery)
                const sr = await createCasaOrder(casaOrderId);

                setIsProcessing(false);

                navigate("/order-success", {
                  state: {
                    orderId: casaOrderId,
                    items: orderItems,
                    total: finalTotal,

                    address: selected,
                    paymentId: response.razorpay_payment_id,
                    srNumericId: sr.numeric,
                    srChannelId: sr.channel,
                    deliverySpeed: selectedDeliverySpeed,
                    isQuickDelivery: selectedDeliverySpeed === "quick",
                    deliveryFee: selectedDeliverySpeed === "quick" ? 99 : 0,
                  },
                });
              }
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            setIsProcessing(false);
            alert("Payment verification failed. Please try again.");
          }
        },
        modal: {
          ondismiss: () => {
            // This is called when user cancels the payment
            setIsProcessing(false);
          },
        },
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
          contact: userData?.phoneNumber || "",
        },
        theme: { color: "#10B981" },
      };

      // Check if Razorpay is available
      if (typeof (window as any).Razorpay === "undefined") {
        throw new Error(
          "Razorpay script not loaded. Please refresh the page and try again."
        );
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("❌ Razorpay payment error:", error);
      setIsProcessing(false);

      // Provide more specific error messages
      let errorMessage = "Failed to initialize payment. Please try again.";

      if (error.message?.includes("Razorpay script not loaded")) {
        errorMessage =
          "Payment system is loading. Please refresh the page and try again.";
      } else if (error.message?.includes("Failed to create payment order")) {
        errorMessage = `Payment setup failed: ${error.message}`;
      } else if (error.response?.data?.error) {
        errorMessage = `Payment error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `Payment error: ${error.message}`;
      }

      alert(errorMessage);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      await handleRazorpayPayment();
    } catch (error) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      alert("Payment failed. Please try again.");
    }
  };

  /* ================= UI ================= */

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
  // Show loading state if no data
  if (!product && !bagItems && cartItems.length === 0) {
    return (
      <div className="relative max-w-md mx-auto min-h-screen bg-gray-900 text-white overflow-x-hidden">
        <div className="px-4 py-6">
          <h1 className="text-xl font-bold mb-4">Loading...</h1>
          <p className="text-gray-400">
            Please wait while we load your checkout details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Fixed Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800 max-w-[413px] mx-auto px-4 flex items-center"
        style={{ height: HEADER_H }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center mr-3 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft
            size={24}
            className="text-white hover:text-blue-400 transition-colors"
          />
        </button>
        <h1 className="text-xl font-bold">Checkout</h1>
      </header>

      {/* Scrollable content */}
      <main
        className="px-4 overflow-y-auto"
        style={{
          paddingTop: HEADER_H + 8,
          paddingBottom: FOOTER_H + 4,
          minHeight: `calc(100vh - ${HEADER_H + FOOTER_H}px)`,
        }}
      >
        <div className="py-6 space-y-6">
          {/* Address */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <MapPin size={20} className="text-blue-400" />
              <span>Delivery Address</span>
            </h2>

            {addrError && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                <AlertTriangle size={16} />
                <span>Addresses failed to load: {addrError}</span>
              </div>
            )}

            {addrLoading ? (
              <div className="space-y-3">
                <div className="h-20 rounded-lg bg-gray-800 animate-pulse" />
                <div className="h-20 rounded-lg bg-gray-800 animate-pulse" />
              </div>
            ) : addresses.length ? (
              <>
                <AnimatedList<Address>
                  items={addresses}
                  selectedIndex={selectedAddress}
                  onSelectedIndexChange={(idx) => setSelectedAddress(idx)}
                  selectOnHover={false}
                  className="w-full"
                  renderItem={(addr, idx, selected) => (
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => setSelectedAddress(idx)}
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block h-4 w-4 rounded-full border ${
                              selected
                                ? "border-blue-400 bg-blue-400"
                                : "border-gray-500"
                            }`}
                          />
                          <h3 className="font-medium text-white">
                            {addr.billing_customer_name}{" "}
                            {addr.isDefault ? (
                              <span className="ml-1 text-xs text-blue-300">
                                (Default)
                              </span>
                            ) : null}
                          </h3>
                        </div>
                        <p className="mt-2 text-sm text-gray-300 leading-snug">
                          {formatAddressOneLine(addr)}
                        </p>
                        {addr.billing_phone && (
                          <p className="text-sm text-gray-400 mt-1">
                            {addr.billing_phone}
                          </p>
                        )}
                        {addr.billing_email && (
                          <p className="text-xs text-gray-500">
                            {addr.billing_email}
                          </p>
                        )}
                        {selected && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-blue-300">
                            <CheckCircle size={14} /> Selected
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!deletingId) setConfirmId(addr._id);
                        }}
                        className={`shrink-0 rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 ${
                          deletingId === addr._id
                            ? "opacity-60 cursor-wait"
                            : ""
                        }`}
                        title="Delete address"
                        disabled={deletingId === addr._id}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Trash2 size={14} /> Delete
                        </span>
                      </button>
                    </div>
                  )}
                />

                <button
                  onClick={() => navigate("/location")}
                  className="mt-3 w-full rounded-lg border border-dashed border-gray-700 px-4 py-3 text-gray-300 hover:border-gray-500"
                >
                  + Add new address
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/location")}
                  className="w-full rounded-lg border border-dashed border-gray-700 px-4 py-3 text-gray-300 hover:border-gray-500"
                >
                  + Add your first address
                </button>
              </div>
            )}
          </div>

          {/* Delivery Speed Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Clock size={20} className="text-purple-400" />
              <span>Delivery Speed</span>
            </h2>
            <div className="space-y-3">
              {deliveryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    if (!option.disabled) {
                      setSelectedDeliverySpeed(option.id);
                    }
                  }}
                  disabled={option.disabled}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    option.disabled
                      ? "border-gray-600 bg-gray-700 cursor-not-allowed opacity-60"
                      : selectedDeliverySpeed === option.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-gray-700 bg-gray-800 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {option.icon}
                      <div>
                        <h3
                          className={`font-medium ${
                            option.disabled ? "text-red-300" : "text-white"
                          }`}
                        >
                          {option.name}
                        </h3>
                        <p
                          className={`text-sm ${
                            option.disabled ? "text-red-200" : "text-gray-400"
                          }`}
                        >
                          {option.description}
                        </p>
                        {!option.disabled && (
                          <p className="text-xs text-gray-500">
                            Expected: {option.time}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {!option.disabled && (
                        <>
                          {option.price > 0 ? (
                            <span className="text-sm font-medium text-purple-400">
                              +₹{option.price}
                            </span>
                          ) : (
                            <span className="text-sm text-green-400">Free</span>
                          )}
                          {selectedDeliverySpeed === option.id && (
                            <div className="mt-1">
                              <CheckCircle
                                size={16}
                                className="text-purple-400 mx-auto"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Coupon Code Section */}
          <CouponErrorBoundary>
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Gift size={20} className="text-yellow-400" />
                <span>Coupon Code</span>
              </h2>

              {!appliedCoupon ? (
                <div className="space-y-4">
                  {/* Available Coupons Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Available Coupons
                    </label>
                    {availableCoupons.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                        {availableCoupons.map((coupon) => (
                          <button
                            key={coupon._id}
                            onClick={() => applyCouponFromDropdown(coupon)}
                            className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-left"
                          >
                            <div>
                              <div className="font-medium text-white">
                                {coupon.title} - {coupon.coupon_code}
                              </div>
                              <div className="text-sm text-gray-400">
                                {coupon.discount_type === "percentage"
                                  ? `${coupon.discount_value}% OFF`
                                  : `₹${coupon.discount_value} OFF`}
                                {coupon.min_order_value > 0 &&
                                  ` • Min order ₹${coupon.min_order_value}`}
                              </div>
                              {coupon.assignedProductName && (
                                <div className="text-xs text-blue-400 mt-1">
                                  For: {coupon.assignedProductName}
                                </div>
                              )}
                            </div>
                            <div className="text-yellow-400 text-sm font-medium">
                              Apply
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                        <div className="text-gray-400 text-sm">
                          {couponsLoading
                            ? "Loading available coupons..."
                            : "No coupons assigned to products in your cart. Coupons can be assigned to products in the CRM."}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual Coupon Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Or enter coupon code manually
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter coupon code (e.g., SAVE10)"
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        disabled={couponLoading}
                      />
                      <button
                        onClick={() => validateCoupon(couponCode)}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {couponLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Validating...</span>
                          </>
                        ) : (
                          <span>Apply</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {couponError && (
                    <div className="flex items-center space-x-2 text-red-400 text-sm">
                      <AlertTriangle size={16} />
                      <span>{couponError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle size={20} className="text-green-400" />
                      <div>
                        <p className="text-green-300 font-medium">
                          {appliedCoupon?.title || "Coupon"} Applied!
                        </p>
                        <p className="text-green-400 text-sm">
                          {appliedCoupon?.discount_type === "percentage"
                            ? `${appliedCoupon?.discount_value || 0}% OFF`
                            : `₹${appliedCoupon?.discount_value || 0} OFF`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CouponErrorBoundary>

          {/* Order Summary */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              {orderItems.map((item, index) => (
                <div key={index} className="flex items-start space-x-4 py-3">
                  <button
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="flex-shrink-0"
                  >
                    <img
                      src={
                        item.image ||
                        (Array.isArray(item.images)
                          ? item.images[0]
                          : item.images) ||
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+"
                      }
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        // Use a data URI as fallback instead of external URL
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3I8L3RleHQ+PC9zdmc+";
                      }}
                    />
                  </button>
                  <button
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="flex-1 text-left hover:opacity-80 transition-opacity min-w-0"
                  >
                    <h3 className="text-base font-semibold text-white mb-1">
                      {item.brand}
                    </h3>
                    <p className="text-sm text-gray-300 mb-2 leading-relaxed">
                      {item.name}
                    </p>
                    {item.color && (
                      <p className="text-xs text-gray-400 mb-2">
                        Color: {item.color}
                      </p>
                    )}
                    <div className="mt-3">
                      <label className="text-xs text-gray-400 block mb-2">
                        Size:
                      </label>
                      <select
                        value={
                          directBuy && product
                            ? selectedSize
                            : item.selectedSize || ""
                        }
                        onClick={(e) => e.stopPropagation()}
                        onChange={async (e) => {
                          e.stopPropagation();
                          const newSize = e.target.value;

                          // Handle size change for direct buy products
                          if (directBuy && product) {
                            try {
                              // Update local state first
                              setSelectedSize(newSize);

                              // Update the cart with the new size
                              await removeFromCart(product.id, selectedSize);
                              await addToCart(product.id, 1, newSize);

                              // Force update after cart operation
                              setTimeout(() => {
                                setForceUpdate((prev) => prev + 1);
                              }, 100);
                            } catch (error) {
                              console.error("Failed to update size:", error);
                              // Revert the local state if cart update fails
                              setSelectedSize(selectedSize);
                            }
                          } else {
                            // For cart items, update the size
                            handleSizeChange(
                              item.id,
                              item.selectedSize,
                              newSize
                            );
                          }
                        }}
                        className="text-sm bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {(() => {
                          const sizesToUse =
                            directBuy && product
                              ? product.sizes || []
                              : item.sizes || [];

                          return sizesToUse && sizesToUse.length > 0 ? (
                            sizesToUse.map((size: string) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))
                          ) : (
                            // Fallback to default sizes if product sizes are not available
                            <>
                              <option value="XS">XS</option>
                              <option value="S">S</option>
                              <option value="M">M</option>
                              <option value="L">L</option>
                              <option value="XL">XL</option>
                              <option value="XXL">XXL</option>
                              <option value="28">28</option>
                              <option value="30">30</option>
                              <option value="32">32</option>
                              <option value="34">34</option>
                              <option value="36">36</option>
                              <option value="38">38</option>
                              <option value="40">40</option>
                              <option value="42">42</option>
                            </>
                          );
                        })()}
                      </select>
                    </div>
                  </button>
                  <div className="flex flex-col items-end space-y-3">
                    <div className="text-right">
                      {(() => {
                        const unitPrice =
                          typeof item.price === "string"
                            ? parseInt(
                                item.price.replace("₹", "").replace(",", "")
                              )
                            : item.price;

                        // Calculate discounted price if offer is available
                        let displayPrice = unitPrice;
                        let originalPrice = unitPrice;

                        if (item.offerPercentage && item.offerPercentage > 0) {
                          const discount =
                            (unitPrice * item.offerPercentage) / 100;
                          displayPrice = unitPrice - discount;
                        }

                        const totalPrice = displayPrice * item.quantity;

                        return (
                          <div>
                            {item.offerPercentage &&
                            item.offerPercentage > 0 ? (
                              <div>
                                <div className="flex items-center justify-end space-x-2">
                                  <span className="text-sm text-gray-400 line-through">
                                    ₹{originalPrice.toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-lg font-bold text-green-400">
                                    ₹{displayPrice.toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <p className="text-xs text-green-400 mt-1">
                                  Limited Offer: {item.offerPercentage}% Off!
                                </p>
                              </div>
                            ) : (
                              <p className="text-lg font-bold text-white">
                                ₹{displayPrice.toLocaleString("en-IN")}
                              </p>
                            )}
                            {item.quantity && item.quantity > 1 && (
                              <p className="text-sm text-gray-400 mt-1">
                                ₹{displayPrice.toLocaleString("en-IN")} ×{" "}
                                {item.quantity}
                              </p>
                            )}
                            <p className="text-lg font-bold text-white mt-1">
                              Total: ₹{totalPrice.toLocaleString("en-IN")}
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item.id, item.selectedSize, -1);
                        }}
                        className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center text-white font-medium text-lg">
                        {item.quantity}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item.id, item.selectedSize, 1);
                        }}
                        className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-700 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{orderTotal.toLocaleString("en-IN")}</span>
                </div>
                {selectedDeliverySpeed === "quick" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-400">Quick Delivery Fee</span>
                    <span className="text-purple-400">+₹99</span>
                  </div>
                )}
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">
                      Discount ({appliedCoupon?.title || "Coupon"})
                    </span>
                    <span className="text-green-400">
                      -₹{(Number(discountAmount) || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-gray-600 pt-2">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <CreditCard size={20} className="text-green-400" />
              <span>Payment Method</span>
            </h2>
            <div className="space-y-3">
              {paymentMethods.map((method, index) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(index)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    selectedPayment === index
                      ? "border-green-500 bg-green-500/10"
                      : "border-gray-700 bg-gray-800 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <h3 className="font-medium text-white">
                          {method.type}
                        </h3>
                        <p className="text-sm text-gray-400">{method.name}</p>
                      </div>
                    </div>
                    {selectedPayment === index && (
                      <CheckCircle size={20} className="text-green-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Casa Express Delivery Notice */}
          {selectedDeliverySpeed === "quick" && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Zap size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">
                  Casa Express Selected
                </span>
              </div>
              <p className="text-xs text-yellow-200">
                Express delivery will be processed by Casa CRM for faster
                fulfillment
              </p>
              <p className="text-xs text-yellow-300 mt-1">
                Delivery fee: ₹99 | Same day delivery | Distance:{" "}
                {addresses.length &&
                selectedAddress >= 0 &&
                addresses[selectedAddress].billing_pincode
                  ? `${calculatePincodeDistance(
                      WAREHOUSE_PINCODE,
                      addresses[selectedAddress].billing_pincode
                    )}km from warehouse`
                  : "Calculating..."}
              </p>
            </div>
          )}

          {/* Delivery Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Truck size={16} className="text-blue-400" />
              <span className="text-sm font-medium">Delivery Information</span>
            </div>
            <div className="space-y-2">
              {selectedDeliverySpeed === "quick" ? (
                <div className="flex items-center space-x-2">
                  <Zap size={14} className="text-yellow-400" />
                  <p className="text-xs text-yellow-300 font-medium">
                    🚀 Casa Express: Quick delivery
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Standard delivery in 2-3 business days. Free delivery on
                  orders above ₹1,500.
                </p>
              )}
              {selectedDeliverySpeed === "quick" && (
                <p className="text-xs text-gray-400 mt-2">
                  Quick delivery available in select areas. Additional ₹99 fee
                  applies.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer (Payment) */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-t border-gray-800 max-w-[413px] mx-auto px-4 py-3"
        style={{ height: FOOTER_H }}
      >
        <button
          onClick={handlePlaceOrder}
          disabled={
            isProcessing ||
            addrLoading ||
            addresses.length === 0 ||
            selectedAddress < 0
          }
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing
            ? "Processing..."
            : `Pay with Razorpay - ₹${finalTotal}`}
        </button>
      </footer>

      {/* Global Confirm Dialog for Delete */}
      <AlertDialog
        open={!!confirmId}
        onOpenChange={(open) => !open && setConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this address?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will remove the address from your
              saved shipments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmId) return;
                await deleteAddress(confirmId);
                setConfirmId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

export default CheckoutPage;
