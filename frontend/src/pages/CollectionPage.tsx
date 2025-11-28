import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Heart, User, Shirt } from "lucide-react";
import axios from "axios";
import { useCuratedList } from "../contexts/CuratedListContext";

interface Brand {
  _id: string;
  name: string;
  logo_url?: string;
  gender?: string;
  is_active: boolean;
  productCount?: number;
}

interface Category {
  _id: string;
  name: string;
  image: string;
  parentCategory?: {
    _id: string;
    name: string;
  } | null;
}

const CollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { curatedListCount } = useCuratedList();

  const [activeTab, setActiveTab] = useState("ALL");
  const [activeCategory, setActiveCategory] = useState("Brands");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isShowingSubcategories, setIsShowingSubcategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle gender parameter from URL
  useEffect(() => {
    const genderParam = searchParams.get("gender");
    console.log("🔍 CollectionPage - Gender param from URL:", genderParam);
    
    if (genderParam) {
      const upperGender = genderParam.toUpperCase();
      console.log("🔍 CollectionPage - Converted to uppercase:", upperGender);
      
      if (["MALE", "FEMALE", "UNISEX"].includes(upperGender)) {
        console.log("🔍 CollectionPage - Setting activeTab to:", upperGender);
        setActiveTab(upperGender);
      } else {
        console.log("🔍 CollectionPage - Invalid gender value:", upperGender);
      }
    }
  }, [searchParams]);

  // Fetch all categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await axios.get(
          import.meta.env.VITE_API_URL + "/categories/admin/all"
        );

        // Filter parent categories (parentCategory is null)
        const parentCats = res.data.filter(
          (cat: Category) => !cat.parentCategory
        );

        // Filter subcategories (parentCategory is not null)
        const subCats = res.data.filter(
          (cat: Category) => cat.parentCategory
        );

        setParentCategories(parentCats);
        setSubcategories(subCats); // Set subcategories directly
      } catch (err) {
        console.error("❌ Error fetching categories:", err);
        setParentCategories([]);
        setSubcategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // Read URL parameters
      const category = searchParams.get("category");

      let currentCategory = "Brands";
      if (category) {
        currentCategory = decodeURIComponent(category);
      }

      // Update state
      setActiveCategory(currentCategory);

      if (currentCategory === "Brands") {
        // Fetch brands with filters
        setIsShowingSubcategories(false);
        await fetchBrandsWithFilters(activeTab, searchQuery);
      } else {
        // Show subcategories for the selected parent category
        setIsShowingSubcategories(true);
        setLoadingSubcategories(false); // Subcategories already loaded
      }
    };

    fetchData();

    // Cleanup function to prevent race conditions
    return () => {
      isMounted = false;
    };
  }, [searchParams, parentCategories, activeTab, searchQuery]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || isShowingSubcategories) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      if (activeTab !== "ALL") {
        // Map frontend tabs to backend gender values
        if (activeTab === "MALE") {
          params.append("gender", "MALE");
        } else if (activeTab === "FEMALE") {
          params.append("gender", "FEMALE");
        } else if (activeTab === "UNISEX") {
          params.append("gender", "UNISEX");
        }
      }
      params.append("page", nextPage.toString());
      params.append("limit", activeTab === "ALL" ? "50" : "12");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/brands?${params.toString()}`
      );

      // Apply search filter to new data
      let filteredBrands = res.data;
      if (searchQuery.trim()) {
        filteredBrands = res.data.filter((brand: Brand) =>
          brand.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setBrands((prev) => [...prev, ...filteredBrands]);
      setHasMore(res.data.length === (activeTab === "ALL" ? 50 : 12));
      setPage(nextPage);
    } catch (err) {
      console.error("Error loading more brands:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Get filtered subcategories based on selected parent category
  const getFilteredSubcategories = () => {
    if (activeCategory === "Brands") return [];
    
    const parentCategory = parentCategories.find(
      (cat) => cat.name === activeCategory
    );
    
    if (!parentCategory) {
      return subcategories;
    }
    
    return subcategories.filter(
      (cat: Category) => cat.parentCategory?._id === parentCategory._id
    );
  };

  const filteredSubcategories = getFilteredSubcategories();

  // Transform backend parent categories to display format (for sidebar navigation)

  const displayCategories = [
    // Add "Brands" as the first option
    {
      id: "Brands",
      label: "All Brands",
      icon: (
        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">
          B
        </div>
      ),
      image: "",
      color: "bg-blue-500",
    },
    // Add all parent categories for navigation
    ...parentCategories.map((cat) => ({
      id: cat.name,
      label: cat.name,
      icon: (
        <div className="w-6 h-6 bg-pink-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">
          {cat.name.charAt(0)}
        </div>
      ),
      image: cat.image,
      color: "bg-pink-500",
    })),
  ];

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    navigate(`/collection?category=${encodeURIComponent(categoryId)}`);
  };

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);

    // If we're showing brands, refetch with the new gender filter
    if (activeCategory === "Brands") {
      await fetchBrandsWithFilters(tab, searchQuery);
    }
  };

  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);

    // If we're showing brands, refetch with the new search query
    if (activeCategory === "Brands") {
      await fetchBrandsWithFilters(activeTab, query);
    }
  };

  const fetchBrandsWithFilters = async (tab: string, search: string) => {
    setLoadingBrands(true);
    setPage(1);
    try {
      const params = new URLSearchParams();
      if (tab !== "ALL") {
        // Map frontend tabs to backend gender values
        if (tab === "MALE") {
          params.append("gender", "MALE");
        } else if (tab === "FEMALE") {
          params.append("gender", "FEMALE");
        } else if (tab === "UNISEX") {
          params.append("gender", "UNISEX");
        }
      }
      params.append("page", "1");
      params.append("limit", tab === "ALL" ? "50" : "12");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/brands?${params.toString()}`
      );

      // Client-side search filtering since backend doesn't support search yet
      let filteredBrands = res.data;
      if (search.trim()) {
        filteredBrands = res.data.filter((brand: Brand) =>
          brand.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      setBrands(filteredBrands);
      setHasMore(filteredBrands.length === (tab === "ALL" ? 50 : 12));
    } catch (err) {
      console.error("❌ Error fetching filtered brands:", err);
      setBrands([]);
      setHasMore(false);
    } finally {
      setLoadingBrands(false);
    }
  };

  const BrandSkeleton = () => (
    <div className="aspect-square rounded-2xl bg-gray-800/50 p-6 animate-pulse">
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <div className="w-16 h-16 bg-gray-700/50 rounded-full"></div>
        <div className="w-20 h-3 bg-gray-700/50 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 text-white flex flex-col h-[calc(100dvh-80px)] overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/50 z-40 flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold tracking-tight">Collection</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate("/search")}
                className="p-2 rounded-xl hover:bg-gray-800/50 transition-all duration-200 active:scale-95 flex items-center justify-center"
              >
                <Search size={20} className="text-gray-300" />
              </button>
              <button
                onClick={() => navigate("/curatedList")}
                className="relative p-2 rounded-xl hover:bg-gray-800/50 transition-all duration-200 active:scale-95 flex items-center justify-center"
              >
                <Heart
                  size={20}
                  className={
                    curatedListCount > 0
                      ? "text-red-500 fill-current"
                      : "text-gray-300"
                  }
                />
                {curatedListCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-500 text-[10px] leading-5 text-white text-center">
                    {curatedListCount > 99 ? "99+" : curatedListCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="p-2 rounded-xl hover:bg-gray-800/50 transition-all duration-200 active:scale-95 flex items-center justify-center"
              >
                <User size={20} className="text-gray-300" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            {/* Search Input */}
            {activeCategory === "Brands" && (
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            )}

            {/* Enhanced Tab Navigation */}
            <div className="flex space-x-3">
              {["MALE", "FEMALE", "UNISEX", "ALL"].map((tab) => (
                <button
                  key={tab}
                  className={`relative px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105"
                      : "bg-gray-800/80 text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-102"
                  }`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 opacity-20"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Enhanced Sidebar - Independent Scroll */}
        <div className="w-24 bg-gray-800/50 backdrop-blur-sm flex-shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <div className="py-4 space-y-1">
            {loadingCategories ? (
              // Loading skeleton for categories
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-full p-3 animate-pulse">
                  <div className="w-12 h-12 bg-gray-700/50 rounded-xl mx-auto mb-2"></div>
                  <div className="w-8 h-3 bg-gray-700/50 rounded mx-auto"></div>
                </div>
              ))
            ) : displayCategories.length > 0 ? (
              displayCategories.map((category) => (
                <button
                  key={category.id}
                  className={`relative w-full p-3 rounded-r-2xl transition-all duration-300 group ${
                    activeCategory === category.id
                      ? "bg-blue-600/90 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {category.image ? (
                      <div className="relative overflow-hidden rounded-xl">
                        <img
                          src={category.image}
                          alt={category.label}
                          className="w-12 h-12 object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {activeCategory === category.id && (
                          <div className="absolute inset-0 bg-blue-500/20 rounded-xl"></div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded-xl transition-colors duration-300 ${
                          activeCategory === category.id
                            ? "bg-blue-500"
                            : "bg-gray-700 group-hover:bg-gray-600"
                        }`}
                      >
                        {category.icon}
                      </div>
                    )}
                    <span className="text-xs font-medium text-center leading-tight">
                      {category.label.replace(" ", "\n")}
                    </span>
                  </div>

                  {/* Active indicator */}
                  {activeCategory === category.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full"></div>
                  )}
                </button>
              ))
            ) : (
              // No categories found
              <div className="p-3 text-center">
                <div className="w-12 h-12 bg-gray-700/50 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Shirt className="w-6 h-6 text-gray-500" />
                </div>
                <span className="text-xs text-gray-500">No categories</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Main Content - Independent Scroll */}
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          <div className="flex-shrink-0 p-4 pb-3">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {activeCategory === "Brands"
                  ? "All Brands"
                  : `${activeCategory} Categories`}
              </h2>
              <div className="text-sm text-gray-400">
                {!loadingBrands &&
                  !loadingSubcategories &&
                  `${
                    isShowingSubcategories
                      ? filteredSubcategories.length
                      : brands.length
                  } items`}
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              {activeCategory === "Brands"
                ? `Discover all premium brands for ${activeTab.toLowerCase()}`
                : `Browse ${activeCategory.toLowerCase()} subcategories`}
            </p>
          </div>


          {/* Scrollable Brands Grid - Independent Scroll */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent min-h-0">
            {/* Enhanced Grid */}
            <div className="grid grid-cols-2 gap-3">
              {loadingBrands || loadingSubcategories ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <BrandSkeleton key={i} />
                ))
              ) : (isShowingSubcategories ? filteredSubcategories : brands).length ===
                0 ? (
                <div className="col-span-2 py-20 text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    {isShowingSubcategories
                      ? "No subcategories found"
                      : "No brands found"}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Try switching to a different category or tab
                  </p>
                </div>
              ) : isShowingSubcategories ? (
                filteredSubcategories.map((subcategory) => (
                  <button
                    key={subcategory._id}
                    className="group aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-gray-800/80 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/25 active:scale-95 border border-gray-700/50 hover:border-gray-600/50"
                    onClick={() => {
                      // Navigate to products with category filter and parent category info
                      const url = `/products/${subcategory._id}?parentCategory=${encodeURIComponent(activeCategory)}`;
                      navigate(url);
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full space-y-3">
                      {subcategory.image ? (
                        <div className="relative">
                          <img
                            src={subcategory.image}
                            alt={subcategory.name}
                            className="w-16 h-16 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl flex items-center justify-center group-hover:from-gray-600 group-hover:to-gray-500 transition-all duration-300">
                          <span className="text-2xl font-bold text-gray-300 group-hover:text-white">
                            {subcategory.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors duration-300 truncate max-w-full">
                          {subcategory.name}
                        </div>
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </button>
                ))
              ) : (
                brands.map((brand) => (
                  <button
                    key={brand._id}
                    className="group aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-gray-800/80 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/25 active:scale-95 border border-gray-700/50 hover:border-gray-600/50"
                    onClick={() => {
                      // Navigate to products with brand filter
                      const url = `/products?brand=${brand._id}`;
                      navigate(url);
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full space-y-3">
                      {brand.logo_url ? (
                        <div className="relative">
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-16 h-16 object-contain rounded-2xl transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl flex items-center justify-center group-hover:from-gray-600 group-hover:to-gray-500 transition-all duration-300">
                          <span className="text-2xl font-bold text-gray-300 group-hover:text-white">
                            {brand.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors duration-300 truncate max-w-full">
                          {brand.name}
                        </div>
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Show More Button - Only for brands */}
          {!loadingBrands &&
            !isShowingSubcategories &&
            brands.length > 0 &&
            hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-gray-800/80 hover:bg-gray-700 disabled:bg-gray-700/50 disabled:cursor-not-allowed text-gray-300 hover:text-white disabled:text-gray-500 rounded-2xl font-medium transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50"
                >
                  {loadingMore ? "Loading..." : "Load More Brands"}
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CollectionPage;
