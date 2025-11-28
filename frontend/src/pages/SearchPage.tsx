import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Heart, ShoppingCart } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useCart } from "../contexts/CartContext";
import { useCuratedList } from "../contexts/CuratedListContext";
import { showSuccessToast } from "../utils/toast";
import LoginPopup from "../components/LoginPopup";

interface Product {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  price: {
    $numberDecimal: string;
  };
  currency: string;
  brand: {
    _id: string;
    name: string;
    logo_url?: string;
  };
  category: {
    _id: string;
    name: string;
  };
  tags: string[];
  stock: number;
  gender: string;
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const { addToCart } = useCart();
  const { isInCuratedList, addToCuratedList, removeFromCuratedList } =
    useCuratedList();

  const [searchQuery, setSearchQuery] = useState("");
  const [originalQuery, setOriginalQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }

    // Load recently viewed from localStorage
    const savedRecentlyViewed = localStorage.getItem("recentlyViewed");
    if (savedRecentlyViewed) {
      try {
        const recentlyViewedData = JSON.parse(savedRecentlyViewed);
        setRecentlyViewed(recentlyViewedData);
      } catch (error) {
        console.error(
          "Error parsing recently viewed from localStorage:",
          error
        );
        localStorage.removeItem("recentlyViewed");
      }
    }

