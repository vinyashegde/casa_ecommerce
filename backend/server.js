const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const brandRoutes = require("./routes/brandRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const chatRoutes = require("./routes/chatRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const curatedListRoutes = require("./routes/curatedList");
const paymentRoutes = require("./routes/paymentRoutes");
const shopifyRoutes = require("./routes/shopifyRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const shiprocketRoutes = require("./routes/shiprocketRoutes");
const offerRoutes = require("./routes/offerRoutes");
const staticImageRoutes = require("./routes/staticImageRoutes");
const staticImageFrontendRoutes = require("./routes/staticImageFrontendRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const cancelRequestRoutes = require("./routes/cancelRequestRoutes");
const inventoryValueRoutes = require("./routes/inventoryValueRoutes");

// Import and start the Shopify auto-import service
const shopifyAutoImport = require("./services/shopifyAutoImport");

// If your product routes are in a different file, make sure to add the new route there
const app = express();
const server = createServer(app);

// CORS Configuration - Allow all origins
app.use(cors());
app.use(express.json());

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make io available globally for use in other modules
global.io = io;

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("test", (data) => {
    console.log("🧪 Test event received from client:", data);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/curatedlist", curatedListRoutes);
app.use("/api/payments", paymentRoutes);
// app.use("/api/shiprocket", shiprocketRoutes); // Disabled - Shiprocket integration removed

app.use("/api", shopifyRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/admin/static-images", staticImageRoutes);
app.use("/api/images", staticImageFrontendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/cancel-requests", cancelRequestRoutes);
app.use("/api/inventory-value", inventoryValueRoutes);

// Health check endpoint for Elastic Beanstalk
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Default route
app.get("/", (req, res) => {
  res.send("API is running");
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
  });
});

// Test brand creation endpoint
app.post("/api/test-brand", (req, res) => {
  console.log("🧪 TEST BRAND ENDPOINT HIT!");
  console.log("🧪 Received data:", JSON.stringify(req.body, null, 2));
  console.log("🧪 Domain field:", req.body.domain);
  console.log("🧪 Domain type:", typeof req.body.domain);
  res.json({
    message: "Test endpoint working",
    receivedDomain: req.body.domain,
    allData: req.body,
  });
});

// Test refund notification endpoint
app.post("/api/test-refund-notification", (req, res) => {
  console.log("🧪 TEST REFUND NOTIFICATION ENDPOINT HIT!");
  const { brandId } = req.body;
  
  if (!brandId) {
    return res.status(400).json({ error: "brandId is required" });
  }
  
  console.log("🧪 Emitting test refund notification for brand:", brandId);
  
  if (global.io) {
    global.io.emit("refundRequestNotification", {
      _id: "test-notification-id",
      brandId: brandId,
      orderId: "test-order-id",
      message: "Test refund request for Order #1234 from Test Customer",
      orderDetails: {
        customerName: "Test Customer",
        orderAmount: 1000,
        orderDate: new Date(),
      },
      refundReason: "Test refund reason",
      createdAt: new Date(),
    });
    
    res.json({ 
      success: true, 
      message: "Test refund notification emitted",
      brandId: brandId 
    });
  } else {
    res.status(500).json({ error: "Socket.IO not available" });
  }
});

// DB Connection and server start
const PORT = process.env.PORT || 8080;

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ MongoDB connected successfully");
      server.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);

        // Start the Shopify auto-import service
        try {
          shopifyAutoImport.start();
          console.log("✅ Shopify Auto Import Service started successfully");
        } catch (error) {
          console.error(
            "❌ Failed to start Shopify Auto Import Service:",
            error
          );
        }
      });
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      console.log("⚠️ Exiting server due to DB failure");
      process.exit(1);
    });
} else {
  console.log("⚠️ No MONGO_URI found, running without database");
  server.listen(PORT, () => {
    console.log(`⚠️ Server running on port ${PORT} without DB`);
  });
}
