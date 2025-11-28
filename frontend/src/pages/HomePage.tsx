import React, { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";

import { TrendingUp, Flame, Star, Crown } from "lucide-react";

import axios from "axios";

import Footer from "../components/Footer";

import Slider from "../components/Slider";

import CategoryCard from "../components/CategoryCard";
import { CategorySlider } from "../components/CategorySlider";

import TrendingProductCard from "../components/TrendingProductCard";

import OfferSection from "../components/OfferSection";

import { getTrendingProducts, TrendingProduct } from "../utils/analytics";

import { HeroSection } from "../components/feature-carousel";

import DynamicImage from "../components/DynamicImage";

interface Brand {
  _id: string;

  name: string;

  logo_url?: string;

  is_active: boolean;

  created_at?: string;
}

interface Category {
  _id: string;

  name: string;

  image: string;

  parentCategory?: string | null;

  productCount?: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedGender, setSelectedGender] = useState<
    "MAN" | "WOMAN" | "UNISEX"
  >("MAN");

  const [allBrands, setAllBrands] = useState<Brand[]>([]);

  const [loadingBrands, setLoadingBrands] = useState(true);

  const [loadingCategories, setLoadingCategories] = useState(true);


  const [womenCategories, setWomenCategories] = useState<Category[]>([]);

  const [menCategories, setMenCategories] = useState<Category[]>([]);

  const [unisexCategories, setUnisexCategories] = useState<Category[]>([]);

  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>(
    []
  );

  const [loadingTrending, setLoadingTrending] = useState(false);

  const currentCategories =
    selectedGender === "MAN"
      ? menCategories
      : selectedGender === "WOMAN"
      ? womenCategories
      : unisexCategories;

  // Enhanced carousel items with dynamic images

  const carouselItems = [
    {
      id: "mvp-image",

      title: "MVP COLLECTION",

      subtitle: "Premium Fashion Experience",

      imageTag: "hero-banner",

      fallbackImage:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNGw02OwbM1W9UK313RgYEgg10vGM-XtKHmw&s",

      buttonText: "Explore Now",

      gradient: "from-purple-600 to-pink-600",

      onClick: () => navigate("/collection"),
    },

    {
      id: "flash-sale",

      title: "FLASH SALE",

      subtitle: "Up to 80% OFF on Premium Brands",

      imageTag: "flash-sale-banner",

      fallbackImage:
        "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=800",

      buttonText: "Shop Now",

      gradient: "from-red-600 to-orange-600",

      onClick: () => navigate("/flash-sale"),
    },

    {
      id: "new-arrivals",

      title: "NEW DROPS",

      subtitle: "Fresh styles just landed",

      imageTag: "new-arrivals-banner",

      fallbackImage:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=800",

      buttonText: "Explore",

      gradient: "from-blue-600 to-indigo-600",

      onClick: () => navigate("/new-arrivals"),
    },

    {
      id: "exclusive",

      title: "EXCLUSIVE",

      subtitle: "Members only collection",

      imageTag: "exclusive-banner",

      fallbackImage:
        "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800",

      buttonText: "Join Now",

      gradient: "from-emerald-600 to-teal-600",

      onClick: () => navigate("/exclusive"),
    },
  ];

  // Flash Sale Offers with dynamic images

  const flashSaleOffers = [
    {
      id: "mega-sale",

      title: "MEGA SALE",

      subtitle: "Limited Time Only",

      discount: "50% OFF",

      timeLeft: "2h 45m",

      imageTag: "mega-sale-offer",

      fallbackImage:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop&crop=center",

      gradient: "from-red-600 to-orange-600",

      isHot: true,

      onClick: () => navigate("/deals?discount=50"),
    },

    {
      id: "weekend-special",

      title: "WEEKEND SPECIAL",

      subtitle: "Premium Collection",

      discount: "20% OFF",

      timeLeft: "1d 12h",

      imageTag: "weekend-special-offer",

      fallbackImage:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkPtw37ZZjsmnT49uUbOo5ggxvwmNpOx8c2g&s",

      gradient: "from-purple-600 to-indigo-600",

      onClick: () => navigate("/deals?discount=20"),
    },

    {
      id: "clearance",

      title: "CLEARANCE",

      subtitle: "Last chance items",

      discount: "40% OFF",

      imageTag: "clearance-offer",

      fallbackImage:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzCCdS5B4W-1ZXb7n4fiZ_Wka0GxXqm26n2Q&s",

      gradient: "from-pink-600 to-rose-600",

      onClick: () => navigate("/deals?discount=40"),
    },

    {
      id: "bundle-deal",

      title: "BUNDLE DEAL",

      subtitle: "Buy 2 Get 1 Free",

      discount: "30% OFF",

      imageTag: "bundle-deal-offer",

      fallbackImage:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=400&fit=crop&crop=center",

      gradient: "from-green-600 to-emerald-600",

      onClick: () => navigate("/deals?discount=30"),
    },
  ];

  // Special Collection Offers with dynamic images

  const specialOffers = [
    {
      id: "premium-collection",

      title: "PREMIUM",

      subtitle: "Luxury brands only",

      discount: "₹2,999",

      imageTag: "premium-collection-offer",

      fallbackImage:
        "https://images.unsplash.com/photo-1556821840-3a9c6044c9df?w=600&h=400&fit=crop&crop=center",

      gradient: "from-amber-600 to-yellow-600",

      onClick: () => navigate("/special-offers?maxPrice=2999"),
    },

    {
      id: "trendy-picks",

      title: "TRENDY PICKS",

      subtitle: "Curated by stylists",

      discount: "From ₹799",

      imageTag: "trendy-picks-offer",

      fallbackImage:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=400&fit=crop&crop=center",

      gradient: "from-cyan-600 to-blue-600",

      onClick: () => navigate("/special-offers?minPrice=799"),
    },
  ];

  // Iconic Looks data with dynamic images

  const menIconicLooks = [
    {
      id: "streetwear",

      label: "Streetwear",

      imageTag: "men-streetwear-look",

      fallbackImage:
        "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400",
    },

    {
      id: "formal",

      label: "Smart Casual",

      imageTag: "men-formal-look",

      fallbackImage:
        "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400",
    },

    {
      id: "casual",

      label: "Weekend Warrior",

      imageTag: "men-casual-look",

      fallbackImage:
        "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
  ];

  const womenIconicLooks = [
    {
      id: "elegant",

      label: "Elegant Queen",

      imageTag: "women-elegant-look",

      fallbackImage:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
    },

    {
      id: "casual-women",

      label: "Weekend Vibes",

      imageTag: "women-casual-look",

      fallbackImage:
        "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400",
    },

    {
      id: "party",

      label: "Party Ready",

      imageTag: "women-party-look",

      fallbackImage:
        "https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
  ];

  const currentIconicLooks =
    selectedGender === "MAN" ? menIconicLooks : womenIconicLooks;

  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);

      try {
        const response = await axios.get(
          import.meta.env.VITE_API_URL + "/brands"
        );

        const allData: Brand[] = response.data;

        const activeAllBrands = allData.filter((brand) => brand.is_active);

        setAllBrands(activeAllBrands);
      } catch (error) {
        console.error("Error fetching brands:", error);

        setAllBrands([]);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);

      try {
        const [menResponse, womenResponse, unisexResponse] = await Promise.all([
          axios.get(import.meta.env.VITE_API_URL + "/categories/gender/male"),

          axios.get(import.meta.env.VITE_API_URL + "/categories/gender/female"),

          axios.get(import.meta.env.VITE_API_URL + "/categories/gender/unisex"),
        ]);

        const menSubcategories = menResponse.data.slice(0, 4);

        const womenSubcategories = womenResponse.data.slice(0, 4);

        const unisexSubcategories = unisexResponse.data.slice(0, 4);

        setMenCategories(menSubcategories);

        setWomenCategories(womenSubcategories);

        setUnisexCategories(unisexSubcategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);

        setMenCategories([]);

        setWomenCategories([]);

        setUnisexCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      setLoadingTrending(true);

      try {
        const response = await getTrendingProducts(
          selectedGender === "MAN" ? "M" : "W",

          "7d",

          8
        );

        setTrendingProducts(response.data.trendingProducts || []);
      } catch (error) {
        console.error("Failed to fetch trending products:", error);

        setTrendingProducts([]);
      } finally {
        setLoadingTrending(false);
      }
    };

    fetchTrendingProducts();
  }, [selectedGender]);

  const handleBrandClick = (brandId: string) => {
    navigate(`/brands/${brandId}`);
  };

  const handleGenderChange = (gender: "MAN" | "WOMAN" | "UNISEX") => {
    setSelectedGender(gender);

    requestAnimationFrame(() => {
      const categoriesSection = document.querySelector(
        '[data-section="categories"]'
      );

      if (categoriesSection) {
        categoriesSection.scrollIntoView({
          behavior: "smooth",

          block: "start",
        });
      }
    });
  };

  const mergedCategories = currentCategories

    .map((category) => ({
      id: category._id,

      name: category.name,

      image: category.image || "https://via.placeholder.com/150",
    }))

    .filter((cat) => cat.name);

  // For animated lines

  const leftLineRef = useRef<HTMLSpanElement>(null);

  const rightLineRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (leftLineRef.current) {
      leftLineRef.current.style.width = "0px";

      setTimeout(() => {
        leftLineRef.current!.style.transition =
          "width 0.7s cubic-bezier(0.4,0,0.2,1)";

        leftLineRef.current!.style.width = "2rem";
      }, 100);
    }

    if (rightLineRef.current) {
      rightLineRef.current.style.width = "0px";

      setTimeout(() => {
        rightLineRef.current!.style.transition =
          "width 0.7s cubic-bezier(0.4,0,0.2,1)";

        rightLineRef.current!.style.width = "2rem";
      }, 300);
    }
  }, [selectedGender]);

  return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-950 to-blue-950 text-white pb-10">
      {/* Enhanced Header Section */}

      <div className="relative overflow-hidden">
        {/* Background Pattern */}

        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full bg-repeat opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m40 80c22.091 0 40-17.909 40-40s-17.909-40-40-40-40 17.909-40 40 17.909 40 40 40zm0-75c19.33 0 35 15.67 35 35s-15.67 35-35 35-35-15.67-35-35 15.67-35 35-35z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full pt-8">
          {/* Enhanced Gender Toggle */}

          <div className="flex space-x-2 mb-8 p-1 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
            {[
              {
                key: "MAN" as const,
                label: "MEN",
                gradient: "from-blue-600 to-blue-500",
                color: "blue",
              },

              {
                key: "WOMAN" as const,
                label: "WOMEN",
                gradient: "from-pink-600 to-pink-500",
                color: "pink",
              },

              {
                key: "UNISEX" as const,
                label: "UNISEX",
                gradient: "from-purple-600 to-purple-500",
                color: "purple",
              },
            ].map(({ key, label, gradient }) => (
            <button
                key={key}
                onClick={() => handleGenderChange(key)}
                className={`relative flex items-center px-6 py-3 rounded-xl font-bold text-sm transition-all duration-500 transform ${
                  selectedGender === key
                    ? `bg-gradient-to-r ${gradient} text-white shadow-xl scale-105`
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <span className="relative z-10 tracking-wider">{label}</span>

                {selectedGender === key && (
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${gradient} opacity-20 animate-pulse`}
                  />
                )}
            </button>
            ))}
          </div>

          {/* Enhanced Brand Header */}

          <div className="flex flex-col items-center w-full animate-fade-in-up">
            <div className="flex items-center w-full justify-center mb-2">
              <span
                ref={leftLineRef}
                className="h-0.5 bg-gradient-to-r from-transparent to-gray-500 rounded-full mr-3 transition-all duration-700"
                style={{ width: "2rem", display: "inline-block" }}
              />

              <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">
                ◆ Certified Premium ◆
              </span>

              <span
                ref={rightLineRef}
                className="h-0.5 bg-gradient-to-l from-transparent to-gray-500 rounded-full ml-3 transition-all duration-700"
                style={{ width: "2rem", display: "inline-block" }}
              />
            </div>

            <div className="flex items-center">
              <span
                className={`text-4xl font-black bg-clip-text text-transparent animate-gradient-x drop-shadow-2xl mr-1 tracking-tighter ${
                  selectedGender === "MAN"
                    ? "bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400"
                    : selectedGender === "WOMAN"
                    ? "bg-gradient-to-r from-pink-400 via-pink-300 to-rose-400"
                    : "bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-400"
                }`}
              >
                DRIP
              </span>

              <span className="text-4xl font-black text-white drop-shadow-2xl tracking-tighter">
                STER
              </span>
            </div>

            <p className="text-gray-400 text-sm mt-2 font-medium">
              Where Fashion Meets Technology
            </p>
          </div>
        </div>
      </div>

      {/* Infinite Carousel - MVP Feature */}

      {/* <div className="px-4 mb-12">

        <InfiniteCarousel 

          items={carouselItems}

          autoScrollInterval={2000}

          showDots={false}

          showArrows={false}

        />

      </div> */}

      <div className="px-4 mb-8">
        <HeroSection
          images={carouselItems.map((item) => ({
            src: item.fallbackImage,
            alt: item.title,
            tag: item.imageTag,
          }))}
        />
      </div>

      {/* Flash Sale Section */}

      <OfferSection
        title="🔥 Flash Sale"
        offers={flashSaleOffers}
        icon={<Flame className="text-red-500" />}
      />

        {/* Categories Section */}

      <div className="px-4 mb-6" data-section="categories">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 drop-shadow">
            {selectedGender === "MAN"
              ? "Men's"
              : selectedGender === "WOMAN"
              ? "Women's"
              : "Unisex"}{" "}
            Categories
          </h2>

          <button
            onClick={() => {
              let mappedGender = "";

              if (selectedGender === "MAN") {
                mappedGender = "MALE";
              } else if (selectedGender === "WOMAN") {
                mappedGender = "FEMALE";
              } else if (selectedGender === "UNISEX") {
                mappedGender = "UNISEX";
              }

              navigate(`/collection?gender=${mappedGender.toLowerCase()}`);
            }}
            className="group flex items-center space-x-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-blue-900/20 border border-blue-400/30 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/20"
          >
            <span>View All</span>

            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </button>
        </div>

          {loadingCategories ? (
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                className="bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 animate-pulse border border-gray-700/50 h-32"
              />
              ))}
            </div>
          ) : mergedCategories.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-3xl border border-gray-700/50">
            <p className="text-gray-400 mb-2 font-medium">
                No categories found for{" "}
                {selectedGender === "MAN"
                  ? "Men's"
                  : selectedGender === "WOMAN"
                  ? "Women's"
                  : "Unisex"}{" "}
                section.
              </p>

              <p className="text-sm text-gray-500">
              Categories will appear here once products are added to the
              database.
              </p>
            </div>
        ) : selectedGender === "MAN" ? (
          // Use CategorySlider for Men's section
          <CategorySlider
            categories={mergedCategories}
            onCategoryClick={(categoryId, categoryName) =>
              navigate(
                `/products/${categoryId}?name=${encodeURIComponent(categoryName)}`
              )
            }
          />
        ) : (
          // Keep grid layout for Women's and Unisex sections
          <div className="grid grid-cols-2 gap-6 transition-all duration-500">
              {mergedCategories.map((category) => (
              <CategoryCard
                  key={category.id}
                id={category.id}
                name={category.name}
                image={category.image}
                  onClick={() =>
                    navigate(
                      `/products/${category.id}?name=${encodeURIComponent(
                        category.name
                      )}`
                    )
                  }
              />
              ))}
            </div>
          )}
        </div>

      {/* Special Collections */}

      <OfferSection
        title="✨ Special Collections"
        offers={specialOffers}
        icon={<Crown className="text-yellow-500" />}
      />

        {/* Iconic Looks Section */}

      <div className="px-4 mb-12">
        <div className="flex items-center mb-8">
          <Star className="text-yellow-400 mr-3" size={24} />

          <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 drop-shadow">
            {selectedGender === "MAN" ? "Men's" : "Women's"} Iconic Looks
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {currentIconicLooks.map((look, index) => (
              <button
                key={look.id}
                onClick={() => navigate(`/look/${look.id}`)}
              className="group relative rounded-3xl overflow-hidden h-40 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20 border border-gray-700/50 hover:border-yellow-400/50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <DynamicImage
                tag={look.imageTag}
                fallbackSrc={look.fallbackImage}
                alt={look.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                objectFit="cover"
                priority={index < 2}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/50 transition-all duration-300">
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-bold text-sm tracking-wide drop-shadow-lg text-center">
                    {look.label}
                  </p>
                </div>
              </div>

              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              </button>
            ))}
          </div>
        </div>

        {/* Trending Products Section */}

      <div className="px-4 mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <TrendingUp className="text-red-400 mr-3" size={24} />

            <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 drop-shadow">
              Trending Products
            </h2>
          </div>

            <button
              onClick={() => navigate("/trends")}
            className="group flex items-center space-x-2 text-red-300 hover:text-red-200 font-bold text-sm px-4 py-2 rounded-xl border border-red-300/30 hover:border-red-200/50 hover:bg-red-500/10 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
            >
              <span>Show More</span>

            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
            </button>
          </div>

          {loadingTrending ? (
          <div className="flex space-x-6 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-60 h-80 bg-gray-800/60 rounded-3xl animate-pulse"
              />
            ))}
          </div>
          ) : trendingProducts.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-3xl border border-gray-700/50">
            <p className="text-gray-400 font-medium">
              No trending products found.
            </p>
          </div>
        ) : (
          <Slider
            itemWidth={260}
            gap={20}
            showArrows={true}
            autoScroll={true}
            autoScrollInterval={4000}
              >
                {trendingProducts.map((trendingProduct) => (
              <TrendingProductCard
                    key={trendingProduct._id}
                trendingProduct={trendingProduct}
                    onClick={() =>
                      navigate(`/product/${trendingProduct.product._id}`)
                    }
              />
            ))}
          </Slider>
          )}
        </div>

      {/* All Brands Infinite Slider */}

      <div className="px-4 mb-12">
        <div className="flex items-center justify-center mb-8">
          <Crown className="text-blue-400 mr-3" size={24} />

          <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 drop-shadow">
            Our Brands
          </h2>
                </div>

          {loadingBrands ? (
          <div className="flex space-x-8 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col items-center flex-shrink-0"
              >
                <div className="w-28 h-28 rounded-full bg-gray-800 animate-pulse mb-4" />

                <div className="h-4 w-20 bg-gray-800 rounded animate-pulse" />
                  </div>
              ))}
            </div>
          ) : allBrands.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-3xl border border-gray-700/50">
            <p className="text-gray-400 font-medium">No brands found.</p>
          </div>
        ) : (
          <Slider
            itemWidth={112}
            gap={32}
            showArrows={false}
            autoScroll={true}
            autoScrollInterval={3000}
          >
            {allBrands.map((brand, index) => (
                <button
                  key={brand._id}
                  onClick={() => handleBrandClick(brand._id)}
                className="group flex flex-col items-center focus:outline-none flex-shrink-0"
                style={{ animationDelay: `${index * 100}ms` }}
                >
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-2xl border-4 border-gray-700 group-hover:border-blue-400 transition-all duration-500 group-hover:scale-110 group-hover:shadow-blue-400/40 overflow-hidden mt-2">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                      className="w-20 h-20 object-contain rounded-full transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                    <span className="text-2xl font-black text-white/80 transition-colors duration-300 group-hover:text-blue-300">
                        {brand.name

                          .split(" ")

                          .map((w) => w[0])

                          .join("")

                          .slice(0, 2)}
                      </span>
                    )}

                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  </div>

                <p className="mt-4 text-lg font-bold text-white text-center group-hover:text-blue-300 transition-colors duration-300 tracking-wide w-32 truncate">
                    {brand.name}
                  </p>
                </button>
              ))}
          </Slider>
          )}
        </div>

      <Footer phone="+1 (403) 921-0657" email="casa234@gmail.com" />
              </div>
  );
};

export default HomePage;
