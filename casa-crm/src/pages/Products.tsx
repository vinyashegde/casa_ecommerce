import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Package,
  TrendingUp as TrendingUpIcon,
  Calculator,
  BarChart3,
} from "lucide-react";
import axios from "axios";
import { useBrand } from "../contexts/BrandContext";
import { useNotifications } from "../contexts/NotificationContext";
import ProductSlider from "../components/ProductSlider";
import Pagination from "../components/Pagination";
import InventoryValueService, {
  InventoryValueSummary,
} from "../services/inventoryValueService";
import InventoryService, {
  InventorySummary,
} from "../services/inventoryService";

const Products = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { brand } = useBrand();
  const { addNotification } = useNotifications();

  const categories = [
    "All",
    "Cargos & Parachutes",
    "Jeans",
    "T-Shirts",
    "Oversized T-shirt",
  ];

  interface Category {
    _id: string;
    name: string;
    parentCategory: string | null;
    __v: number;
  }

  interface Brand {
    _id: string;
    name: string;
    logo_url: string;
    social_links: string[];
    crm_user_ids: string[];
    is_active: boolean;
    created_at: string;
    __v: number;
  }

  interface ProductVariant {
    color: string;
    sizes: { size: string; stock: number }[];
    price: number | { $numberDecimal: string };
    images: string[];
    sku?: string;
  }

  interface Product {
    _id: string;
    name: string;
    description: string;
    images: string[];
    price: number | { $numberDecimal: string };
    currency: string;
    sizes: string[];
    fits: string[];
    tags: string[];
    stock: number;
    is_active: boolean;
    geo_tags: string[];
    gender: "male" | "female" | "unisex";
    brand: Brand;
    category: Category[];
    product_variants?: ProductVariant[]; // New field for variants
    created_at: string;
    updated_at: string;
    __v: number;
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [isLoadingInventorySummary, setIsLoadingInventorySummary] =
    useState(false);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [inventoryValue, setInventoryValue] =
    useState<InventoryValueSummary | null>(null);
  const [brandSummary, setBrandSummary] = useState<{
    totalProducts: number;
    totalOrders: number;
    completedOrders: number;
    completedRevenue: number;
  } | null>(null);

  // Inventory management state
  const [inventorySummary, setInventorySummary] =
    useState<InventorySummary | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] =
    useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockOperation, setStockOperation] = useState<"add" | "reduce">("add");

  // Pagination constants
  const ITEMS_PER_PAGE = 10;

  // Helper function to format price
  const formatPrice = (
    price: number | { $numberDecimal: string } | undefined
  ): string => {
    if (typeof price === "number") {
      return price.toLocaleString();
    } else if (typeof price === "object" && price?.$numberDecimal) {
      return parseFloat(price.$numberDecimal).toLocaleString();
    }
    return "N/A";
  };

  // Helper function to get effective price for a product (handles variants)
  const getEffectivePrice = (product: Product): number => {
    // If product has variants, use the first variant's price as reference
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

  // Helper function to get total stock for a product (handles variants)
  const getTotalStock = (product: Product): number => {
    // If product has variants, sum up all variant stock
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants.reduce((total, variant) => {
        return (
          total +
          variant.sizes.reduce((variantTotal, size) => {
            return variantTotal + size.stock;
          }, 0)
        );
      }, 0);
    }

    // Fallback to main product stock
    return product.stock || 0;
  };

  // Helper function to check if product has variants
  const hasVariants = (product: Product): boolean => {
    return !!(product.product_variants && product.product_variants.length > 0);
  };

  // Helper function to get effective images for a product (handles variants)
  const getEffectiveImages = (product: Product): string[] => {
    // Use variant images if available
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants[0].images || [];
    }
    // Fallback to main product images for backward compatibility
    return product.images || [];
  };

  // Pagination helper functions
  const getTotalPages = useMemo(() => {
    return (totalItems: number) => {
      return Math.ceil(totalItems / ITEMS_PER_PAGE);
    };
  }, [ITEMS_PER_PAGE]);

  const getPaginatedProducts = useMemo(() => {
    return (products: Product[], page: number) => {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return products.slice(startIndex, endIndex);
    };
  }, [ITEMS_PER_PAGE]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const paginatedProducts = getPaginatedProducts(filteredProducts, page);
    setDisplayedProducts(paginatedProducts);

    // Scroll to top of products section
    const productsSection = document.getElementById("all-products-section");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLoadMore = () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      const currentDisplayedCount = displayedProducts.length;
      const nextBatch = filteredProducts.slice(
        currentDisplayedCount,
        currentDisplayedCount + ITEMS_PER_PAGE
      );

      setDisplayedProducts((prev) => [...prev, ...nextBatch]);
      setHasMore(
        currentDisplayedCount + ITEMS_PER_PAGE < filteredProducts.length
      );
      setIsLoading(false);
    }, 800);
  };

  const filteredProducts = useMemo(() => {
    return (products || []).filter((product) => {
      const nameMatch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const brandMatch = product.brand?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

      const categoryMatch =
        selectedCategory === "All" ||
        product.category?.some((cat) => cat.name === selectedCategory);

      return (nameMatch || brandMatch) && categoryMatch;
    });
  }, [products, searchQuery, selectedCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      let url = "";

      if (brand && brand._id) {
        url = `${apiUrl}/products/brand/${brand._id}`;
      } else {
        url = `${apiUrl}/products`;
      }

      console.log("🔍 Fetching products data...", {
        brand: brand,
        brandId: brand?._id,
        apiUrl: apiUrl,
        fullUrl: url,
        hasBrand: !!brand,
        brandName: brand?.name,
      });

      if (!brand) {
        console.warn("⚠️ No brand found, fetching all products");
      }

      try {
        console.log("🚀 Making API call to:", url);
        const response = await axios.get(url);

        console.log("📊 Products API Response:", {
          status: response.status,
          data: response.data,
          isArray: Array.isArray(response.data),
          hasProducts: response.data?.products ? "Yes" : "No",
          hasData: response.data?.data ? "Yes" : "No",
          dataLength:
            response.data?.length ||
            response.data?.products?.length ||
            response.data?.data?.length ||
            0,
        });

        // Handle different response structures
        const productsData = response.data;
        if (Array.isArray(productsData)) {
          setProducts(productsData);
          console.log(
            "✅ Products set from direct array:",
            productsData.length,
            "products"
          );
        } else if (productsData && Array.isArray(productsData.products)) {
          setProducts(productsData.products);
          console.log(
            "✅ Products set from products array:",
            productsData.products.length,
            "products"
          );
        } else if (productsData && Array.isArray(productsData.data)) {
          setProducts(productsData.data);
          console.log(
            "✅ Products set from data array:",
            productsData.data.length,
            "products"
          );
        } else {
          console.warn("⚠️ Unexpected response structure:", productsData);
          setProducts([]);
        }

        console.log("📦 Final products data:", products);
        // No notification for successful load - silent operation
      } catch (error) {
        const axiosError = error as {
          message: string;
          response?: { data: unknown; status: number };
        };
        console.error("❌ Error fetching products:", {
          error: error,
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
          url: url,
        });
        setProducts([]); // Ensure products is always an array
        // Only show error notification for actual errors
        addNotification({
          type: "error",
          title: "Error Loading Products",
          message: "Failed to load products. Please try again.",
          duration: 5000,
        });
      }
    };
    fetchProducts();
  }, [brand, addNotification, products]);

  // Fetch brand orders summary
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
    if (!brand?._id) return;
    axios
      .get(`${apiUrl}/orders/brand/${brand._id}/summary`)
      .then((res) => setBrandSummary(res.data.data))
      .catch(() => setBrandSummary(null));
  }, [brand?._id]);

  // Update displayed products when filtered products change
  useEffect(() => {
    const initialProducts = getPaginatedProducts(filteredProducts, 1);
    setDisplayedProducts(initialProducts);
    setCurrentPage(1);
    setHasMore(filteredProducts.length > ITEMS_PER_PAGE);
  }, [filteredProducts, getPaginatedProducts, ITEMS_PER_PAGE]);

  // Fetch inventory value when products change
  useEffect(() => {
    if (products.length > 0) {
      const fetchData = async () => {
        if (brand?._id) {
          setIsLoadingInventorySummary(true);
          setIsLoadingInventory(true);
          try {
            const [inventoryValue, inventorySummary] = await Promise.all([
              InventoryValueService.getInventorySummary(brand._id),
              InventoryService.getInventorySummary(brand._id),
            ]);
            setInventoryValue(inventoryValue);
            setInventorySummary(inventorySummary);
          } catch (error) {
            console.error("Error fetching inventory data:", error);
            addNotification({
              type: "error",
              title: "Inventory Error",
              message: "Failed to load inventory data. Please try again.",
              duration: 5000,
            });
          } finally {
            setIsLoadingInventorySummary(false);
            setIsLoadingInventory(false);
          }
        }
      };
      fetchData();
    }
  }, [products, brand, addNotification]);

  const handleDeleteProduct = async (
    productId: string,
    productName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await axios.delete(`${apiUrl}/products/id/${productId}`);

      if (response.status === 200) {
        // Remove the product from the local state
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product._id !== productId)
        );

        // Refresh inventory value after deletion
        setTimeout(() => {
          fetchInventoryValue();
        }, 500);

        addNotification({
          type: "success",
          title: "Product Deleted",
          message: `"${productName}" has been successfully deleted.`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      addNotification({
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete product. Please try again.",
        duration: 5000,
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // No notification for category change
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // No notification for search
  };

  // Fetch inventory value
  const fetchInventoryValue = async () => {
    if (products.length === 0) return;

    setIsLoadingInventory(true);
    try {
      const brandId = brand?._id;
      const summary = await InventoryValueService.getInventorySummary(brandId);
      setInventoryValue(summary);
    } catch (error) {
      console.error("Error fetching inventory value:", error);
      addNotification({
        type: "error",
        title: "Inventory Value Error",
        message: "Failed to load inventory value. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Mock statistics data
  const stats = {
    totalProducts: brandSummary?.totalProducts ?? products.length,
    activeProducts: products.filter((p) => p.is_active).length,
    completedOrders: brandSummary?.completedOrders ?? 0,
    completedRevenue: brandSummary?.completedRevenue ?? 0,
    revenue: inventoryValue?.formattedTotal || "₹0",
  };

  // Get recent products (last 18 for slider - 3 slides of 6 items each)
  const recentProducts = products.slice(-18);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-10xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10 relative">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
          Manage Your Product
        </h1>
        <div className="mt-3 flex justify-center">
          <p className="text-gray-500 max-w-xl text-lg">
            Effortlessly add, edit, and organize your products with a clean and
            modern interface.
          </p>
        </div>
        {/* Decorative underline effect */}
        <div className="absolute left-1/2 -bottom-3 w-32 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transform -translate-x-1/2"></div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative group flex-1">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-indigo-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="w-full pl-16 pr-6 py-5 glass border-0 rounded-3xl shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-white placeholder-white/50 input-focus"
            />
          </div>
        </div>
        {/* <button className="w-16 h-16 glass rounded-3xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110">
          <Filter className="w-6 h-6 text-white" />
        </button> */}
      </div>

      {/* Add Product Button and Categories in One Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Categories */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
            Filter Products
          </h3>
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((category, index) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-6 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all duration-300 hover:scale-105 animate-slide-up ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                    : "glass text-white/80 hover:text-white hover:bg-white/20"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Add Product Button */}
        <div className="lg:ml-6">
          <Link
            to="/products/add"
            className="inline-flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/25 hover:scale-105 group"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              <Package className="w-6 h-6" />
            </div>
            <span className="text-lg">Add New Product</span>
            <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-white/60 transition-colors"></div>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up"
        style={{ animationDelay: "0.5s" }}
      >
        <div className="glass rounded-3xl p-6 shadow-2xl border border-white/10 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">
                Total Products
              </p>
              <p className="text-4xl font-bold text-white mt-2">
                {stats.totalProducts}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center">
              <Package className="w-7 h-7 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-2xl border border-white/10 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">
                Completed Orders
              </p>
              <p className="text-4xl font-bold text-white mt-2">
                {stats.completedOrders}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center">
              <TrendingUpIcon className="w-7 h-7 text-green-400" />
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-2xl border border-white/10 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">
                Completed Order Revenue
              </p>
              <p className="text-4xl font-bold text-white mt-2">
                ₹{(stats.completedRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center">
              <Calculator className="w-7 h-7 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Summary Section */}
      {inventorySummary && (
        <div
          className="space-y-6 animate-slide-up"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-400" />
              Inventory Overview
            </h2>
            <p className="text-gray-400">
              Track your stock levels and manage inventory
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {/* Total Stock */}
            <div className="glass rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs font-medium">Total Stock</p>
                  <p className="text-2xl font-bold text-white">{inventorySummary.totalStock}</p>
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className="glass rounded-xl p-4 border border-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUpIcon className="w-5 h-5 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-orange-300 text-xs font-medium">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-400">{inventorySummary.lowStockCount}</p>
                </div>
              </div>
            </div>

            {/* Out of Stock Alert */}
            <div className="glass rounded-xl p-4 border border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-red-300 text-xs font-medium">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-400">{inventorySummary.outOfStockCount}</p>
                </div>
              </div>
            </div>

{inventorySummary.lowStockProducts.length > 0 && (
              <div className="glass rounded-xl p-4 border border-orange-500/20">
                <h3 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4" />
                  Low Stock Products ({inventorySummary.lowStockProducts.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {inventorySummary.lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-1.5 px-2 bg-orange-500/10 rounded border border-orange-500/20"
                    >
                      <span className="text-white text-sm font-medium truncate">
                        {product.name}
                      </span>
                      <span className="text-orange-300 text-sm font-bold flex-shrink-0 ml-2">
                        {product.stock} left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Out of Stock Products */}
            {inventorySummary.outOfStockProducts.length > 0 && (
              <div className="glass rounded-xl p-4 border border-red-500/20">
                <h3 className="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Out of Stock Products ({inventorySummary.outOfStockProducts.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {inventorySummary.outOfStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-1.5 px-2 bg-red-500/10 rounded border border-red-500/20"
                    >
                      <span className="text-white text-sm font-medium truncate">
                        {product.name}
                      </span>
                      <span className="text-red-300 text-sm font-bold flex-shrink-0 ml-2">0 in stock</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>

       
        </div>
      )}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

      {/* Recent Products Section - Modern Slider */}
      <div
        className="space-y-8 animate-slide-up mt-12 mb-8"
        style={{ animationDelay: "0.6s" }}
      >
        {/* Enhanced Section Header */}
        <div className="text-center relative">
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent rounded-full"></div>
          </div>

          {/* Main header content */}
          <div className="relative z-10 text-center my-12">
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
                Recent Products
              </h2>
              <p className="mt-2 text-gray-500 text-lg max-w-md">
                Explore the latest products added to your collection.
              </p>
              {/* Decorative glow/underline */}
              <div className="mt-3 w-24 h-1 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Product Slider */}
        <ProductSlider
          products={recentProducts}
          onEditProduct={(product) =>
            navigate("/products/add", { state: { product } })
          }
          onDeleteProduct={handleDeleteProduct}
          formatPrice={formatPrice}
        />
      </div>

      {/* All Products Section - Enhanced Design */}
      {filteredProducts.length > 0 && (
        <div
          id="all-products-section"
          className="space-y-8 animate-slide-up mt-16 mb-8"
          style={{ animationDelay: "0.8s" }}
        >
          {/* Enhanced Section Header */}
          <div className="text-center relative">
            {/* Background decoration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent rounded-full"></div>
            </div>

            {/* Main header content */}
            <div className="relative z-10 text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
                All Products
              </h2>

              {/* Subtitle */}
              <p className="mt-4 text-gray-500 text-lg max-w-md mx-auto">
                Manage and explore all your products in one place.
              </p>
              <div className="mt-3 mx-auto w-28 h-1 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"></div>
            </div>
          </div>

          {/* Enhanced Product Grid with Loading States */}
          <div className="relative">
            {/* Grid Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {displayedProducts.map((product, index) => (
                <div
                  key={product._id}
                  className="group relative bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/10 min-h-[420px] flex flex-col"
                  style={{ animationDelay: `${0.9 + index * 0.1}s` }}
                >
                  {/* Enhanced Product Image */}
                  <div className="relative h-48 overflow-hidden flex-shrink-0">
                    <img
                      src={
                        getEffectiveImages(product)[0] ||
                        "https://placehold.co/400x400/27272a/ffffff?text=No+Image"
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Enhanced Action Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          navigate("/products/add", { state: { product } })
                        }
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-xl shadow-xl transition-all duration-200 hover:scale-110 hover:shadow-blue-500/25 flex items-center gap-1 text-xs"
                        title="Edit Product"
                      >
                        <Edit size={14} />
                        <span className="font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteProduct(product._id, product.name)
                        }
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-xl shadow-xl transition-all duration-200 hover:scale-110 hover:shadow-red-500/25 flex items-center gap-1 text-xs"
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
                        <span className="font-medium">Delete</span>
                      </button>
                    </div>

                    {/* Enhanced Status Badge */}
                    <div className="absolute top-2 left-2">
                      <div
                        className={`px-2 py-1 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm ${
                          product.is_active
                            ? "bg-green-500/90 text-white border border-green-400/30"
                            : "bg-red-500/90 text-white border border-red-400/30"
                        }`}
                      >
                        {product.is_active ? "✓ Active" : "✗ Inactive"}
                      </div>
                    </div>

                    {/* Enhanced Stock Badge */}
                    <div className="absolute top-2 right-2">
                      <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold border border-white/20">
                        📦 {getTotalStock(product)}
                      </div>
                    </div>

                    {/* Enhanced Brand Badge */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-lg border border-white/20">
                        <p className="text-gray-800 font-bold text-xs truncate flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></span>
                          <span className="truncate">
                            {product.brand?.name || "Unknown Brand"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Product Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between bg-gradient-to-b from-white/5 to-white/10">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-base mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors leading-tight">
                        {product.name || "Unnamed Product"}
                      </h3>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2 leading-relaxed">
                        {product.description || "No description available"}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Enhanced Price and Gender */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xl font-bold text-white">
                            ₹{formatPrice(getEffectivePrice(product))}
                          </span>
                          <span className="text-gray-400 text-xs font-medium">
                            {product.currency || "INR"}
                          </span>
                          {hasVariants(product) && (
                            <span className="text-xs text-blue-400 font-medium bg-blue-500/20 px-1.5 py-0.5 rounded">
                              Variants
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.gender === "male"
                                ? "bg-blue-400"
                                : product.gender === "female"
                                ? "bg-pink-400"
                                : "bg-purple-400"
                            }`}
                          ></div>
                          <span className="text-xs text-gray-300 capitalize font-medium">
                            {product.gender || "unisex"}
                          </span>
                        </div>
                      </div>

                      {/* Enhanced Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {product.tags && product.tags.length > 0 ? (
                          <>
                            {product.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 text-xs rounded-md border border-indigo-500/30 font-medium hover:bg-indigo-500/30 transition-colors"
                              >
                                #{tag}
                              </span>
                            ))}
                            {product.tags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-md font-medium">
                                +{product.tags.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-md font-medium">
                            No tags
                          </span>
                        )}
                      </div>

                      {/* Variant Information */}
                      {hasVariants(product) && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-400 font-medium">
                            Available Variants:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {product
                              .product_variants!.slice(0, 3)
                              .map((variant, idx) => (
                                <div
                                  key={idx}
                                  className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-xs rounded-md border border-blue-500/30 font-medium"
                                >
                                  {variant.color} ({variant.sizes.length} sizes)
                                </div>
                              ))}
                            {product.product_variants!.length > 3 && (
                              <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-md font-medium">
                                +{product.product_variants!.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Component */}
          <div className="mt-12">
            <Pagination
              currentPage={currentPage}
              totalPages={getTotalPages(filteredProducts.length)}
              onPageChange={handlePageChange}
              onLoadMore={handleLoadMore}
              isLoading={isLoading}
              hasMore={hasMore}
              totalItems={filteredProducts.length}
              itemsPerPage={ITEMS_PER_PAGE}
              showLoadMore={true}
            />
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-24 h-24 glass rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl lightning-pulse float-bounce">
            <Search className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-3 neon-text">
            No products found
          </h3>
          <p className="text-white/70 text-lg mb-6">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default Products;
