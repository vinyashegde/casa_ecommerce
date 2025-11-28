/**
 * Image Management Integration Examples
 * Shows how to integrate dynamic image management into existing pages
 */

import React from "react";
import DynamicImage, { DynamicImageGallery } from "../components/DynamicImage";
import {
  useCurrentImage,
  useSeasonalImages,
  useCampaignImages,
} from "../hooks/useImageManagement";

// Example 1: Hero Banner Integration
export const HeroBannerExample: React.FC = () => {
  const { image, loading, error } = useCurrentImage("hero-banner");

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-200 animate-pulse flex items-center justify-center">
        <div className="text-gray-400">Loading hero banner...</div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="w-full h-96 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Our Store</h1>
          <p className="text-xl">Discover amazing products</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 overflow-hidden">
      <DynamicImage
        tag="hero-banner"
        className="w-full h-full object-cover"
        alt="Hero banner"
        priority={true}
      />
      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-4">
            {image.metadata?.eventName || "Welcome"}
          </h1>
          <p className="text-xl">{image.description}</p>
        </div>
      </div>
    </div>
  );
};

// Example 2: Seasonal Promotions
export const SeasonalPromotionsExample: React.FC = () => {
  const { images, loading, error } = useSeasonalImages();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-48 bg-gray-200 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (error || images.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No seasonal promotions available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {images.map((image) => (
        <div key={image._id} className="relative group cursor-pointer">
          <DynamicImage
            tag={image.tag}
            className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
            alt={image.altText || image.name}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 rounded-b-lg">
            <h3 className="text-white font-semibold">{image.name}</h3>
            {image.metadata?.eventName && (
              <p className="text-white/80 text-sm">
                {image.metadata.eventName}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Example 3: Campaign Integration
export const CampaignExample: React.FC<{ campaignId: string }> = ({
  campaignId,
}) => {
  const { images, loading, error } = useCampaignImages(campaignId);

  if (loading) {
    return (
      <div className="flex space-x-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="w-64 h-40 bg-gray-200 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (error || images.length === 0) {
    return null;
  }

  return (
    <div className="flex space-x-4 overflow-x-auto">
      {images.map((image) => (
        <div key={image._id} className="flex-shrink-0">
          <DynamicImage
            tag={image.tag}
            className="w-64 h-40 object-cover rounded-lg"
            alt={image.altText || image.name}
          />
        </div>
      ))}
    </div>
  );
};

// Example 4: Product Category Banners
export const CategoryBannerExample: React.FC<{ category: string }> = ({
  category,
}) => {
  return (
    <div className="relative mb-8">
      <DynamicImage
        tag={`category-${category}`}
        className="w-full h-32 object-cover rounded-lg"
        alt={`${category} category banner`}
        fallbackSrc={`https://via.placeholder.com/800x200?text=${category}+Category`}
        loadingComponent={
          <div className="w-full h-32 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
            <div className="text-gray-400">Loading {category} banner...</div>
          </div>
        }
        errorComponent={
          <div className="w-full h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-gray-500">{category} Category</div>
          </div>
        }
      />
    </div>
  );
};

// Example 5: Footer/Header Images
export const HeaderLogoExample: React.FC = () => {
  return (
    <DynamicImage
      tag="header-logo"
      className="h-8 w-auto"
      alt="Company Logo"
      fallbackSrc="/logo.png"
      priority={true}
    />
  );
};

export const FooterBannerExample: React.FC = () => {
  return (
    <div className="mt-8">
      <DynamicImage
        tag="footer-banner"
        className="w-full h-24 object-cover"
        alt="Footer promotion"
        fallbackSrc="https://via.placeholder.com/800x100?text=Newsletter+Signup"
      />
    </div>
  );
};

// Example 6: Image Gallery with Multiple Images
export const ProductGalleryExample: React.FC<{ productTag: string }> = ({
  productTag,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Product Gallery</h3>
      <DynamicImageGallery
        tag={productTag}
        maxImages={4}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        imageClassName="w-full h-32 object-cover rounded-lg"
        onImageClick={(image, index) => {
          console.log("Clicked image:", image.name, "at index:", index);
        }}
      />
    </div>
  );
};

// Example 7: Responsive Image with Device Detection
export const ResponsiveImageExample: React.FC = () => {
  return (
    <div className="w-full">
      <DynamicImage
        tag="responsive-banner"
        className="w-full h-64 md:h-96 object-cover"
        alt="Responsive banner"
        // Device will be automatically detected by the service
      />
    </div>
  );
};

// Example 8: Preloading Images for Better Performance
export const PreloadExample: React.FC = () => {
  const { preloadImages } = useCurrentImage("hero-banner");

  React.useEffect(() => {
    // Preload important images when component mounts
    preloadImages([
      "hero-banner",
      "category-men",
      "category-women",
      "seasonal-sale",
    ]);
  }, [preloadImages]);

  return (
    <div>
      <p>Images are being preloaded for better performance...</p>
    </div>
  );
};

// Example 9: Integration with Existing Product Page
export const ProductPageIntegrationExample: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroBannerExample />

      {/* Category Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryBannerExample category="men" />
        <CategoryBannerExample category="women" />
      </div>

      {/* Seasonal Promotions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Seasonal Offers</h2>
        <SeasonalPromotionsExample />
      </div>

      {/* Campaign Banners */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Special Campaigns</h2>
        <CampaignExample campaignId="summer2024" />
      </div>

      {/* Footer Banner */}
      <FooterBannerExample />
    </div>
  );
};

export default {
  HeroBannerExample,
  SeasonalPromotionsExample,
  CampaignExample,
  CategoryBannerExample,
  HeaderLogoExample,
  FooterBannerExample,
  ProductGalleryExample,
  ResponsiveImageExample,
  PreloadExample,
  ProductPageIntegrationExample,
};

