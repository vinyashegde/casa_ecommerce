import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export interface StaticImage {
  _id: string;
  name: string;
  description: string;
  url: string;
  category: "hero" | "trends" | "products" | "brands" | "ui";
  device: "desktop" | "mobile" | "tablet" | "all";
  position: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaticImagesData {
  metadata: {
    generatedAt: string;
    totalImages: number;
    version: string;
  };
  images: StaticImage[];
  imagesByCategory: {
    hero: StaticImage[];
    trends: StaticImage[];
    products: StaticImage[];
    brands: StaticImage[];
    ui: StaticImage[];
  };
  imagesByDevice: {
    desktop: StaticImage[];
    mobile: StaticImage[];
    tablet: StaticImage[];
    all: StaticImage[];
  };
  categories: string[];
  devices: string[];
}

class OptimizedImageService {
  private staticImagesData: StaticImagesData | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Get static images data with caching
   */
  private async getStaticImagesData(): Promise<StaticImagesData | null> {
    const now = Date.now();

    // Return cached data if it's still fresh
    if (
      this.staticImagesData &&
      now - this.lastFetchTime < this.CACHE_DURATION
    ) {
      return this.staticImagesData;
    }

    try {
      // Try to fetch from static JSON file first (fastest)
      const staticJsonUrl = "/staticImages.json";
      const response = await fetch(staticJsonUrl);

      if (response.ok) {
        this.staticImagesData = await response.json();
        this.lastFetchTime = now;
        console.log("📁 Loaded images from static JSON file");
        return this.staticImagesData;
      }
    } catch (error) {
      console.warn(
        "⚠️ Failed to load from static JSON, trying API fallback:",
        error
      );
    }

    try {
      // Fallback to API endpoint
      const response = await axios.get(
        `${API_BASE_URL}/admin/static-images/static`
      );
      if (response.data.success) {
        // Convert API response to static JSON format
        this.staticImagesData = {
          metadata: {
            generatedAt: response.data.generatedAt || new Date().toISOString(),
            totalImages: response.data.images.length,
            version: "1.0.0",
          },
          images: response.data.images,
          imagesByCategory: this.groupImagesByCategory(response.data.images),
          imagesByDevice: this.groupImagesByDevice(response.data.images),
          categories: ["hero", "trends", "products", "brands", "ui"],
          devices: ["desktop", "mobile", "tablet", "all"],
        };
        this.lastFetchTime = now;
        console.log("🌐 Loaded images from API fallback");
        return this.staticImagesData;
      }
    } catch (error) {
      console.error("❌ Failed to load images from API:", error);
    }

    return null;
  }

  /**
   * Group images by category
   */
  private groupImagesByCategory(images: StaticImage[]) {
    const grouped: any = {
      hero: [],
      trends: [],
      products: [],
      brands: [],
      ui: [],
    };

    images.forEach((image) => {
      if (grouped[image.category]) {
        grouped[image.category].push(image);
      }
    });

    return grouped;
  }

  /**
   * Group images by device
   */
  private groupImagesByDevice(images: StaticImage[]) {
    const grouped: any = {
      desktop: [],
      mobile: [],
      tablet: [],
      all: [],
    };

    images.forEach((image) => {
      if (image.device === "all") {
        grouped.desktop.push(image);
        grouped.mobile.push(image);
        grouped.tablet.push(image);
        grouped.all.push(image);
      } else if (grouped[image.device]) {
        grouped[image.device].push(image);
        grouped.all.push(image);
      }
    });

    return grouped;
  }

  /**
   * Get all active images with filtering
   */
  async getAllImages(filters?: {
    category?: string;
    device?: string;
    search?: string;
    limit?: number;
  }): Promise<StaticImage[]> {
    const data = await this.getStaticImagesData();
    if (!data) return [];

    let images = data.images;

    // Filter by category
    if (filters?.category && filters.category !== "all") {
      images = data.imagesByCategory[filters.category] || [];
    }

    // Filter by device
    if (filters?.device && filters.device !== "all") {
      images = images.filter(
        (img) => img.device === filters.device || img.device === "all"
      );
    }

    // Filter by search term
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      images = images.filter(
        (img) =>
          img.name.toLowerCase().includes(searchTerm) ||
          img.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply limit
    if (filters?.limit) {
      images = images.slice(0, filters.limit);
    }

    return images;
  }

  /**
   * Get images by category
   */
  async getImagesByCategory(
    category: string,
    device?: string
  ): Promise<StaticImage[]> {
    const data = await this.getStaticImagesData();
    if (!data) return [];

    let images = data.imagesByCategory[category] || [];

    // Filter by device
    if (device && device !== "all") {
      images = images.filter(
        (img) => img.device === device || img.device === "all"
      );
    }

    return images;
  }

  /**
   * Get images for trends page
   */
  async getTrendsImages(
    device: "desktop" | "mobile" | "tablet" | "all" = "all"
  ): Promise<StaticImage[]> {
    return this.getImagesByCategory("trends", device);
  }

  /**
   * Get images for hero section
   */
  async getHeroImages(
    device: "desktop" | "mobile" | "tablet" | "all" = "all"
  ): Promise<StaticImage[]> {
    return this.getImagesByCategory("hero", device);
  }

  /**
   * Get images for products
   */
  async getProductImages(
    device: "desktop" | "mobile" | "tablet" | "all" = "all"
  ): Promise<StaticImage[]> {
    return this.getImagesByCategory("products", device);
  }

  /**
   * Get images for brands
   */
  async getBrandImages(
    device: "desktop" | "mobile" | "tablet" | "all" = "all"
  ): Promise<StaticImage[]> {
    return this.getImagesByCategory("brands", device);
  }

  /**
   * Get images for UI elements
   */
  async getUIImages(
    device: "desktop" | "mobile" | "tablet" | "all" = "all"
  ): Promise<StaticImage[]> {
    return this.getImagesByCategory("ui", device);
  }

  /**
   * Get random image from category
   */
  async getRandomImage(
    category: string,
    device: "desktop" | "mobile" | "tablet" | "all" = "all"
  ): Promise<StaticImage | null> {
    try {
      const images = await this.getImagesByCategory(category, device);
      if (images.length === 0) return null;

      const randomIndex = Math.floor(Math.random() * images.length);
      return images[randomIndex];
    } catch (error) {
      console.error("Error fetching random image:", error);
      return null;
    }
  }

  /**
   * Get featured image for trends (first active image)
   */
  async getFeaturedTrendImage(
    device: "desktop" | "mobile" | "tablet" | "all" = "all"
  ): Promise<StaticImage | null> {
    try {
      const images = await this.getTrendsImages(device);
      return images.length > 0 ? images[0] : null;
    } catch (error) {
      console.error("Error fetching featured trend image:", error);
      return null;
    }
  }

  /**
   * Get image statistics
   */
  async getImageStats(): Promise<{
    totalImages: number;
    imagesByCategory: { [key: string]: number };
    imagesByDevice: { [key: string]: number };
    lastUpdated: string;
  } | null> {
    const data = await this.getStaticImagesData();
    if (!data) return null;

    const stats = {
      totalImages: data.metadata.totalImages,
      imagesByCategory: Object.keys(data.imagesByCategory).reduce(
        (acc, category) => {
          acc[category] = data.imagesByCategory[category].length;
          return acc;
        },
        {} as { [key: string]: number }
      ),
      imagesByDevice: Object.keys(data.imagesByDevice).reduce((acc, device) => {
        acc[device] = data.imagesByDevice[device].length;
        return acc;
      }, {} as { [key: string]: number }),
      lastUpdated: data.metadata.generatedAt,
    };

    return stats;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.staticImagesData = null;
    this.lastFetchTime = 0;
  }

  /**
   * Check if data is cached and fresh
   */
  isCached(): boolean {
    const now = Date.now();
    return (
      this.staticImagesData !== null &&
      now - this.lastFetchTime < this.CACHE_DURATION
    );
  }
}

export const optimizedImageService = new OptimizedImageService();
export default optimizedImageService;
