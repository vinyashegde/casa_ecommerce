import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Heart } from "lucide-react";
import axios from "axios";
import { useCuratedList } from "../contexts/CuratedListContext";
import { useUser } from "../contexts/UserContext";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import LoginPopup from "../components/LoginPopup";

interface Product {
  _id: string;
  name: string;
  price: any;
  images: string[];
  brand: {
    _id: string;
    name: string;
    logo_url?: string;
  };
  category: Array<{
    _id: string;
    name: string;
  }>;
  description?: string;
  tags?: string[];
  gender?: string;
  sizes?: string[];
  stock?: number;
}

const SkeletonLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-900 text-white">
    {/* Header */}
    <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2 text-gray-300">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </div>
        <div
          className="h-6 w-32 rounded-md bg-gray-700"
          style={{
            background: "linear-gradient(90deg, #374151, #4b5563, #374151)",
            backgroundSize: "200% 100%",
            animation: "pearl 1.5s infinite",
          }}
        ></div>
        <div className="w-20"></div>
      </div>
    </div>

    {/* Hero Section Skeleton */}
    <div
      className="relative h-80 overflow-hidden bg-gray-800"
      style={{
        background: "linear-gradient(90deg, #374151, #4b5563, #374151)",
        backgroundSize: "200% 100%",
        animation: "pearl 1.5s infinite",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="h-10 w-64 bg-gray-700 rounded-md mb-4 mx-auto"
            style={{
              background: "linear-gradient(90deg, #374151, #4b5563, #374151)",
              backgroundSize: "200% 100%",
              animation: "pearl 1.5s infinite",
            }}
          ></div>
          <div
            className="h-6 w-48 bg-gray-700 rounded-md mb-4 mx-auto"
            style={{
              background: "linear-gradient(90deg, #374151, #4b5563, #374151)",
              backgroundSize: "200% 100%",
              animation: "pearl 1.5s infinite",
            }}
          ></div>
          <div
            className="h-4 w-96 bg-gray-700 rounded-md mx-auto"
            style={{
              background: "linear-gradient(90deg, #374151, #4b5563, #374151)",
              backgroundSize: "200% 100%",
              animation: "pearl 1.5s infinite",
            }}
          ></div>
        </div>
      </div>
    </div>

    {/* Products Section Skeleton */}
    <div className="p-4">
      <div
        className="h-8 w-56 bg-gray-700 rounded-md mb-6"
        style={{
          background: "linear-gradient(90deg, #374151, #4b5563, #374151)",
          backgroundSize: "200% 100%",
          animation: "pearl 1.5s infinite",
        }}
      ></div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-gray-800 rounded-2xl overflow-hidden">
            <div
              className="w-full h-48 bg-gray-700"
              style={{
                background: "linear-gradient(90deg, #374151, #4b5563, #374151)",
                backgroundSize: "200% 100%",
                animation: "pearl 1.5s infinite",
              }}
            ></div>
            <div className="p-4">
              <div
                className="h-4 w-full bg-gray-700 rounded-md mb-2"
                style={{
                  background:
                    "linear-gradient(90deg, #374151, #4b5563, #374151)",
                  backgroundSize: "200% 100%",
                  animation: "pearl 1.5s infinite",
                }}
              ></div>
              <div
                className="h-4 w-3/4 bg-gray-700 rounded-md mb-4"
                style={{
                  background:
                    "linear-gradient(90deg, #374151, #4b5563, #374151)",
                  backgroundSize: "200% 100%",
                  animation: "pearl 1.5s infinite",
                }}
              ></div>
              <div className="flex items-center justify-between">
                <div
                  className="h-8 w-20 bg-gray-700 rounded-md"
                  style={{
                    background:
                      "linear-gradient(90deg, #374151, #4b5563, #374151)",
                    backgroundSize: "200% 100%",
                    animation: "pearl 1.5s infinite",
                  }}
                ></div>
                <div
                  className="w-10 h-10 rounded-full bg-gray-700"
                  style={{
                    background:
                      "linear-gradient(90deg, #374151, #4b5563, #374151)",
                    backgroundSize: "200% 100%",
                    animation: "pearl 1.5s infinite",
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const IconicLookPage: React.FC = () => {
  const { lookId } = useParams<{ lookId: string }>();
  const navigate = useNavigate();
  const { userData } = useUser();
  const { isInCuratedList, addToCuratedList, removeFromCuratedList } =
    useCuratedList();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [curatedListLoading, setCuratedListLoading] = useState<string | null>(
    null
  );

  // Define look metadata (without products - will be fetched from API)
  const lookMetadata = {
    // Men's looks
    streetwear: {
      title: "Streetwear King",
      subtitle: "Urban Edge Collection",
      description:
        "Express your street style with oversized tees, cargo pants, and urban accessories that define the modern streetwear aesthetic.",
      image:
        "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=800",
      categories: ["Oversized T-shirt", "Cargos & Parachutes", "Hoodies"],
      tags: ["streetwear", "urban", "oversized", "cargo", "hoodie"],
      gender: "male",
    },
    formal: {
      title: "Smart Casual",
      subtitle: "Professional Elegance",
      description:
        "Master the art of smart casual dressing with tailored shirts, sophisticated trousers, and professional accessories.",
      image:
        "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800",
      categories: ["Shirt", "Trousers", "Watches"],
      tags: ["formal", "professional", "shirt", "trousers", "watch"],
      gender: "male",
    },
    casual: {
      title: "Weekend Warrior",
      subtitle: "Relaxed Comfort",
      description:
        "Embrace comfort and style with relaxed hoodies, comfortable jeans, and casual accessories perfect for weekend vibes.",
      image:
        "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800",
      categories: ["Hoodies", "Jeans", "Bracelets"],
      tags: ["casual", "comfort", "hoodie", "jeans", "relaxed"],
      gender: "male",
    },
    // Women's looks
    elegant: {
      title: "Elegant Queen",
      subtitle: "Sophisticated Grace",
      description:
        "Embrace timeless elegance with sophisticated dresses, refined blazers, and elegant accessories that define feminine grace.",
      image:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=800",
      categories: ["Blazer", "Waistcoats", "Trousers"],
      tags: ["elegant", "sophisticated", "formal", "professional", "blazer"],
      gender: "female",
    },
    party: {
      title: "Party Ready",
      subtitle: "Night Out Glamour",
      description:
        "Shine bright with glamorous party wear, statement pieces, and dazzling accessories perfect for any celebration.",
      image:
        "https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=800",
      categories: ["Dresses", "Skirt", "Tops"],
      tags: ["party", "glamour", "celebration", "night", "dress"],
      gender: "female",
    },
    // Women's casual look (Weekend Vibes)
    "casual-women": {
      title: "Weekend Vibes",
      subtitle: "Relaxed Comfort",
      description:
        "Embrace comfort and style with relaxed tops, comfortable pants, and casual accessories perfect for weekend relaxation.",
      image:
        "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800",
      categories: ["Tops", "Pants", "Trousers"],
      tags: ["casual", "comfort", "relaxed", "weekend", "tops"],
      gender: "female",
    },
  };

  // Helper function to format price
  const formatPrice = (price: any): string => {
    if (!price) return "N/A";
    if (typeof price === "object" && price.$numberDecimal) {
      return `₹${parseFloat(price.$numberDecimal).toFixed(0)}`;
    }
    return `₹${parseFloat(price).toFixed(0)}`;
  };

  // Fetch products based on look type
  const fetchProducts = async () => {
    if (!lookId || !lookMetadata[lookId as keyof typeof lookMetadata]) {
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      const lookData = lookMetadata[lookId as keyof typeof lookMetadata];
      let allProducts: Product[] = [];
      let foundProducts = false;

      // Try to fetch products by categories first (most specific)
      for (const category of lookData.categories) {
        try {
          const response = await axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/products/category?category=${category}&gender=${lookData.gender}`
          );
          if (response.data && response.data.length > 0) {
            allProducts = [...allProducts, ...response.data];
            foundProducts = true;
          }
        } catch (error) {
          console.error(`No products found for category: ${category}`, error);
        }
      }

      // If we found products by category, use them and add some from tags
      if (foundProducts) {
        // Add a few products from tags to diversify
        for (const tag of lookData.tags.slice(0, 2)) {
          // Only try first 2 tags
          try {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/products/tag?tag=${tag}&gender=${
                lookData.gender
              }`
            );
            if (response.data && response.data.length > 0) {
              allProducts = [...allProducts, ...response.data];
            }
          } catch (error) {
            console.error(`No products found for tag: ${tag}`, error);
          }
        }
      } else {
        // If no products found by category, try by tags
        for (const tag of lookData.tags) {
          try {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/products/tag?tag=${tag}&gender=${
                lookData.gender
              }`
            );
            if (response.data && response.data.length > 0) {
              allProducts = [...allProducts, ...response.data];
              foundProducts = true;
            }
          } catch (error) {
            console.error(`No products found for tag: ${tag}`, error);
          }
        }
      }

      // If still no products, fetch all products for the gender and filter
      if (!foundProducts) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/products?gender=${
              lookData.gender
            }&limit=50`
          );
          allProducts = response.data || [];
        } catch (error) {
          console.error("Error fetching products:", error);
        }
      }

      // Remove duplicates and limit to 6 products
      const uniqueProducts = allProducts
        .filter(
          (product, index, self) =>
            index === self.findIndex((p) => p._id === product._id)
        )
        .slice(0, 6);

      setProducts(uniqueProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [lookId, navigate]);

  const currentLook = lookId
    ? lookMetadata[lookId as keyof typeof lookMetadata]
    : null;

  const handleCuratedListToggle = async (
    e: React.MouseEvent,
    product: Product
  ) => {
    e.stopPropagation();

    if (!userData?.isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    setCuratedListLoading(product._id);
    try {
      if (isInCuratedList(product._id)) {
        await removeFromCuratedList(product._id);
        showSuccessToast("Removed from wishlist");
      } else {
        const curatedProduct = {
          _id: product._id,
          name: product.name,
          price:
            typeof product.price === "object" && product.price.$numberDecimal
              ? parseFloat(product.price.$numberDecimal)
              : product.price,
          images: product.images,
          brand: product.brand,
          category: product.category || [],
          tags: [],
        };
        await addToCuratedList(curatedProduct);
        showSuccessToast("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling curated list:", error);
      showErrorToast("Failed to update wishlist");
    } finally {
      setCuratedListLoading(null);
    }
  };

  if (loading || !currentLook) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold">{currentLook.title}</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={currentLook.image}
          alt={currentLook.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=800";
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-2">{currentLook.title}</h2>
            <p className="text-xl text-gray-300 mb-4">{currentLook.subtitle}</p>
            <p className="text-gray-300 max-w-2xl mx-auto px-4">
              {currentLook.description}
            </p>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="p-4">
        <h3 className="text-2xl font-bold mb-6 text-yellow-300">
          Featured Products
        </h3>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              No products found for this look
            </p>
            <button
              onClick={() => navigate("/collection")}
              className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-gray-800 rounded-2xl overflow-hidden group cursor-pointer transform hover:scale-105 transition-all duration-300"
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <div className="relative">
                  <img
                    src={
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=600"
                    }
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=600";
                    }}
                  />
                  <button
                    onClick={(e) => handleCuratedListToggle(e, product)}
                    disabled={curatedListLoading === product._id}
                    className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                      isInCuratedList(product._id)
                        ? "bg-red-500"
                        : "bg-black/50"
                    } ${
                      curatedListLoading === product._id ? "opacity-50" : ""
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isInCuratedList(product._id)
                          ? "text-white fill-current"
                          : "text-white"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    {product.brand?.name || "Unknown Brand"} •{" "}
                    {product.category?.[0]?.name || "Uncategorized"}
                  </p>
                  <p className="text-xs text-gray-300 mb-3 line-clamp-2">
                    {product.description || "No description available"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-yellow-400">
                      {formatPrice(product.price)}
                    </span>
                    <button className="w-10 h-10 flex items-center justify-center bg-yellow-400 text-black rounded-full hover:bg-yellow-300 transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation Spacer */}
      <div className="h-20"></div>

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

export default IconicLookPage;
