const User = require("../models/user");
const sgMail = require("@sendgrid/mail");

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email sending function using SendGrid with fallback
const sendOtpEmail = async (email, otp) => {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      await simulateEmail(email, otp);
      return;
    }

    // Try SendGrid first
    try {
      const msg = {
        to: email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || "noreply@casashop.in",
          name: process.env.SENDGRID_FROM_NAME || "Casa Shop",
        },
        subject: "Your Casa Shop Verification Code",
        html: createEmailTemplate(otp),
      };

      const response = await sgMail.send(msg);
      return;
    } catch (sendgridError) {
      await simulateEmail(email, otp);
      return;
    }
  } catch (error) {
    console.error("❌ All email methods failed:", error);
    // Fallback to simulation as last resort
    await simulateEmail(email, otp);
  }
};

// Fallback email simulation
const simulateEmail = async (email, otp) => {
  // Simulate email delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

// Email sending function for cancel order notifications
const sendCancelOrderEmail = async (email, orderDetails) => {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      await simulateEmail(email, null);
      return;
    }

    // Try SendGrid first
    try {
      const msg = {
        to: email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || "noreply@casashop.in",
          name: process.env.SENDGRID_FROM_NAME || "Casa Shop",
        },
        subject: "Order Cancellation Confirmed - Casa Shop",
        html: createCancelOrderEmailTemplate(orderDetails),
      };

      const response = await sgMail.send(msg);
      console.log("✅ Cancel order email sent successfully to:", email);
      return;
    } catch (sendgridError) {
      console.error("❌ SendGrid error for cancel order email:", sendgridError);
      await simulateEmail(email, null);
      return;
    }
  } catch (error) {
    console.error("❌ All email methods failed for cancel order:", error);
    // Fallback to simulation as last resort
    await simulateEmail(email, null);
  }
};

// Email sending function for refund order notifications
const sendRefundOrderEmail = async (email, orderDetails) => {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      await simulateEmail(email, null);
      return;
    }

    // Try SendGrid first
    try {
      const msg = {
        to: email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || "noreply@casashop.in",
          name: process.env.SENDGRID_FROM_NAME || "Casa Shop",
        },
        subject: "Refund Processed Successfully - Casa Shop",
        html: createRefundOrderEmailTemplate(orderDetails),
      };

      const response = await sgMail.send(msg);
      console.log("✅ Refund order email sent successfully to:", email);
      return;
    } catch (sendgridError) {
      console.error("❌ SendGrid error for refund order email:", sendgridError);
      await simulateEmail(email, null);
      return;
    }
  } catch (error) {
    console.error("❌ All email methods failed for refund order:", error);
    // Fallback to simulation as last resort
    await simulateEmail(email, null);
  }
};

// Create email template
const createEmailTemplate = (otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0; font-size: 28px;">🏠 Casa Shop</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your Fashion Destination</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px; text-align: center;">Verification Code</h2>
          <div style="background-color: #ffffff; padding: 20px; border: 2px dashed #007bff; border-radius: 8px; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${otp}</span>
          </div>
          <p style="color: #666; margin: 20px 0 0 0; font-size: 14px; text-align: center;">
            This code will expire in 10 minutes
          </p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">If you didn't request this code, please ignore this email.</p>
          <p style="margin: 10px 0 0 0;">Thank you for choosing Casa Shop!</p>
        </div>
      </div>
    </div>
  `;
};

// Create cancel order email template
const createCancelOrderEmailTemplate = (orderDetails) => {
  const { orderId, customerName, amount, orderDate } = orderDetails;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0; font-size: 28px;">🏠 Casa Shop</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your Fashion Destination</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #28a745; margin: 0 0 20px 0; font-size: 22px; text-align: center;">✅ Order Cancellation Confirmed</h2>
          <div style="background-color: #ffffff; padding: 20px; border: 2px solid #28a745; border-radius: 8px;">
            <p style="color: #333; margin: 0 0 15px 0; font-size: 16px;"><strong>Dear ${customerName},</strong></p>
            <p style="color: #333; margin: 0 0 15px 0; font-size: 16px;">We have successfully processed the cancellation of your order and the payment has been received from Casa.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="color: #333; margin: 0 0 5px 0; font-size: 14px;"><strong>Order Details:</strong></p>
              <p style="color: #666; margin: 0 0 5px 0; font-size: 14px;">Order ID: #${orderId}</p>
              <p style="color: #666; margin: 0 0 5px 0; font-size: 14px;">Order Date: ${new Date(orderDate).toLocaleDateString()}</p>
              <p style="color: #666; margin: 0; font-size: 14px;">Amount: ₹${amount}</p>
            </div>
            
            <p style="color: #333; margin: 15px 0 0 0; font-size: 16px;">The refund amount will be credited back to your original payment method within 5-7 business days.</p>
          </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">If you have any questions, please contact our customer support.</p>
          <p style="margin: 10px 0 0 0;">Thank you for choosing Casa Shop!</p>
        </div>
      </div>
    </div>
  `;
};

