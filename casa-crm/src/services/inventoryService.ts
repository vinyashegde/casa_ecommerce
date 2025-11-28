import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export interface InventorySummary {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
  }>;
  outOfStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
  }>;
  lowStockCount: number;
  outOfStockCount: number;
}

/**
 * Response format for stock update operations
 */
export interface StockUpdateResponse {
  success: boolean;
  message: string;
  product?: any;
  stockUpdates?: Array<{
    productId: string;
    productName: string;
    size?: string;
    quantityChanged: number;
    newStock: number;
  }>;
}

/**
 * Product stock information including variants
 */
export interface ProductStockInfo {
  productId: string;
  productName: string;
  currentStock: number;
  size?: string;
  hasVariants: boolean;
  variantStock?: Array<{
    color: string;
    sizes: Array<{
      size: string;
      stock: number;
    }>;
  }>;
}

/**
 * Request format for stock update operations
 */
export interface StockUpdateRequest {
  quantity: number;
  size?: string;
  operation: "add" | "reduce";
}

/**
 * Product stock information for order processing
 */
export interface OrderProductStock {
  productId: string;
  quantity: number;
  size?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class InventoryService {
  /**
   * Get inventory summary for a brand
   */
  static async getInventorySummary(brandId: string): Promise<InventorySummary> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/products/inventory/summary/${brandId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching inventory summary:", error);
      throw new Error(
        (error as ApiError).message || "Failed to fetch inventory summary"
      );
    }
  }

  /**
   * Get stock details for a specific product
   */
  static async getProductStock(
    productId: string,
    size?: string
  ): Promise<ProductStockInfo> {
    try {
      const params = size ? { size } : {};
      const response = await axios.get(
        `${API_BASE_URL}/products/stock/${productId}`,
        {
          params,
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching product stock:", error);
      throw new Error(
        (error as ApiError).message || "Failed to fetch product stock"
      );
    }
  }

  /**
   * Update product stock manually
   */
  static async updateProductStock(
    productId: string,
    stockUpdate: StockUpdateRequest
  ): Promise<StockUpdateResponse> {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/products/stock/${productId}`,
        stockUpdate
      );
      return response.data;
    } catch (error) {
      console.error("Error updating product stock:", error);
      throw new Error(
        (error as ApiError).message || "Failed to update product stock"
      );
    }
  }

  /**
   * Update stock when order is placed
   */
  static async updateStockOnOrder(
    orderId: string,
    products: OrderProductStock[]
  ): Promise<StockUpdateResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/orders/${orderId}/update-stock`,
        { products }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating stock for order:", error);
      throw new Error(
        (error as ApiError).message || "Failed to update stock for order"
      );
    }
  }

  /**
   * Add stock to a product
   */
  static async addStock(
    productId: string,
    quantity: number,
    size?: string
  ): Promise<StockUpdateResponse> {
    this.validateProductId(productId);
    this.validateQuantity(quantity);

    return this.updateProductStock(productId, {
      quantity,
      size,
      operation: "add",
    });
  }

  /**
   * Reduce stock from a product
   */
  static async reduceStock(
    productId: string,
    quantity: number,
    size?: string
  ): Promise<StockUpdateResponse> {
    return this.updateProductStock(productId, {
      quantity,
      size,
      operation: "reduce",
    });
  }

  /**
   * Check if product has sufficient stock
   */
  static async checkStockAvailability(
    productId: string,
    quantity: number,
    size?: string
  ): Promise<boolean> {
    try {
      const stockInfo = await this.getProductStock(productId, size);
      return stockInfo.currentStock >= quantity;
    } catch (error) {
      console.error("Error checking stock availability:", error);
      throw new Error(
        (error as ApiError).message || "Failed to check stock availability"
      );
    }
  }

  /**
   * Get stock alerts for products below threshold
   */
  static async getStockAlerts(
    brandId: string,
    threshold: number = 5
  ): Promise<{
    lowStock: ProductStockInfo[];
    outOfStock: ProductStockInfo[];
  }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/products/stock/alerts/${brandId}`,
        {
          params: { threshold },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
      throw new Error(
        (error as ApiError).message || "Failed to fetch stock alerts"
      );
    }
  }

  /**
   * Reserve stock for a pending order
   */
  static async reserveStock(
    orderId: string,
    products: OrderProductStock[]
  ): Promise<StockUpdateResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/orders/${orderId}/reserve-stock`,
        { products }
      );
      return response.data;
    } catch (error) {
      console.error("Error reserving stock:", error);
      throw new Error((error as ApiError).message || "Failed to reserve stock");
    }
  }

  /**
   * Release reserved stock (e.g., when order is cancelled)
   */
  static async releaseReservedStock(
    orderId: string
  ): Promise<StockUpdateResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/orders/${orderId}/release-stock`
      );
      return response.data;
    } catch (error) {
      console.error("Error releasing reserved stock:", error);
      throw new Error(
        (error as ApiError).message || "Failed to release reserved stock"
      );
    }
  }

  private static validateProductId(productId: string): void {
    if (!productId) {
      throw new Error("Product ID is required");
    }
  }

  private static validateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }
  }
}

export default InventoryService;
