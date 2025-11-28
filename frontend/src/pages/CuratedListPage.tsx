import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import { useCart } from "../contexts/CartContext";
import { useCuratedList } from "../contexts/CuratedListContext";

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
  tags: string[];
}

interface CuratedList {
  _id: string;
  userId: string;
  products: Product[];
  name: string;
  createdAt: string;
}

const CuratedListPage: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const { addToCart } = useCart();
  const { curatedProducts, removeFromCuratedList, clearCuratedList } =
    useCuratedList();
  const [loading, setLoading] = useState(false);

  const handleRemoveFromCuratedList = async (productId: string) => {
    try {
      await removeFromCuratedList(productId);
    } catch (error) {
      console.error("❌ Error removing product:", error);
      // You could show a toast notification here
    }
  };

  const handleClearCuratedList = async () => {
    try {
      await clearCuratedList();
    } catch (error) {
      console.error("❌ Error clearing curated list:", error);
      // You could show a toast notification here
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1, "M"); // Default size M, quantity 1
      // Don't show success alert - the cart context will handle UI updates
    } catch (err) {
      console.error("Error adding to cart:", err);
      // Don't show generic error alert - let the BrandValidationError component handle it
      // The error will be caught by the cart context and displayed properly
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!userData.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Heart size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">
            Sign in to view your curated list
          </h2>
          <p className="text-gray-400 mb-6">
            Save your favorite products and access them anytime
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="sticky top-0 bg-gray-900 z-10 p-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center w-10 h-10"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">My Curated List</h1>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading your curated list...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="sticky top-0 bg-gray-900 z-10 p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center w-10 h-10"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">My Curated List</h1>
        </div>
      </div>

      <div className="p-4">
        {curatedProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={64} className="mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-bold mb-2">
              Your curated list is empty
            </h2>
            <p className="text-gray-400 mb-6">
              Start adding products you love by tapping the heart icon
            </p>
            <button
              onClick={() => navigate("/swipe")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Discover Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {curatedProducts.map((product) => (
              <motion.div
                key={product._id}
                className="bg-gray-800 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <div className="relative">
                  <img
                    src={product.images[0] || "https://via.placeholder.com/200"}
                    alt={product.name}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => navigate(`/product/${product._id}`)}
                  />
                  <button
                    onClick={() => handleRemoveFromCuratedList(product._id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center w-8 h-8"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">
                    {product.brand.name}
                  </p>
                  <p className="font-bold mb-3">₹{product.price}</p>
                  <button
                    onClick={() => handleAddToCart(product._id)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CuratedListPage;
