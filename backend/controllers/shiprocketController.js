const shiprocketService = require("../services/shiprocketService");

// Helper to forward Shiprocket errors with context
function forwardError(res, err) {
  const status = err?.response?.status || 500;
  return res.status(status).json({
    message: err?.response?.data?.message || err?.message || "Shiprocket error",
    status_code: status,
    data: err?.response?.data,
  });
}

// GET /api/shiprocket/validate
// Calls a lightweight serviceability API to validate token and IP permissions
exports.validate = async (req, res) => {
  try {
    const pickupPostcode = req.query.pickup_postcode || "110001";
    const deliveryPostcode = req.query.delivery_postcode || "400001";

    const result = await shiprocketService.validateToken(
      pickupPostcode,
      deliveryPostcode
    );

    if (result.valid) {
      return res.status(200).json({
        success: true,
        message: "Token validation successful",
        data: result.data,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Token validation failed",
        error: result.error,
        status: result.status,
      });
    }
  } catch (err) {
    return forwardError(res, err);
  }
};

// POST /api/shiprocket/orders
// Creates an order via Shiprocket adhoc API
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;

    const result = await shiprocketService.createOrder(orderData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Order created successfully",
        data: result.data,
        numericId: result.numericId,
        channelOrderId: result.channelOrderId,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Order creation failed",
        error: result.error,
        status: result.status,
        data: result.data,
      });
    }
  } catch (err) {
    return forwardError(res, err);
  }
};

// GET /api/shiprocket/my-ip - returns server public IP (for Shiprocket whitelisting)
exports.myIp = async (req, res) => {
  try {
    const ip = await shiprocketService.getServerIP();
    return res.status(200).json({
      success: true,
      ip,
      message: "Server IP retrieved successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Unable to resolve server IP",
      error: err.message,
    });
  }
};

// POST /api/shiprocket/login - force-refresh token using server-side credentials
exports.login = async (req, res) => {
  try {
    const token = await shiprocketService.loginShiprocket();
    return res.status(200).json({
      success: true,
      token,
      message: "Login successful",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message:
        "Login failed. Configure SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.",
      error: err.message,
    });
  }
};

// POST /api/shiprocket/cancel-order - Cancel a Shiprocket order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const result = await shiprocketService.shiprocketRequest(
      "POST",
      "/orders/cancel/shipment/awbs",
      {
        awbs: [orderId],
      }
    );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: result,
    });
  } catch (err) {
    return forwardError(res, err);
  }
};

