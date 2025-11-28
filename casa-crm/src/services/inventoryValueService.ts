import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export interface InventoryValueSummary {
  totalValue: number;
  formattedTotal: string;
  totalProducts: number;
  averageValuePerProduct: number;
  formattedAverageValue: string;
}

export interface ProductValueBreakdown {
  productId: string;
  productName: string;
  brandName: string;
  originalPrice: number;
  stock: number;
  discount: number;
  effectivePrice: number;
  effectiveValue: number;
  appliedOffer: {
    title: string;
    couponCode: string;
    discountType: string;
    discountValue: number;
  } | null;
  formattedOriginalPrice: string;
  formattedEffectivePrice: string;
  formattedEffectiveValue: string;
}

export interface InventoryValueData {
  totalValue: number;
  totalProducts: number;
  breakdown: ProductValueBreakdown[];
  formattedTotal: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

class InventoryValueService {
  /**
   * Get total inventory value summary
   */
  static async getInventorySummary(
    brandId?: string
  ): Promise<InventoryValueSummary> {
    try {
      const params = brandId ? { brandId } : {};
      const response = await axios.get(`${API_URL}/inventory-value/summary`, {
        params,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to fetch inventory summary"
        );
      }
    } catch (error) {
      console.error("Error fetching inventory summary:", error);
      throw new Error("Failed to fetch inventory summary");
    }
  }

  /**
   * Get total inventory value with full breakdown
   */
  static async getTotalInventoryValue(
    brandId?: string
  ): Promise<InventoryValueData> {
    try {
      const params = brandId ? { brandId } : {};
      const response = await axios.get(`${API_URL}/inventory-value/total`, {
        params,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to fetch inventory value"
        );
      }
    } catch (error) {
      console.error("Error fetching inventory value:", error);
      throw new Error("Failed to fetch inventory value");
    }
  }

  /**
   * Get paginated inventory breakdown
   */
  static async getInventoryBreakdown(
    brandId?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<InventoryValueData> {
    try {
      const params = {
        ...(brandId && { brandId }),
        page: page.toString(),
        limit: limit.toString(),
      };
      const response = await axios.get(`${API_URL}/inventory-value/breakdown`, {
        params,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to fetch inventory breakdown"
        );
      }
    } catch (error) {
      console.error("Error fetching inventory breakdown:", error);
      throw new Error("Failed to fetch inventory breakdown");
    }
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    if (amount >= 10000000) {
      // 1 crore and above
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // 1 lakh and above
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      // 1 thousand and above
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${amount.toFixed(0)}`;
    }
  }
}

export default InventoryValueService;
