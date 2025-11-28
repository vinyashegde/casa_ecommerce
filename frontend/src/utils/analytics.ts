const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface SwipeData {
  userId: string;
  productId: string;
  action: "like" | "dislike";
  sessionId?: string;
  deviceInfo?: string;
}

export interface TrendingProduct {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: string[];
    price: {
      $numberDecimal: string;
    };
    currency: string;
    brand: {
      _id: string;
      name: string;
    };
    category: Array<{
      _id: string;
      name: string;
    }>;
    tags: string[];
    gender: string;
  };
  likes: number;
  dislikes: number;
  totalSwipes: number;
  engagementScore: number;
  engagementRate: number;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Track user swipe action
export const trackSwipe = async (
  swipeData: SwipeData
): Promise<AnalyticsResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/track-swipe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(swipeData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error tracking swipe:", error);
    throw error;
  }
};

// Get trending products
export const getTrendingProducts = async (
  gender?: "M" | "W",
  timeWindow: "24h" | "7d" | "30d" = "7d",
  limit: number = 20
): Promise<AnalyticsResponse<{ trendingProducts: TrendingProduct[] }>> => {
  try {
    const params = new URLSearchParams({
      timeWindow,
      limit: limit.toString(),
    });

    if (gender) {
      params.append("gender", gender);
    }

    const response = await fetch(
      `${API_BASE_URL}/analytics/trending-products?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching trending products:", error);
    throw error;
  }
};

// Get user swipe history
export const getUserSwipeHistory = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AnalyticsResponse<{ preferences: any[]; totalCount: number }>> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/analytics/user-history/${userId}?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user swipe history:", error);
    throw error;
  }
};

// Get product analytics
export const getProductAnalytics = async (
  productId: string,
  timeWindow: "24h" | "7d" | "30d" = "7d"
): Promise<AnalyticsResponse<any>> => {
  try {
    const params = new URLSearchParams({ timeWindow });

    const response = await fetch(
      `${API_BASE_URL}/analytics/product-analytics/${productId}?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching product analytics:", error);
    throw error;
  }
};

// Get real-time trending products (for immediate updates)
export const getRealTimeTrendingProducts = async (
  gender?: "M" | "W",
  limit: number = 20
): Promise<AnalyticsResponse<{ trendingProducts: TrendingProduct[] }>> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (gender) {
      params.append("gender", gender);
    }

    const response = await fetch(
      `${API_BASE_URL}/analytics/trending-realtime?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching real-time trending products:", error);
    throw error;
  }
};

// Generate session ID for tracking
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get device info for analytics
export const getDeviceInfo = (): string => {
  return navigator.userAgent;
};
