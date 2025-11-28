import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Heart, User } from "lucide-react";
import { motion } from "framer-motion";
import LoginPopup from "./LoginPopup";
import { useUser } from "../contexts/UserContext";
import { useCuratedList } from "../contexts/CuratedListContext";

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const { curatedListCount } = useCuratedList();

  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());

  const handleSearch = () => navigate("/search");
  const handleProfile = () => navigate("/profile");
  const handleWishlist = () => navigate("/curatedList");
  const handleCuratedList = () => navigate("/curatedList");

  const loadWishlist = async () => {
    try {
      const userId = userData?._id;
      if (!userId) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/curatedlist/${userId}`
      );
      if (res.ok) {
        const data = await res.json();
        // The API returns a single curated list object with a products array
        if (data && data.products && Array.isArray(data.products)) {
          const ids = data.products.map((product: any) => product._id);
          setWishlistItems(new Set(ids));
        } else {
          // If no products or invalid structure, set empty set
          setWishlistItems(new Set());
        }
      } else if (res.status === 404) {
        // User doesn't have a curated list yet, set empty set
        setWishlistItems(new Set());
      }
    } catch (err) {
      console.error("Error loading wishlist:", err);
      // On error, set empty set to avoid breaking the UI
      setWishlistItems(new Set());
    }
  };

  useEffect(() => {
    if (userData?.isLoggedIn) {
      loadWishlist();
      // ✅ Listen for changes from anywhere in the app
      const handleUpdate = () => {
        loadWishlist();
      };

      window.addEventListener("wishlistUpdated", handleUpdate);

      return () => {
        window.removeEventListener("wishlistUpdated", handleUpdate);
      };
    }
  }, [userData?.isLoggedIn]);

  return (
    <>
      {/* Fixed, centered to phone width */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[413px] pt-[env(safe-area-inset-top)]">
        <header className="bg-gray-900/95 text-white border-b border-gray-800 backdrop-blur supports-[backdrop-filter]:bg-gray-900/70 rounded-b-xl">
          <div className="h-14 px-4 flex items-center justify-between">
            {/* CASA Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-semibold text-white tracking-tight drop-shadow-2xl">
                CASA
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleSearch}
                className="h-10 w-10 grid place-items-center rounded-full hover:bg-white/5 active:bg-white/10"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              <motion.button
                onClick={handleCuratedList}
                className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-white/5 active:bg-white/10"
                aria-label="Curated List"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Heart
                  size={20}
                  className={
                    wishlistItems.size > 0
                      ? "text-red-500 fill-current"
                      : "text-white"
                  }
                />
                {curatedListCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-500 text-[10px] leading-5 text-white text-center"
                  >
                    {curatedListCount > 99 ? "99+" : curatedListCount}
                  </motion.span>
                )}
              </motion.button>

              <button
                onClick={handleProfile}
                className="h-10 w-10 grid place-items-center rounded-full hover:bg-white/5 active:bg-white/10"
                aria-label="Profile"
              >
                <User size={20} />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Hidden by default */}
      <LoginPopup isOpen={false} onClose={() => {}} onContinue={() => {}} />
    </>
  );
};

export default TopBar;
