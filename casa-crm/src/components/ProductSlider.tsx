import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  product_variants?: ProductVariant[];
  brand: {
    _id: string;
    name: string;
    logo_url: string;
    social_links: string[];
    crm_user_ids: string[];
    is_active: boolean;
    created_at: string;
    __v: number;
  };
  category: Array<{
    _id: string;
    name: string;
    parentCategory: string | null;
    __v: number;
  }>;
  created_at: string;
  updated_at: string;
  __v: number;
}

interface ProductSliderProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string, productName: string) => void;
  formatPrice: (
    price: number | { $numberDecimal: string } | undefined
  ) => string;
}

const ProductSlider: React.FC<ProductSliderProps> = ({
  products,
  onEditProduct,
  onDeleteProduct,
  formatPrice,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const itemsPerSlide = 6;

  // Helper functions for variant handling
  const hasVariants = (product: Product): boolean => {
    return !!(product.product_variants && product.product_variants.length > 0);
  };

  const getEffectiveImages = (product: Product): string[] => {
    // Use variant images if available
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants[0].images || [];
    }
    // Fallback to main product images for backward compatibility
    return product.images || [];
  };

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

  // Calculate total slides
  const totalSlides = Math.ceil(products.length / itemsPerSlide);

  // Handle slide navigation
  const goToSlide = (slideIndex: number) => {
    if (isTransitioning || slideIndex < 0 || slideIndex >= totalSlides) return;

    setIsTransitioning(true);
    setCurrentSlide(slideIndex);

    // Reset transition state after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % totalSlides);
  };

  const prevSlide = () => {
    goToSlide(currentSlide - 1 < 0 ? totalSlides - 1 : currentSlide - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prevSlide();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nextSlide();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, totalSlides]);

  // Auto-play functionality (optional)
  useEffect(() => {
    if (totalSlides <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [currentSlide, totalSlides]);

  // Get products for current slide
  const getCurrentSlideProducts = () => {
    const startIndex = currentSlide * itemsPerSlide;
    const endIndex = startIndex + itemsPerSlide;
    return products.slice(startIndex, endIndex);
  };

  // Fill empty slots with placeholder cards
  const getDisplayProducts = () => {
    const currentProducts = getCurrentSlideProducts();
    const emptySlots = itemsPerSlide - currentProducts.length;

    return [
      ...currentProducts,
      ...Array.from({ length: emptySlots }, (_, index) => ({
        _id: `placeholder-${index}`,
        isPlaceholder: true,
      })),
    ];
  };

  if (products.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="group relative bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 h-64"
            style={{ animationDelay: `${0.7 + index * 0.1}s` }}
          >
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-3">
                <div className="w-8 h-8 bg-indigo-400 rounded-lg"></div>
              </div>
              <h3 className="text-sm font-semibold text-white/50 mb-1">
                No Products Yet
              </h3>
              <p className="text-white/30 text-xs">Add your first product</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Slider Container */}
      <div className="relative overflow-hidden rounded-2xl">
        <div
          ref={sliderRef}
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {Array.from({ length: totalSlides }, (_, slideIndex) => (
            <div key={slideIndex} className="w-full flex-shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-2">
                {products
                  .slice(
                    slideIndex * itemsPerSlide,
                    (slideIndex + 1) * itemsPerSlide
                  )
                  .map((product, index) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onEdit={onEditProduct}
                      onDelete={onDeleteProduct}
                      formatPrice={formatPrice}
                      animationDelay={index * 0.1}
                      hasVariants={hasVariants}
                      getEffectiveImages={getEffectiveImages}
                      getEffectivePrice={getEffectivePrice}
                      getTotalStock={getTotalStock}
                    />
                  ))}
                {/* Fill empty slots with placeholders */}
                {Array.from({
                  length: Math.max(
                    0,
                    itemsPerSlide -
                      products.slice(
                        slideIndex * itemsPerSlide,
                        (slideIndex + 1) * itemsPerSlide
                      ).length
                  ),
                }).map((_, index) => (
                  <div
                    key={`placeholder-${slideIndex}-${index}`}
                    className="group relative bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 h-64"
                    style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                  >
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-3">
                        <div className="w-8 h-8 bg-indigo-400 rounded-lg"></div>
                      </div>
                      <h3 className="text-sm font-semibold text-white/50 mb-1">
                        No Products Yet
                      </h3>
                      <p className="text-white/30 text-xs">
                        Add your first product
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={prevSlide}
            disabled={isTransitioning}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextSlide}
            disabled={isTransitioning}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl group"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalSlides }, (_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 scale-125"
                  : "bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {totalSlides > 1 && (
        <div className="text-center mt-4">
          <span className="text-sm text-white/60">
            {currentSlide + 1} of {totalSlides}
          </span>
        </div>
      )}
    </div>
  );
};

// Individual Product Card Component
const ProductCard: React.FC<{
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string, productName: string) => void;
  formatPrice: (
    price: number | { $numberDecimal: string } | undefined
  ) => string;
  animationDelay: number;
  hasVariants: (product: Product) => boolean;
  getEffectiveImages: (product: Product) => string[];
  getEffectivePrice: (product: Product) => number;
  getTotalStock: (product: Product) => number;
}> = ({
  product,
  onEdit,
  onDelete,
  formatPrice,
  animationDelay,
  hasVariants,
  getEffectiveImages,
  getEffectivePrice,
  getTotalStock,
}) => {
  return (
    <div
      className="group relative bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl h-64"
      style={{ animationDelay: `${0.7 + animationDelay}s` }}
    >
      {/* Product Image */}
      <div className="relative h-3/5 overflow-hidden">
        <img
          src={
            getEffectiveImages(product)[0] ||
            "https://placehold.co/400x400/27272a/ffffff?text=No+Image"
          }
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(product)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Edit Product"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(product._id, product.name)}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Delete Product"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <div
            className={`px-2 py-1 rounded-full text-xs font-bold ${
              product.is_active
                ? "bg-green-500/90 text-white"
                : "bg-red-500/90 text-white"
            }`}
          >
            {product.is_active ? "Active" : "Inactive"}
          </div>
        </div>

        {/* Variant indicator */}
        {hasVariants(product) && (
          <div className="absolute top-2 left-2">
            <div className="px-2 py-1 rounded-full text-xs font-bold bg-blue-500/90 text-white">
              {product.product_variants!.length} Colors
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 h-2/5 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-white text-sm mb-1 line-clamp-2 group-hover:text-blue-300 transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-400 text-xs mb-2 line-clamp-1">
            {product.brand.name}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-white">
              ₹{formatPrice(getEffectivePrice(product))}
            </span>
            {hasVariants(product) && (
              <span className="text-xs text-blue-400 font-medium bg-blue-500/20 px-1.5 py-0.5 rounded">
                Variants
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-400">
              {getTotalStock(product)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSlider;