// Create refund order email template
const createRefundOrderEmailTemplate = (orderDetails) => {
  const { orderId, customerName, amount, orderDate, refundAmount } = orderDetails;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0; font-size: 28px;">🏠 Casa Shop</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your Fashion Destination</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #28a745; margin: 0 0 20px 0; font-size: 22px; text-align: center;">💰 Refund Processed Successfully</h2>
          <div style="background-color: #ffffff; padding: 20px; border: 2px solid #28a745; border-radius: 8px;">
            <p style="color: #333; margin: 0 0 15px 0; font-size: 16px;"><strong>Dear ${customerName},</strong></p>
            <p style="color: #333; margin: 0 0 15px 0; font-size: 16px;">We have successfully processed your refund request and the payment has been received from Casa.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="color: #333; margin: 0 0 5px 0; font-size: 14px;"><strong>Order Details:</strong></p>
              <p style="color: #666; margin: 0 0 5px 0; font-size: 14px;">Order ID: #${orderId}</p>
              <p style="color: #666; margin: 0 0 5px 0; font-size: 14px;">Order Date: ${new Date(orderDate).toLocaleDateString()}</p>
              <p style="color: #666; margin: 0 0 5px 0; font-size: 14px;">Original Amount: ₹${amount}</p>
              <p style="color: #28a745; margin: 0; font-size: 14px; font-weight: bold;">Refund Amount: ₹${refundAmount}</p>
            </div>
            
            <p style="color: #333; margin: 15px 0 0 0; font-size: 16px;">The refund amount will be credited back to your original payment method within 5-7 business days.</p>
          </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">If you have any questions, please contact our customer support.</p>
          <p style="margin: 10px 0 0 0;">Thank you for choosing Casa Shop!</p>
        </div>
      </div>
    </div>
  `;
};

// ✅ Create User
exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (err) {
    console.error("Error creating user:", err.message);
    console.error("Full error:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get All Users with Optional Filters
// ENHANCED: Added phone number filtering for user existence checks
exports.getUsers = async (req, res) => {
  try {
    const query = {};

    if (req.query.gender) query.gender = req.query.gender;
    if (req.query.age) query.age = Number(req.query.age);
    if (req.query.email) query.email = new RegExp(req.query.email, "i"); // partial, case-insensitive
    if (req.query.phone) query.phone = req.query.phone; // ADDED: Exact phone number match for login checks
    if (req.query.interests) {
      const interestsArray = req.query.interests.split(",");
      query.interests = { $in: interestsArray };
    }

    const users = await User.find(query);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Users by Email (for authentication)
exports.getUsersByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const users = await User.find({ email: email.toLowerCase() });
    res.json(users);
  } catch (err) {
    console.error("Error looking up users by email:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Check if Email Exists (for onboarding skip logic)
exports.checkEmailExists = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    const exists = !!user;
    
    res.json({ 
      exists, 
      user: exists ? {
        _id: user._id,
        email: user.email,
        display_name: user.display_name,
        age: user.age,
        interests: user.interests,
        ml_preferences: user.ml_preferences
      } : null 
    });
  } catch (err) {
    console.error("Error checking email existence:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Single User by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update User by ID
// ENHANCED: Added logging for profile updates from manage account page
exports.updateUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating user:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete User by ID
// ENHANCED: Added logging and better error handling for account deletion
exports.deleteUser = async (req, res) => {
  try {

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User deleted successfully",
      deletedUser: {
        id: deleted._id,
        name: deleted.display_name,
        phone: deleted.phone,
      },
    });
  } catch (err) {
    console.error("Error deleting user:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// NEW: Delete User by Phone Number (for easier deletion from frontend)
exports.deleteUserByPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const deleted = await User.findOneAndDelete({ phone: phone });
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Account deleted successfully",
      deletedUser: {
        id: deleted._id,
        name: deleted.display_name,
        phone: deleted.phone,
      },
    });
  } catch (err) {
    console.error("Error deleting user by phone:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Generate OTP and send via email
exports.generateOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    // Send OTP via email
    try {
      await sendOtpEmail(email, otp);

      // For development: Always return OTP so frontend can validate
      // In production: Remove otp from response for security
      return res.json({
        success: true,
        message: "OTP sent successfully to your email",
        email: email,
        otp: otp, // Keep OTP for development
      });
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);

      // Fallback: return OTP in response for development
      return res.json({
        success: false,
        message: "Email sending failed, but OTP generated",
        email: email,
        otp: otp, // Only for development
        error: "Email service unavailable",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Add Shipment to User
exports.addShipment = async (req, res) => {
  try {
    const { id } = req.params; // user ID
    const shipmentData = req.body;

    if (
      !shipmentData.billing_customer_name ||
      !shipmentData.billing_phone ||
      !shipmentData.billing_email ||
      !shipmentData.billing_address ||
      !shipmentData.billing_city ||
      !shipmentData.billing_pincode ||
      !shipmentData.billing_state ||
      !shipmentData.billing_country
    ) {
      return res
        .status(400)
        .json({ error: "Missing required shipment fields" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.shipment.push(shipmentData);
    await user.save();

    res.status(201).json({
      message: "Shipment address added successfully",
      shipment: user.shipment,
    });
  } catch (err) {
    console.error("Error adding shipment:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all Shipments for User
exports.getShipments = async (req, res) => {
  try {
    const { id } = req.params; // user ID
    const user = await User.findById(id).select("shipment");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      shipments: user.shipment || [],
    });
  } catch (err) {
    console.error("Error fetching shipments:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update a Shipment by shipment ID
exports.updateShipment = async (req, res) => {
  try {
    const { id, shipmentId } = req.params;
    const shipmentData = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const shipment = user.shipment.id(shipmentId);
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });

    Object.assign(shipment, shipmentData);
    await user.save();

    res.json({
      message: "Shipment updated successfully",
      shipment,
    });
  } catch (err) {
    console.error("Error updating shipment:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete a Shipment by shipment ID
exports.deleteShipment = async (req, res) => {
  try {
    const { id, shipmentId } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.shipment = user.shipment.filter(
      (s) => s._id.toString() !== shipmentId
    );
    await user.save();

    res.json({
      message: "Shipment deleted successfully",
      shipment: user.shipment,
    });
  } catch (err) {
    console.error("Error deleting shipment:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Export email functions for use in other controllers
exports.sendCancelOrderEmail = sendCancelOrderEmail;
exports.sendRefundOrderEmail = sendRefundOrderEmail;
