const express = require("express");
const router = express.Router();

// ✅ FIX THIS PATH
const userController = require("../controllers/userController.js");

// your routes
router.post("/", userController.createUser);
router.get("/", userController.getUsers);
router.get("/by-email", userController.getUsersByEmail); // NEW: Get users by email
router.get("/check-email/:email", userController.checkEmailExists); // NEW: Check if email exists
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.delete("/delete-by-phone", userController.deleteUserByPhone); // NEW: Delete by phone number
router.post("/generate-otp", userController.generateOtp);
// Shipments
router.post("/:id/shipment", userController.addShipment);
router.get("/:id/shipment", userController.getShipments);
router.put("/:id/shipment/:shipmentId", userController.updateShipment);
router.delete("/:id/shipment/:shipmentId", userController.deleteShipment);

module.exports = router;