    // Load popular searches (could be fetched from backend analytics)
    loadPopularSearches();
  }, []);

  const loadPopularSearches = async () => {
    try {
      // Import the utility function
      const { getProductsForSearch } = await import("../utils/getProducts");
      const products = await getProductsForSearch(20);

      if (products.length > 0) {
        // Extract popular search terms from product names and tags
        const searchTerms = new Set<string>();
        products.forEach((product: Product) => {
          if (product.name) {
            const words = product.name
              .split(" ")
              .filter((word: string) => word.length > 2);
            words.forEach((word) => searchTerms.add(word.toLowerCase()));
          }
          if (product.tags) {
            product.tags.forEach((tag) => searchTerms.add(tag.toLowerCase()));
          }
        });
        setPopularSearches(Array.from(searchTerms).slice(0, 6));
      } else {
        // Fallback to default popular searches
        setPopularSearches([
          "Jeans",
          "T-Shirts",
          "Sneakers",
          "Hoodies",
          "Shirts",
          "Pants",
        ]);
      }
    } catch (error) {
      console.error("Error loading popular searches:", error);

      // Fallback to direct API call
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/products?limit=20`
        );
        if (response.ok) {
          const products = await response.json();

          if (products.length > 0) {
            const searchTerms = new Set<string>();
            products.forEach((product: Product) => {
              if (product.name) {
                const words = product.name
                  .split(" ")
                  .filter((word: string) => word.length > 2);
                words.forEach((word) => searchTerms.add(word.toLowerCase()));
              }
              if (product.tags) {
                product.tags.forEach((tag) =>
                  searchTerms.add(tag.toLowerCase())
                );
              }
            });
            setPopularSearches(Array.from(searchTerms).slice(0, 6));
            return;
          }
        }
      } catch (fallbackError) {
        console.error("Fallback popular searches error:", fallbackError);
      }

      // Final fallback to default popular searches
      setPopularSearches([
        "Jeans",
        "T-Shirts",
        "Sneakers",
        "Hoodies",
        "Shirts",
        "Pants",
      ]);
    }
  };

  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;

    const newHistory = [
      { query: query.trim(), timestamp: Date.now() },
      ...searchHistory.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase()
      ),
    ].slice(0, 10); // Keep only last 10 searches

    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  const addToRecentlyViewed = (product: Product) => {
    const newRecentlyViewed = [
      product,
      ...recentlyViewed.filter((p) => p._id !== product._id),
    ].slice(0, 5); // Keep only last 5 products

    setRecentlyViewed(newRecentlyViewed);
    localStorage.setItem("recentlyViewed", JSON.stringify(newRecentlyViewed));
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setShowResults(true);
    saveSearchHistory(query);

    try {
      // Try to use the utility function first
      const { searchProducts } = await import("../utils/getProducts");
      const results = await searchProducts(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search utility error, trying direct API call:", error);

      // Fallback to direct API call
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/products/search`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: query.trim() }),
          }
        );

        if (response.ok) {
          const results = await response.json();
          setSearchResults(results);
        } else {
          console.error(
            "Search API error:",
            response.status,
            response.statusText
          );
          setSearchResults([]);
        }
      } catch (fallbackError) {
        console.error("Fallback search error:", fallbackError);
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handlePopularSearch = (search: string) => {
    setSearchQuery(search);
    handleSearch(search);
  };

  const handleHistorySearch = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleProductClick = (product: Product) => {
    addToRecentlyViewed(product);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setSearchQuery("");
    navigate(`/product/${product._id}`);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product._id, 1, "M");
  };

  const handleCuratedListToggle = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();

    if (!userData?.isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    try {
      const isCurrentlyInList = isInCuratedList(product._id);

      if (isCurrentlyInList) {
        // Remove from curated list
        removeFromCuratedList(product._id)
          .then(() => {
            showSuccessToast("Removed from wishlist");
          })
          .catch((error) => {
            console.error("❌ Error removing from curated list:", error);
          });
      } else {
        // Add to curated list
        const curatedProduct = {
          _id: product._id,
          name: product.name,
          price: parseFloat(product.price.$numberDecimal),
          images: product.images,
          brand: { name: product.brand?.name || "Unknown Brand" },
          category: product.category ? [product.category.name] : [],
          tags: product.tags || [],
        };
        addToCuratedList(curatedProduct)
          .then(() => {
            showSuccessToast("Added to wishlist");
          })
          .catch((error) => {
            console.error("❌ Error adding to curated list:", error);
          });
      }
    } catch (error) {
      console.error("❌ Error toggling curated list:", error);
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem("recentlyViewed");
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
      setSearchQuery("");
      setSearchResults([]);
    } else {
      navigate(-1);
    }
  };

  // Auto-suggestions based on input
  useEffect(() => {
    if (originalQuery.trim().length < 2) {
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { searchProducts } = await import("../utils/getProducts");
        const results = await searchProducts(originalQuery); // Use originalQuery
        setSuggestions(results.slice(0, 5)); // Limit to 5 suggestions
        setSelectedSuggestionIndex(-1); // Reset selection when new suggestions load
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [originalQuery]);

  const formatPrice = (price: any) => {
    if (price?.$numberDecimal) {
      return `₹${parseFloat(price.$numberDecimal).toLocaleString("en-IN")}`;
    }
    return "₹N/A";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length || showResults) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        const nextIndex =
          selectedSuggestionIndex < suggestions.length - 1
            ? selectedSuggestionIndex + 1
            : 0;
        setSelectedSuggestionIndex(nextIndex);
        setSearchQuery(suggestions[nextIndex].name);
        break;
      case "ArrowUp":
        e.preventDefault();
        const prevIndex =
          selectedSuggestionIndex > 0
            ? selectedSuggestionIndex - 1
            : suggestions.length - 1;
        setSelectedSuggestionIndex(prevIndex);
        setSearchQuery(suggestions[prevIndex].name);
        break;
      case "Enter":
        e.preventDefault();
        if (
          selectedSuggestionIndex >= 0 &&
          selectedSuggestionIndex < suggestions.length
        ) {
          handleProductClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch(searchQuery);
        }
        break;
      case "Escape":
        e.preventDefault();
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
        setSearchQuery(originalQuery);
        break;
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <form onSubmit={handleSubmit} className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => {
                const newQuery = e.target.value;
                setSearchQuery(newQuery);
                setOriginalQuery(newQuery);
                setSelectedSuggestionIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-800 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <Search size={20} />
            </button>
          </form>
        </div>

        {/* Search Suggestions */}
        {suggestions.length > 0 &&
          originalQuery.trim().length > 0 &&
          !showResults && (
            <div className="mt-2 bg-gray-800 rounded-lg overflow-hidden">
              {suggestions.map((product, index) => (
                <button
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center space-x-3 ${
                    selectedSuggestionIndex === index ? "bg-gray-700" : ""
                  }`}
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-xs text-gray-400">
                      {product.brand?.name || "Unknown Brand"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPrice(product.price)}
                  </span>
                </button>
              ))}
            </div>
          )}
      </div>

      {!showResults ? (
        /* Main Search Page Content */
        <div className="px-4 py-6">
          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your past searches</h2>
                <button
                  onClick={clearSearchHistory}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-2">
                {searchHistory.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistorySearch(item.query)}
                    className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors w-full text-left"
                  >
                    <Search size={16} className="text-gray-500" />
                    <span>{item.query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular searches */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Popular searches</h2>
            <div className="flex flex-wrap gap-3">
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handlePopularSearch(search)}
                  className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full transition-colors"
                >
                  <Search size={14} className="text-gray-500" />
                  <span className="text-sm">{search}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recently Viewed</h2>
                <button
                  onClick={clearRecentlyViewed}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-4">
                {recentlyViewed.map((product) => (
                  <div
                    key={product._id}
                    className="bg-gray-800 rounded-2xl overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="relative">
                      <img
                        src={
                          product.images && product.images.length > 0
                            ? product.images[0]
                            : "https://placehold.co/400x300/374151/ffffff?text=No+Image"
                        }
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-80 text-white px-2 py-1 rounded text-xs font-bold">
                        TRY n BUY
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <button
                          onClick={(e) => handleCuratedListToggle(e, product)}
                          className={`p-2 rounded-full transition-colors ${
                            isInCuratedList(product._id)
                              ? "bg-red-500 text-white"
                              : "bg-gray-900 bg-opacity-50 text-white hover:bg-opacity-70"
                          }`}
                        >
                          <Heart
                            size={16}
                            className={
                              isInCuratedList(product._id) ? "fill-current" : ""
                            }
                          />
                        </button>
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="p-2 bg-gray-900 bg-opacity-50 rounded-full hover:bg-opacity-70 transition-colors"
                        >
                          <ShoppingCart size={16} className="text-white" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 text-left">
                      <h3 className="font-bold text-sm text-white mb-1">
                        {product.brand?.name || "Unknown Brand"}
                      </h3>
                      <p className="text-gray-400 text-xs mb-2">
                        {product.name || "Unnamed Product"}
                      </p>
                      <span className="text-white font-bold text-sm">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Search Results */
        <div className="px-4 py-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              {isSearching
                ? "Searching..."
                : `Search results for "${searchQuery}"`}
            </h2>
            <p className="text-gray-400 text-sm">
              {isSearching
                ? "Please wait..."
                : `${searchResults.length} products found`}
            </p>
          </div>

          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Searching...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((product) => (
                <div
                  key={product._id}
                  className="bg-gray-800 rounded-2xl overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative">
                    <img
                      src={
                        product.images && product.images.length > 0
                          ? product.images[0]
                          : "https://placehold.co/400x300/374151/ffffff?text=No+Image"
                      }
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-80 text-white px-2 py-1 rounded text-xs font-bold">
                      TRY n BUY
                    </div>
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        onClick={(e) => handleCuratedListToggle(e, product)}
                        className={`p-2 rounded-full transition-colors ${
                          isInCuratedList(product._id)
                            ? "bg-red-500 text-white"
                            : "bg-gray-900 bg-opacity-50 text-white hover:bg-opacity-70"
                        }`}
                      >
                        <Heart
                          size={16}
                          className={
                            isInCuratedList(product._id) ? "fill-current" : ""
                          }
                        />
                      </button>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="p-2 bg-gray-900 bg-opacity-50 rounded-full hover:bg-opacity-70 transition-colors"
                      >
                        <ShoppingCart size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 text-left">
                    <h3 className="font-bold text-sm text-white mb-1">
                      {product.brand?.name || "Unknown Brand"}
                    </h3>
                    <p className="text-gray-400 text-xs mb-2">
                      {product.name || "Unnamed Product"}
                    </p>
                    <span className="text-white font-bold text-sm">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                No products found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search terms or browse our popular categories
              </p>
            </div>
          )}
        </div>
      )}

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

export default SearchPage;
