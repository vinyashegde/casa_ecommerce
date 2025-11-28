/**
 * Image Management Service
 * Handles dynamic image fetching with caching for frontend consumption
 */

export interface StaticImage {
  _id: string;
  name: string;
  description: string;
  url: string;
  tag: string;
  altText: string;
  category: string;
  device: "desktop" | "mobile" | "tablet" | "all";
  position: string;
  displayPeriod: {
    startDate: string | null;
    endDate: string | null;
  };
  priority: number;
  metadata: {
    eventName?: string;
    campaignId?: string;
    targetAudience?: "all" | "men" | "women" | "kids" | "premium";
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ImageCache {
  data: StaticImage | StaticImage[] | null;
  timestamp: number;
  source: "cache" | "api";
}

interface ApiResponse {
  success: boolean;
  image?: StaticImage;
  images?: StaticImage[];
  source: "cache" | "database";
  error?: string;
}

class ImageManagementService {
  private cache = new Map<string, ImageCache>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  /**
   * Get current active image by tag (optimized for frontend)
   */
  async getCurrentImageByTag(
    tag: string,
    device: string = "all"
  ): Promise<StaticImage | null> {
    const cacheKey = `current:${tag}:${device}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as StaticImage;
    }

    try {
      const response = await fetch(
        `${this.API_BASE_URL}/images/current/${tag}?device=${device}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.image) {
        this.setCache(cacheKey, data.image);
        return data.image;
      }

      return null;
    } catch (error) {
      console.error("Error fetching current image by tag:", error);
      return null;
    }
  }

  /**
   * Get all images by tag
   */
  async getImagesByTag(
    tag: string,
    device: string = "all",
    includeInactive: boolean = false
  ): Promise<StaticImage[]> {
    const cacheKey = `tag:${tag}:${device}:${includeInactive}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as StaticImage[];
    }

    try {
      const response = await fetch(
        `${this.API_BASE_URL}/images/tag/${tag}?device=${device}&includeInactive=${includeInactive}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.images) {
        this.setCache(cacheKey, data.images);
        return data.images;
      }

      return [];
    } catch (error) {
      console.error("Error fetching images by tag:", error);
      return [];
    }
  }

  /**
   * Get images by campaign
   */
  async getImagesByCampaign(
    campaignId: string,
    device: string = "all",
    includeInactive: boolean = false
  ): Promise<StaticImage[]> {
    const cacheKey = `campaign:${campaignId}:${device}:${includeInactive}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as StaticImage[];
    }

    try {
      const response = await fetch(
        `${this.API_BASE_URL}/images/campaign/${campaignId}?device=${device}&includeInactive=${includeInactive}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.images) {
        this.setCache(cacheKey, data.images);
        return data.images;
      }

      return [];
    } catch (error) {
      console.error("Error fetching images by campaign:", error);
      return [];
    }
  }

  /**
   * Get seasonal/event images
   */
  async getSeasonalImages(device: string = "all"): Promise<StaticImage[]> {
    const cacheKey = `seasonal:${device}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as StaticImage[];
    }

    try {
      const response = await fetch(
        `${this.API_BASE_URL}/images/seasonal/all?device=${device}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.images) {
        this.setCache(cacheKey, data.images);
        return data.images;
      }

      return [];
    } catch (error) {
      console.error("Error fetching seasonal images:", error);
      return [];
    }
  }

  /**
   * Get images from static JSON (fallback)
   */
  async getImagesFromStaticJson(
    category?: string,
    device?: string
  ): Promise<StaticImage[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (device) params.append("device", device);

      const response = await fetch(
        `${this.API_BASE_URL}/images/static?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.images) {
        return data.images;
      }

      return [];
    } catch (error) {
      console.error("Error fetching images from static JSON:", error);
      return [];
    }
  }

  /**
   * Get device type based on screen size
   */
  getDeviceType(): string {
    if (typeof window === "undefined") return "all";

    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  /**
   * Check if image is currently active based on display period
   */
  isImageActive(image: StaticImage): boolean {
    if (!image.isActive) return false;

    const now = new Date();
    const startDate = image.displayPeriod?.startDate
      ? new Date(image.displayPeriod.startDate)
      : null;
    const endDate = image.displayPeriod?.endDate
      ? new Date(image.displayPeriod.endDate)
      : null;

    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;

    return true;
  }

  /**
   * Get the best image for a tag (highest priority, currently active)
   */
  async getBestImageForTag(
    tag: string,
    device?: string
  ): Promise<StaticImage | null> {
    const currentDevice = device || this.getDeviceType();
    const images = await this.getImagesByTag(tag, currentDevice);

    if (images.length === 0) return null;

    // Filter active images and sort by priority
    const activeImages = images
      .filter((img) => this.isImageActive(img))
      .sort((a, b) => b.priority - a.priority);

    return activeImages.length > 0 ? activeImages[0] : null;
  }

  /**
   * Preload images for better performance
   */
  async preloadImages(tags: string[], device?: string): Promise<void> {
    const currentDevice = device || this.getDeviceType();

    const promises = tags.map((tag) =>
      this.getCurrentImageByTag(tag, currentDevice).catch((error) => {
        console.warn(`Failed to preload image for tag ${tag}:`, error);
        return null;
      })
    );

    await Promise.all(promises);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Private cache methods
  private getFromCache(key: string): StaticImage | StaticImage[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: StaticImage | StaticImage[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      source: "api",
    });
  }
}

// Create singleton instance
const imageManagementService = new ImageManagementService();

export default imageManagementService;

// Export types for use in components
export type { StaticImage, ApiResponse };
