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

export interface ImageResponse {
  success: boolean;
  images: StaticImage[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalImages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ImageService {
  private baseURL = `${API_BASE_URL}/admin/static-images`;

  /**
   * Get all active images by category
   */
  async getImagesByCategory(
    category: string,
    device?: string
  ): Promise<StaticImage[]> {
    try {
      const params = new URLSearchParams();
      params.append("isActive", "true");
      if (device && device !== "all") {
        params.append("device", device);
      }

      const response = await axios.get(
        `${this.baseURL}/category/${category}?${params}`
      );
      return response.data.images || [];
    } catch (error) {
      console.error(`Error fetching ${category} images:`, error);
      return [];
    }
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
    try {
      const params = new URLSearchParams();
      params.append("isActive", "true");

      if (filters?.category && filters.category !== "all") {
        params.append("category", filters.category);
      }
      if (filters?.device && filters.device !== "all") {
        params.append("device", filters.device);
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }
      if (filters?.limit) {
        params.append("limit", filters.limit.toString());
      }

      const response = await axios.get(`${this.baseURL}?${params}`);
      return response.data.images || [];
    } catch (error) {
      console.error("Error fetching images:", error);
      return [];
    }
  }

  /**
   * Get a single image by ID
   */
  async getImageById(id: string): Promise<StaticImage | null> {
    try {
      const response = await axios.get(`${this.baseURL}/${id}`);
      return response.data.image || null;
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
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
}

export const imageService = new ImageService();
export default imageService;
