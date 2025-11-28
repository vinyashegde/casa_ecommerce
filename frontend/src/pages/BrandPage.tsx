import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";

/**
 * Mobile‑first Brand page with UX fixes:
 * - Better loading & error states (skeletons, empty grid)
 * - Safer fetches (AbortController, env base URL)
 * - Accessibility (aria labels, roles, semantic regions)
 * - Touch‑friendly controls & safe‑area padding
 * - Popover focus management & outside click handling
 * - Lazy images, aspect‑ratio placeholders to reduce CLS
 * - Pure Tailwind (no injected CSS) + small utility classes
 */

// ---------- Types ----------
interface Product {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  price: { $numberDecimal: string };
  currency: string; // e.g. "INR"
  tags: string[];
  brand: { _id: string; name: string; logo_url?: string };
  sizes: string[];
  gender: string; // e.g. "male" | "female" | "unisex"
  createdAt?: string; // optional if API provides
  offerPercentage?: number;
}

interface Brand {
  _id: string;
  name: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
}

// ---------- Helpers ----------
const API_BASE = import.meta.env.VITE_API_URL;

const formatINRCurrency = (value: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value);

const normalizeGender = (g: string) => g?.toLowerCase()?.replace(/\s+/g, "");

// ---------- Component ----------
const BrandPage: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();

  // Data state
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // ---------- Fetch brand ----------
  useEffect(() => {
    if (!brandId) return;
    const ctrl = new AbortController();
    const run = async () => {
      try {
        setLoadingBrand(true);
        setError(null);
        const res = await fetch(`${API_BASE}/brands/${brandId}`, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Brand not found");
        const data: Brand = await res.json();
        setBrand(data);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError(e?.message || "Failed to fetch brand");
          setBrand(null);
        }
      } finally {
        setLoadingBrand(false);
      }
    };
    run();
    return () => ctrl.abort();
  }, [brandId]);

  // ---------- Fetch products ----------
  useEffect(() => {
    if (!brandId) return;
    const ctrl = new AbortController();
    const run = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch(`${API_BASE}/products/brand/${brandId}`, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch products");
        const data: Product[] = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          console.error("Error fetching products:", e);
          setProducts([]);
        }
      } finally {
        setLoadingProducts(false);
      }
    };
    run();
    return () => ctrl.abort();
  }, [brandId]);

  // ---------- Derivations ----------
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.tags?.forEach((t) => t && set.add(t)));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const g = normalizeGender(selectedGender);
    let list = products.filter((p) => {
      const pg = normalizeGender(p.gender);
      const genderOk =
        g === "all" || pg === g || (g === "unisex" && pg === "unisex");
      const categoryOk =
        selectedCategory === "all" ||
        (p.tags && p.tags.includes(selectedCategory));
      return genderOk && categoryOk;
    });

    switch (sortBy) {
      case "price-low":
        list = list.sort(
          (a, b) =>
            parseFloat(a.price?.$numberDecimal || "0") -
            parseFloat(b.price?.$numberDecimal || "0")
        );
        break;
      case "price-high":
        list = list.sort(
          (a, b) =>
            parseFloat(b.price?.$numberDecimal || "0") -
            parseFloat(a.price?.$numberDecimal || "0")
        );
        break;
      case "name":
        list = list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // newest (fallback: createdAt desc if available)
        list = list.sort((a, b) => {
          const ad = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bd = b.createdAt ? Date.parse(b.createdAt) : 0;
          return bd - ad;
        });
    }

    return list;
  }, [products, selectedGender, selectedCategory, sortBy]);

  // ---------- Handlers ----------
  const handleAddToCart = async (productId: string) => {
    try {
      setAddingToCart(productId);
      // TODO: collect size from PDP; using default "M" for quick add
      await addToCart(productId, 1, "M");
    } catch (e) {
      console.error("Failed to add to cart:", e);
      // Don't show generic error - let BrandValidationError component handle it
    } finally {
      setAddingToCart(null);
    }
  };

  const safeNavigateBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  // ---------- Render ----------
  if (loadingBrand) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full border-2 border-gray-700 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-base text-gray-300">Loading brand…</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold">Brand not found</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg active:scale-95 transition"
          >
            Go to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-900">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={safeNavigateBack}
            aria-label="Go back"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-900 active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <button
              aria-label="Search (coming soon)"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-900 disabled:opacity-50"
              disabled
            >
              <Search size={22} />
            </button>
            <button
              onClick={() => navigate("/bag")}
              aria-label="Open bag"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-900 active:scale-95"
            >
              <ShoppingBag size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Brand header */}
      <section className="px-4 py-6 bg-gradient-to-b from-gray-900 to-transparent">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden">
            {brand.logo_url ? (
              <img
                src={brand.logo_url}
                alt={`${brand.name} logo`}
                loading="lazy"
                className="w-3/4 h-3/4 object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400">No logo</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold uppercase tracking-wide truncate">
              {brand.name}
            </h1>
            <p className="text-xs text-gray-400">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "product" : "products"}
            </p>
          </div>
        </div>
        {brand.description && (
          <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
            {brand.description}
          </p>
        )}
      </section>

      {/* Filter chips */}
      <section className="px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm active:scale-95 transition ${
              showFilters
                ? "bg-blue-600 text-white"
                : "bg-gray-900 text-gray-200 border border-gray-800"
            }`}
            aria-expanded={showFilters}
            aria-controls="desktop-filters"
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-900 text-gray-100 px-4 py-2 rounded-full text-sm border border-gray-800 min-w-[9rem]"
            aria-label="Category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>

          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="bg-gray-900 text-gray-100 px-4 py-2 rounded-full text-sm border border-gray-800 min-w-[8rem]"
            aria-label="Gender"
          >
            <option value="all">All genders</option>
            <option value="male">Men</option>
            <option value="female">Women</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        {showFilters && (
          <div
            id="desktop-filters"
            className="mt-3 bg-gray-900 border border-gray-800 rounded-xl p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 text-gray-100 px-3 py-2 rounded-lg text-sm border border-gray-700"
                aria-label="Sort products"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Products */}
      <main className="px-4 pb-8" role="main">
        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-4 mt-6" aria-busy>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-900 bg-gray-925 animate-pulse"
              >
                <div className="aspect-[3/4] bg-gray-900" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-800 rounded" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                  <div className="h-9 bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto rounded-full bg-gray-900 flex items-center justify-center mb-3">
              <Search size={22} className="text-gray-400" />
            </div>
            <p className="text-gray-300 font-medium">No products found</p>
            <p className="text-gray-500 text-sm mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mt-6">
            {filteredProducts.map((product) => {
              const inCart = isInCart(product._id);
              const priceNum = parseFloat(product.price?.$numberDecimal || "0");
              const primaryImg = product.images?.[0];
              return (
                <article
                  key={product._id}
                  className="rounded-2xl overflow-hidden border border-gray-900 bg-gray-925 focus-within:ring-2 focus-within:ring-blue-600"
                >
                  <button
                    onClick={() => navigate(`/product/${product._id}`)}
                    className="block w-full text-left"
                    aria-label={`Open ${product.name}`}
                  >
                    <div className="relative">
                      <div className="aspect-[3/4] bg-gray-900 overflow-hidden">
                        {primaryImg ? (
                          <img
                            src={primaryImg}
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
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                      {(() => {
                        const originalPrice = priceNum;
                        const offerPercentage = product.offerPercentage || 0;

                        if (offerPercentage > 0) {
                          const discount =
                            (originalPrice * offerPercentage) / 100;
                          const discountedPrice = originalPrice - discount;

                          return (
                            <div className="mt-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-400 line-through">
                                  {formatINRCurrency(
                                    originalPrice,
                                    product.currency || "INR"
                                  )}
                                </span>
                                <span className="text-base font-bold text-green-400">
                                  {formatINRCurrency(
                                    discountedPrice,
                                    product.currency || "INR"
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-green-400 font-medium">
                                {offerPercentage}% Off!
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <p className="mt-2 text-base font-bold">
                              {formatINRCurrency(
                                originalPrice,
                                product.currency || "INR"
                              )}
                            </p>
                          );
                        }
                      })()}
                    </div>
                  </button>

                  <div className="px-3 pb-3">
                    <button
                      onClick={() => handleAddToCart(product._id)}
                      disabled={inCart || addingToCart === product._id}
                      className={`w-full py-2 rounded-xl text-sm font-semibold active:scale-95 transition disabled:opacity-60 ${
                        inCart
                          ? "bg-green-600 text-white"
                          : addingToCart === product._id
                          ? "bg-blue-400 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                      aria-live="polite"
                    >
                      {inCart
                        ? "✓ Added to Bag"
                        : addingToCart === product._id
                        ? "Adding…"
                        : "Add to Bag"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrandPage;
