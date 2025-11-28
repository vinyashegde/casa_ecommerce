import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Filter } from "lucide-react";
import { motion } from "framer-motion";
import MasterFilters, { ActiveFilters } from "../components/MasterFilters";
interface Product {
  _id: string;
  name: string;
  price: number | { $numberDecimal: string };
  currency: string;
  images: string[];
  brand?: {
    _id: string;
    name: string;
    logo_url?: string;
  };
  category?: {
    _id: string;
    name: string;
  };
  tags: string[];
  gender: string;
  offerPercentage?: number;
}

const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [categoryName, setCategoryName] = useState<string>("");

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [focusSection, setFocusSection] = useState<
    "gender" | "colors" | "brands" | "categories" | "sizes" | undefined
  >(undefined);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    colors: [],
    brands: [],
    categories: [],
    gender: "all",
    sizes: [],
  });
  const brandId = searchParams.get("brand");
  const genderFilter = searchParams.get("gender");
  const parentCategory = searchParams.get("parentCategory");

  // Handle filter changes
  const handleFiltersChange = (filters: ActiveFilters) => {
    setActiveFilters(filters);
    applyFilters(products, filters);
  };

  // Apply filters to products
  const applyFilters = (
    productsToFilter: Product[],
    filters: ActiveFilters
  ) => {
    let filtered = [...productsToFilter];

    // Filter by gender
    if (filters.gender !== "all") {
      filtered = filtered.filter(
        (product) =>
          product.gender?.toLowerCase() === filters.gender.toLowerCase()
      );
    }

    // Filter by brands
    if (filters.brands.length > 0) {
      filtered = filtered.filter(
        (product) => product.brand && filters.brands.includes(product.brand._id)
      );
    }

    // Filter by categories
    if (filters.categories.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.category && filters.categories.includes(product.category._id)
      );
    }

    // Filter by colors (check if any of the product tags match the selected colors)
    if (filters.colors.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.tags &&
          product.tags.some((tag) =>
            filters.colors.some((color) =>
              tag.toLowerCase().includes(color.toLowerCase())
            )
          )
      );
    }

    // Filter by sizes (check if any of the product tags match the selected sizes)
    if (filters.sizes.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.tags &&
          product.tags.some((tag) =>
            filters.sizes.some((size) =>
              tag.toLowerCase().includes(size.toLowerCase())
            )
          )
      );
    }

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    if (brandId) {
      fetchProductsByBrand(brandId);
    } else if (categoryId) {
      fetchProductsByCategory(categoryId);
    } else {
      setLoading(false);
    }
  }, [brandId, categoryId, genderFilter]);

  const fetchProductsByBrand = useCallback(async (brandId: string) => {
    try {
      setError("");
      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      let url = `${API_BASE}/products/brand/${brandId}`;

      // Add gender filter if specified
      if (genderFilter) {
        url += `?gender=${genderFilter}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();

      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch products"
      );
    } finally {
      setLoading(false);
    }
  });

  const fetchProductsByCategory = async (categoryId: string) => {
    try {
      setError("");
      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      const response = await fetch(
        `${API_BASE}/products/category?category=${categoryId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      console.log("Products data:", data);
      console.log("First product:", data[0]);
      setProducts(data);
      setFilteredProducts(data);

      // Extract category name from the first product if available
      if (data.length > 0 && data[0].category) {
        setCategoryName(data[0].category.name);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch products"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 z-10 p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              // Navigate back to the collection page with the appropriate category
              if (brandId) {
                // If we came from a brand, go back to Brands category
                navigate("/collection?category=Brands");
              } else if (categoryId && parentCategory) {
                // If we came from a subcategory, go back to the parent category
                navigate(
                  `/collection?category=${encodeURIComponent(parentCategory)}`
                );
              } else {
                // Default fallback
                navigate("/collection");
              }
            }}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {categoryName ? `${categoryName} Products` : "Products"}
            </h1>
            {categoryName && (
              <p className="text-sm text-gray-400">
                Showing products tagged with "{categoryName}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="px-4 py-3 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          {/* Main Filter Button */}
          <motion.button
            onClick={() => setShowFilters(true)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-full font-semibold transition-all duration-200 ${
              Object.values(activeFilters).some((filter) =>
                Array.isArray(filter) ? filter.length > 0 : filter !== "all"
              )
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter size={16} />
            <span>Filters</span>
            {Object.values(activeFilters).some((filter) =>
              Array.isArray(filter) ? filter.length > 0 : filter !== "all"
            ) && (
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                {activeFilters.colors.length +
                  activeFilters.brands.length +
                  activeFilters.categories.length +
                  activeFilters.sizes.length +
                  (activeFilters.gender !== "all" ? 1 : 0)}
              </span>
            )}
          </motion.button>

          {/* Sub-filter buttons */}
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => {
                setFocusSection("brands");
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
              Brand{" "}
              {activeFilters.brands.length > 0 &&
                `(${activeFilters.brands.length})`}
            </motion.button>
            <motion.button
              onClick={() => {
                setFocusSection("categories");
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
              Product{" "}
              {activeFilters.categories.length > 0 &&
                `(${activeFilters.categories.length})`}
            </motion.button>
            <motion.button
              onClick={() => {
                setFocusSection("colors");
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
              Colors{" "}
              {activeFilters.colors.length > 0 &&
                `(${activeFilters.colors.length})`}
            </motion.button>
            <motion.button
              onClick={() => {
                setFocusSection("sizes");
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
              Size{" "}
              {activeFilters.sizes.length > 0 &&
                `(${activeFilters.sizes.length})`}
            </motion.button>
          </div>
        </div>

        {/* Active Filter Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {activeFilters.gender !== "all" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30"
            >
              {activeFilters.gender}
              <button
                onClick={() => {
                  const newFilters = { ...activeFilters, gender: "all" };
                  setActiveFilters(newFilters);
                  applyFilters(products, newFilters);
                }}
                className="ml-2 hover:text-blue-300"
              >
                ×
              </button>
            </motion.span>
          )}
          {activeFilters.colors.map((color) => (
            <motion.span
              key={color}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30"
            >
              {color}
              <button
                onClick={() => {
                  const newFilters = {
                    ...activeFilters,
                    colors: activeFilters.colors.filter((c) => c !== color),
                  };
                  setActiveFilters(newFilters);
                  applyFilters(products, newFilters);
                }}
                className="ml-2 hover:text-blue-300"
              >
                ×
              </button>
            </motion.span>
          ))}
          {activeFilters.brands.map((brandId) => (
            <motion.span
              key={brandId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30"
            >
              Brand {brandId}
              <button
                onClick={() => {
                  const newFilters = {
                    ...activeFilters,
                    brands: activeFilters.brands.filter((b) => b !== brandId),
                  };
                  setActiveFilters(newFilters);
                  applyFilters(products, newFilters);
                }}
                className="ml-2 hover:text-blue-300"
              >
                ×
              </button>
            </motion.span>
          ))}
          {activeFilters.categories.map((categoryId) => (
            <motion.span
              key={categoryId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30"
            >
              Category {categoryId}
              <button
                onClick={() => {
                  const newFilters = {
                    ...activeFilters,
                    categories: activeFilters.categories.filter(
                      (c) => c !== categoryId
                    ),
                  };
                  setActiveFilters(newFilters);
                  applyFilters(products, newFilters);
                }}
                className="ml-2 hover:text-blue-300"
              >
                ×
              </button>
            </motion.span>
          ))}
          {activeFilters.sizes.map((size) => (
            <motion.span
              key={size}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30"
            >
              {size}
              <button
                onClick={() => {
                  const newFilters = {
                    ...activeFilters,
                    sizes: activeFilters.sizes.filter((s) => s !== size),
                  };
                  setActiveFilters(newFilters);
                  applyFilters(products, newFilters);
                }}
                className="ml-2 hover:text-blue-300"
              >
                ×
              </button>
            </motion.span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <p>Loading products...</p>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">
              {products.length === 0
                ? "No products found for this category."
                : "No products match your filters."}
            </p>
            {products.length > 0 && (
              <button
                onClick={() => {
                  setActiveFilters({
                    colors: [],
                    brands: [],
                    categories: [],
                    gender: "all",
                    sizes: [],
                  });
                  setFilteredProducts(products);
                }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <img
                  src={product.images[0] || "https://via.placeholder.com/200"}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                  <p className="text-xs text-gray-400 mb-2">
                    {product.brand?.name || "No Brand"}
                  </p>
                  {(() => {
                    const originalPrice =
                      typeof product.price === "object"
                        ? Number(product.price.$numberDecimal)
                        : Number(product.price);
                    const offerPercentage = product.offerPercentage || 0;

                    if (offerPercentage > 0) {
                      const discount = (originalPrice * offerPercentage) / 100;
                      const discountedPrice = originalPrice - discount;

                      return (
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400 line-through">
                              {product.currency}
                              {originalPrice.toFixed(2)}
                            </span>
                            <span className="font-bold text-green-400">
                              {product.currency}
                              {discountedPrice.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-green-400 font-medium">
                            {offerPercentage}% Off!
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <p className="font-bold">
                          {product.currency}
                          {originalPrice.toFixed(2)}
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
};

export default ProductsPage;
