/**
 * Manual API Testing Script for Inventory Service
 *
 * Run this script to manually test the inventory API endpoints
 * Make sure your server is running on localhost:5000 before running this
 */

const axios = require("axios");

// Configuration
const API_BASE = "http://localhost:5000/api";
const TEST_EMAIL = "test-inventory@example.com";

// Test data - you'll need to replace these with actual product IDs from your database
const TEST_PRODUCT_ID = "507f1f77bcf86cd799439011"; // Replace with actual product ID
const TEST_SIZE = "M";

class APITester {
  constructor() {
    this.results = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const emoji = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    console.log(`${emoji} [${timestamp}] ${message}`);
    this.results.push({ message, type, timestamp });
  }

  async testGetCart() {
    this.log("Testing GET cart API...");

    try {
      const response = await axios.get(`${API_BASE}/cart`, {
        params: { email: TEST_EMAIL },
      });

      if (response.data.success) {
        this.log("Cart retrieved successfully", "success");
        this.log(`Cart items: ${response.data.data.cart.totalItems}`);
      } else {
        this.log("Cart retrieval failed", "error");
      }
    } catch (error) {
      this.log(`Cart API error: ${error.message}`, "error");
    }
  }

  async testAddToCart() {
    this.log("Testing ADD to cart with stock validation...");

    try {
      // Test 1: Add valid quantity
      const response1 = await axios.post(`${API_BASE}/cart/add`, {
        email: TEST_EMAIL,
        productId: TEST_PRODUCT_ID,
        quantity: 2,
        size: TEST_SIZE,
      });

      if (response1.data.success) {
        this.log("Product added to cart successfully", "success");
      } else {
        this.log(`Add to cart failed: ${response1.data.error}`, "error");
      }

      // Test 2: Try to add excessive quantity (should fail with stock validation)
      try {
        const response2 = await axios.post(`${API_BASE}/cart/add`, {
          email: TEST_EMAIL,
          productId: TEST_PRODUCT_ID,
          quantity: 999,
          size: TEST_SIZE,
        });

        this.log(
          "Oversell protection failed - should have been rejected",
          "error"
        );
      } catch (stockError) {
        if (stockError.response && stockError.response.status === 400) {
          this.log("Stock validation working - oversell prevented", "success");
        } else {
          this.log(`Unexpected error: ${stockError.message}`, "error");
        }
      }
    } catch (error) {
      this.log(`Add to cart error: ${error.message}`, "error");
    }
  }

  async testUpdateQuantity() {
    this.log("Testing UPDATE quantity with stock validation...");

    try {
      // Test valid quantity update
      const response1 = await axios.put(`${API_BASE}/cart/update`, {
        email: TEST_EMAIL,
        productId: TEST_PRODUCT_ID,
        size: TEST_SIZE,
        quantity: 3,
      });

      if (response1.data.success) {
        this.log("Quantity updated successfully", "success");
      } else {
        this.log(`Quantity update failed: ${response1.data.error}`, "error");
      }

      // Test excessive quantity update (should fail)
      try {
        const response2 = await axios.put(`${API_BASE}/cart/update`, {
          email: TEST_EMAIL,
          productId: TEST_PRODUCT_ID,
          size: TEST_SIZE,
          quantity: 999,
        });

        this.log("Oversell protection failed on update", "error");
      } catch (stockError) {
        if (stockError.response && stockError.response.status === 400) {
          this.log("Stock validation working on update", "success");
        } else {
          this.log(`Unexpected update error: ${stockError.message}`, "error");
        }
      }
    } catch (error) {
      this.log(`Update quantity error: ${error.message}`, "error");
    }
  }

  async testCheckStock() {
    this.log("Testing stock check endpoint...");

    try {
      const response = await axios.post(`${API_BASE}/products/stock/check`, {
        products: [
          { productId: TEST_PRODUCT_ID, size: TEST_SIZE, quantity: 1 },
          { productId: TEST_PRODUCT_ID, size: TEST_SIZE, quantity: 999 },
        ],
      });

      if (response.data.success) {
        this.log("Stock check endpoint working", "success");
        response.data.results.forEach((result, index) => {
          const status = result.available ? "✓ Available" : "✗ Unavailable";
          this.log(
            `  Product ${index + 1}: ${status} (${
              result.availableStock
            } in stock)`
          );
        });
      } else {
        this.log(`Stock check failed: ${response.data.error}`, "error");
      }
    } catch (error) {
      this.log(`Stock check error: ${error.message}`, "error");
    }
  }

  async testOrderCreation() {
    this.log("Testing order creation with inventory validation...");

    try {
      const response = await axios.post(`${API_BASE}/orders`, {
        email: TEST_EMAIL,
        items: [
          {
            product: TEST_PRODUCT_ID,
            quantity: 1,
            size: TEST_SIZE,
            priceAtOrder: 2999,
          },
        ],
        totalAmount: 2999,
        shippingAddress: {
          street: "Test Street",
          city: "Test City",
          state: "Test State",
          zipCode: "12345",
          country: "India",
        },
      });

      if (response.data.success) {
        this.log("Order created successfully with inventory check", "success");
        this.log(`Order ID: ${response.data.data.order._id}`);
      } else {
        this.log(`Order creation failed: ${response.data.error}`, "error");
      }
    } catch (error) {
      this.log(`Order creation error: ${error.message}`, "error");
    }
  }

  async clearTestCart() {
    this.log("Cleaning up test cart...");

    try {
      const response = await axios.delete(`${API_BASE}/cart/clear`, {
        data: { email: TEST_EMAIL },
      });

      if (response.data.success) {
        this.log("Test cart cleared", "success");
      }
    } catch (error) {
      this.log(`Cart cleanup error: ${error.message}`, "error");
    }
  }

  printSummary() {
    console.log("\n📊 API Test Summary:");
    console.log("══════════════════════");

    const successCount = this.results.filter(
      (r) => r.type === "success"
    ).length;
    const errorCount = this.results.filter((r) => r.type === "error").length;
    const totalCount = successCount + errorCount;

    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(
      `📈 Success Rate: ${
        totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0
      }%`
    );

    if (errorCount === 0) {
      console.log("\n🎉 All API tests passed!");
    } else {
      console.log("\n⚠️  Some tests failed. Check your server and database.");
    }
  }

  async runAllTests() {
    console.log("🚀 Starting Manual API Tests for Inventory Service");
    console.log("═════════════════════════════════════════════════════");
    console.log(`📍 Server: ${API_BASE}`);
    console.log(`👤 Test User: ${TEST_EMAIL}`);
    console.log(`📦 Test Product: ${TEST_PRODUCT_ID}`);
    console.log("");

    try {
      await this.testGetCart();
      await this.testCheckStock();
      await this.testAddToCart();
      await this.testUpdateQuantity();
      await this.testOrderCreation();
      await this.clearTestCart();
    } catch (error) {
      this.log(`Test suite error: ${error.message}`, "error");
    } finally {
      this.printSummary();
    }
  }
}

// Instructions for running the tests
if (require.main === module) {
  console.log("📋 Instructions:");
  console.log("1. Make sure your server is running on localhost:5000");
  console.log(
    "2. Replace TEST_PRODUCT_ID with an actual product ID from your database"
  );
  console.log('3. Ensure the test product has stock available for size "M"');
  console.log("4. Run: node test-inventory-api.js");
  console.log("");

  const tester = new APITester();
  tester.runAllTests().catch(console.error);
}

module.exports = APITester;
