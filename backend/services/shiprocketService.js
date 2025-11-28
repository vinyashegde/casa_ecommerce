const axios = require("axios");

// Shiprocket Configuration
const SHIPROCKET_EMAIL =
  process.env.SHIPROCKET_EMAIL || process.env.VITE_SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD =
  process.env.SHIPROCKET_PASSWORD || process.env.VITE_SHIPROCKET_PASSWORD;
const SR_BASE = "https://apiv2.shiprocket.in/v1/external";

// Token management
let cachedToken = null;
let tokenExpiry = null;

/**
 * Login to Shiprocket and get authentication token
 */
async function loginShiprocket() {
  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error("Shiprocket credentials not configured");
  }
  try {
    const response = await axios.post(
      `${SR_BASE}/auth/login`,
      {
        email: SHIPROCKET_EMAIL,
        password: SHIPROCKET_PASSWORD,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    const token = response.data?.token || response.data?.access_token;
    if (!token) {
      throw new Error("No token received from Shiprocket");
    }

    // Cache token with 23 hours validity (conservative approach)
    cachedToken = token;
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours

    console.log("✅ Shiprocket login successful");
    return token;
  } catch (error) {
    console.error(
      "❌ Shiprocket login failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Get valid token (reuse cached one if valid, otherwise login)
 */
async function getValidToken() {
  // Check if cached token is still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  // Try to login and get new token
  try {
    return await loginShiprocket();
  } catch (error) {
    throw error;
  }
}

/**
 * Make authenticated request to Shiprocket API
 */
async function shiprocketRequest(method, endpoint, data = null, params = null) {
  const token = await getValidToken();

  try {
    const response = await axios({
      method,
      url: `${SR_BASE}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      data,
      params,
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.error(`❌ Shiprocket API Error (${method} ${endpoint}):`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

/**
 * Validate Shiprocket token by checking serviceability
 */
async function validateToken(
  pickupPostcode = "110001",
  deliveryPostcode = "400001"
) {
  try {
    const result = await shiprocketRequest(
      "GET",
      "/courier/serviceability/",
      null,
      {
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPostcode,
        weight: "1",
        cod: "0",
      }
    );

    return {
      valid: true,
      data: result,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
}

/**
 * Create order in Shiprocket
 */
async function createOrder(orderData) {
  try {
    const result = await shiprocketRequest(
      "POST",
      "/orders/create/adhoc",
      orderData
    );

    // Extract numeric order ID from response
    const numericId = extractNumericOrderId(result);

    return {
      success: true,
      data: result,
      numericId,
      channelOrderId: orderData.order_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
  }
}

/**
 * Extract numeric order ID from Shiprocket response
 */
function extractNumericOrderId(data) {
  if (!data) return null;

  // Try different possible locations for the numeric ID
  const candidates = [
    data?.order_id,
    data?.id,
    data?.data?.order_id,
    data?.data?.id,
    data?.response?.order_id,
    data?.response?.id,
    data?.orders?.[0]?.order_id,
    data?.orders?.[0]?.id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === "string") {
      const match = candidate.match(/\d{4,}/);
      if (match) {
        const num = Number(match[0]);
        if (Number.isFinite(num)) return num;
      }
    }
  }

  // Deep search in the response object
  try {
    const searchStack = [data];
    while (searchStack.length > 0) {
      const current = searchStack.pop();
      if (!current || typeof current !== "object") continue;

      for (const [key, value] of Object.entries(current)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes("order") && lowerKey.includes("id")) {
          if (typeof value === "number" && Number.isFinite(value)) {
            return value;
          }
          if (typeof value === "string") {
            const match = value.match(/\d{4,}/);
            if (match) {
              const num = Number(match[0]);
              if (Number.isFinite(num)) return num;
            }
          }
        }
        if (value && typeof value === "object") {
          searchStack.push(value);
        }
      }
    }
  } catch (error) {
    console.warn("Error during deep search for order ID:", error);
  }

  return null;
}

/**
 * Get server's public IP address
 */
async function getServerIP() {
  try {
    const response = await axios.get("https://api.ipify.org?format=json", {
      timeout: 15000,
    });
    return response.data.ip;
  } catch (error) {
    throw new Error("Unable to resolve server IP");
  }
}

module.exports = {
  loginShiprocket,
  getValidToken,
  shiprocketRequest,
  validateToken,
  createOrder,
  extractNumericOrderId,
  getServerIP,
};
