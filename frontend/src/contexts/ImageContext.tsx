import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { imageService, StaticImage } from "../services/imageService";

interface ImageContextType {
  // State
  images: StaticImage[];
  loading: boolean;
  error: string | null;

  // Featured images by category
  featuredTrendImage: StaticImage | null;
  featuredHeroImage: StaticImage | null;
  featuredProductImage: StaticImage | null;
  featuredBrandImage: StaticImage | null;
  featuredUIImage: StaticImage | null;

  // Category-specific images
  trendImages: StaticImage[];
  heroImages: StaticImage[];
  productImages: StaticImage[];
  brandImages: StaticImage[];
  uiImages: StaticImage[];

  // Actions
  refreshImages: () => Promise<void>;
  getImagesByCategory: (
    category: string,
    device?: string
  ) => Promise<StaticImage[]>;
  getRandomImage: (
    category: string,
    device?: string
  ) => Promise<StaticImage | null>;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

interface ImageProviderProps {
  children: ReactNode;
}

export const ImageProvider: React.FC<ImageProviderProps> = ({ children }) => {
  const [images, setImages] = useState<StaticImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Featured images
  const [featuredTrendImage, setFeaturedTrendImage] =
    useState<StaticImage | null>(null);
  const [featuredHeroImage, setFeaturedHeroImage] =
    useState<StaticImage | null>(null);
  const [featuredProductImage, setFeaturedProductImage] =
    useState<StaticImage | null>(null);
  const [featuredBrandImage, setFeaturedBrandImage] =
    useState<StaticImage | null>(null);
  const [featuredUIImage, setFeaturedUIImage] = useState<StaticImage | null>(
    null
  );

  // Category-specific images
  const [trendImages, setTrendImages] = useState<StaticImage[]>([]);
  const [heroImages, setHeroImages] = useState<StaticImage[]>([]);
  const [productImages, setProductImages] = useState<StaticImage[]>([]);
  const [brandImages, setBrandImages] = useState<StaticImage[]>([]);
  const [uiImages, setUiImages] = useState<StaticImage[]>([]);

  const loadAllImages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all images
      const allImages = await imageService.getAllImages();
      setImages(allImages);

      // Load featured images
      const [trendImg, heroImg, productImg, brandImg, uiImg] =
        await Promise.all([
          imageService.getFeaturedTrendImage(),
          imageService.getRandomImage("hero"),
          imageService.getRandomImage("products"),
          imageService.getRandomImage("brands"),
          imageService.getRandomImage("ui"),
        ]);

      setFeaturedTrendImage(trendImg);
      setFeaturedHeroImage(heroImg);
      setFeaturedProductImage(productImg);
      setFeaturedBrandImage(brandImg);
      setFeaturedUIImage(uiImg);

      // Load category-specific images
      const [trends, heroes, products, brands, uis] = await Promise.all([
        imageService.getTrendsImages(),
        imageService.getHeroImages(),
        imageService.getProductImages(),
        imageService.getBrandImages(),
        imageService.getUIImages(),
      ]);

      setTrendImages(trends);
      setHeroImages(heroes);
      setProductImages(products);
      setBrandImages(brands);
      setUiImages(uis);
    } catch (err) {
      console.error("Error loading images:", err);
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const refreshImages = async () => {
    await loadAllImages();
  };

  const getImagesByCategory = async (
    category: string,
    device?: string
  ): Promise<StaticImage[]> => {
    try {
      return await imageService.getImagesByCategory(category, device);
    } catch (err) {
      console.error(`Error fetching ${category} images:`, err);
      return [];
    }
  };

  const getRandomImage = async (
    category: string,
    device?: string
  ): Promise<StaticImage | null> => {
    try {
      return await imageService.getRandomImage(category, device);
    } catch (err) {
      console.error(`Error fetching random ${category} image:`, err);
      return null;
    }
  };

  // Load images on mount
  useEffect(() => {
    loadAllImages();
  }, []);

  const value: ImageContextType = {
    // State
    images,
    loading,
    error,

    // Featured images
    featuredTrendImage,
    featuredHeroImage,
    featuredProductImage,
    featuredBrandImage,
    featuredUIImage,

    // Category images
    trendImages,
    heroImages,
    productImages,
    brandImages,
    uiImages,

    // Actions
    refreshImages,
    getImagesByCategory,
    getRandomImage,
  };

  return (
    <ImageContext.Provider value={value}>{children}</ImageContext.Provider>
  );
};

export const useImages = (): ImageContextType => {
  const context = useContext(ImageContext);
  if (context === undefined) {
    throw new Error("useImages must be used within an ImageProvider");
  }
  return context;
};

export default ImageContext;