// GET /api/shiprocket/test - Comprehensive test endpoint for debugging
exports.test = async (req, res) => {
  const testResults = {
    timestamp: new Date().toISOString(),
    serverIP: null,
    credentials: null,
    login: null,
    tokenValidation: null,
    serviceability: null,
    errors: [],
    summary: "Test completed",
  };

  try {
    // 1. Test server IP resolution
    try {
      testResults.serverIP = await shiprocketService.getServerIP();
    } catch (error) {
      testResults.errors.push(`IP Resolution failed: ${error.message}`);
      console.error("❌ IP Resolution failed:", error.message);
    }

    // 2. Test credentials configuration
    const email =
      process.env.SHIPROCKET_EMAIL || process.env.VITE_SHIPROCKET_EMAIL;
    const password =
      process.env.SHIPROCKET_PASSWORD || process.env.VITE_SHIPROCKET_PASSWORD;

    testResults.credentials = {
      emailConfigured: !!email,
      passwordConfigured: !!password,
      emailValue: email
        ? `${email.substring(0, 3)}***@${email.split("@")[1]}`
        : null,
      passwordLength: password ? password.length : 0,
    };

    if (!email || !password) {
      testResults.errors.push(
        "Missing Shiprocket credentials in environment variables"
      );
      console.error("❌ Missing credentials");
    } else {
      console.log("✅ Credentials configured");
    }

    // 3. Test login
    try {
      const token = await shiprocketService.loginShiprocket();
      testResults.login = {
        success: true,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 10)}...` : null,
      };
      console.log("✅ Login successful");
    } catch (error) {
      testResults.login = {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      };
      testResults.errors.push(`Login failed: ${error.message}`);
      console.error("❌ Login failed:", error.response?.data || error.message);
    }

    // 4. Test token validation (only if login succeeded)
    if (testResults.login.success) {
      try {
        const validation = await shiprocketService.validateToken();
        testResults.tokenValidation = {
          success: validation.valid,
          data: validation.data,
          error: validation.error,
        };
        console.log("✅ Token validation successful");
      } catch (error) {
        testResults.tokenValidation = {
          success: false,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        };
        testResults.errors.push(`Token validation failed: ${error.message}`);
        console.error(
          "❌ Token validation failed:",
          error.response?.data || error.message
        );
      }
    }

    // 5. Test serviceability API (only if login succeeded)
    if (testResults.login.success) {
      try {
        const serviceability = await shiprocketService.shiprocketRequest(
          "GET",
          "/courier/serviceability/",
          null,
          {
            pickup_postcode: "110001",
            delivery_postcode: "400001",
            weight: "1",
            cod: "0",
          }
        );
        testResults.serviceability = {
          success: true,
          data: serviceability,
        };
        console.log("✅ Serviceability test successful");
      } catch (error) {
        testResults.serviceability = {
          success: false,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        };
        testResults.errors.push(`Serviceability test failed: ${error.message}`);
        console.error(
          "❌ Serviceability test failed:",
          error.response?.data || error.message
        );
      }
    }

    // 6. Test order creation with minimal data (only if all previous tests passed)
    if (testResults.login.success && testResults.tokenValidation.success) {
      try {
        const testOrderData = {
          order_id: `TEST_${Date.now()}`,
          order_date: new Date().toISOString(),
          pickup_location: "Primary",
          billing_customer_name: "Test Customer",
          billing_last_name: "User",
          billing_address: "Test Address",
          billing_address_2: "",
          billing_city: "Mumbai",
          billing_pincode: "400001",
          billing_state: "Maharashtra",
          billing_country: "India",
          billing_email: "test@example.com",
          billing_phone: "9876543210",
          shipping_is_billing: true,
          order_items: [
            {
              name: "Test Product",
              sku: "TEST_SKU",
              units: 1,
              selling_price: 100,
            },
          ],
          payment_method: "Prepaid",
          sub_total: 100,
          length: 10,
          breadth: 10,
          height: 10,
          weight: 0.5,
        };

        const orderResult = await shiprocketService.createOrder(testOrderData);
        testResults.orderCreation = {
          success: orderResult.success,
          data: orderResult.data,
          error: orderResult.error,
          status: orderResult.status,
        };

        if (orderResult.success) {
          console.log("✅ Test order creation successful");
        } else {
          console.error("❌ Test order creation failed:", orderResult.error);
          testResults.errors.push(
            `Order creation failed: ${orderResult.error}`
          );
        }
      } catch (error) {
        testResults.orderCreation = {
          success: false,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        };
        testResults.errors.push(`Order creation test failed: ${error.message}`);
        console.error(
          "❌ Order creation test failed:",
          error.response?.data || error.message
        );
      }
    }

    // Determine overall success
    const hasErrors = testResults.errors.length > 0;
    testResults.summary = hasErrors
      ? "Test completed with errors"
      : "All tests passed successfully";

    console.log("🧪 Test completed. Errors:", testResults.errors.length);

    return res.status(hasErrors ? 400 : 200).json({
      success: !hasErrors,
      message: testResults.summary,
      results: testResults,
    });
  } catch (error) {
    console.error("❌ Test endpoint error:", error);
    testResults.errors.push(`Test endpoint error: ${error.message}`);
    testResults.summary = "Test failed with critical error";

    return res.status(500).json({
      success: false,
      message: "Test failed with critical error",
      error: error.message,
      results: testResults,
    });
  }
};

// GET /api/shiprocket/debug - Show configuration without sensitive data
exports.debug = async (req, res) => {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        shiprocketEmailConfigured: !!(
          process.env.SHIPROCKET_EMAIL || process.env.VITE_SHIPROCKET_EMAIL
        ),
        shiprocketPasswordConfigured: !!(
          process.env.SHIPROCKET_PASSWORD ||
          process.env.VITE_SHIPROCKET_PASSWORD
        ),
        shiprocketEmailDomain:
          process.env.SHIPROCKET_EMAIL || process.env.VITE_SHIPROCKET_EMAIL
            ? (
                process.env.SHIPROCKET_EMAIL ||
                process.env.VITE_SHIPROCKET_EMAIL
              ).split("@")[1]
            : null,
        shiprocketPasswordLength:
          process.env.SHIPROCKET_PASSWORD ||
          process.env.VITE_SHIPROCKET_PASSWORD
            ? (
                process.env.SHIPROCKET_PASSWORD ||
                process.env.VITE_SHIPROCKET_PASSWORD
              ).length
            : 0,
      },
      apiEndpoints: {
        baseUrl: "https://apiv2.shiprocket.in/v1/external",
        loginEndpoint: "/auth/login",
        orderEndpoint: "/orders/create/adhoc",
        serviceabilityEndpoint: "/courier/serviceability/",
      },
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
      },
    };

    // Try to get server IP
    try {
      debugInfo.serverIP = await shiprocketService.getServerIP();
    } catch (error) {
      debugInfo.serverIP = "Unable to resolve";
    }

    return res.status(200).json({
      success: true,
      message: "Debug information retrieved",
      data: debugInfo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve debug information",
      error: error.message,
    });
  }
};

// Simple test endpoint for frontend connectivity
exports.testConnection = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Backend connection successful",
      timestamp: new Date().toISOString(),
      headers: req.headers,
      method: req.method,
      url: req.url,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Backend connection failed",
      error: error.message,
    });
  }
};
