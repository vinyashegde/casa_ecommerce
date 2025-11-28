const Cart = require("../models/cart");
const Product = require("../models/product");
const InventoryService = require("../services/inventoryService");

// Helper function to clean up duplicate items in cart
const cleanupDuplicateItems = async (cart) => {
  const uniqueItems = [];
  const seenItems = new Map();

  cart.items.forEach((item) => {
    // Handle case where product might be null or undefined
    const productId = item.product ? item.product._id || item.product : null;
    if (!productId) {
      return;
    }

    const key = `${productId}-${item.size}`;

    if (seenItems.has(key)) {
      // Merge quantities for duplicate items
      const existingItem = seenItems.get(key);
      existingItem.quantity += item.quantity;
    } else {
      seenItems.set(key, {
        product: item.product,
        quantity: item.quantity,
        size: item.size,
        priceAtAdd: item.priceAtAdd,
      });
      uniqueItems.push(item);
    }
  });

  // If we found duplicates, rebuild the items array
  if (seenItems.size < cart.items.length) {
    cart.items = [];

    seenItems.forEach((itemData, key) => {
      cart.items.push({
        product: itemData.product,
        quantity: itemData.quantity,
        size: itemData.size,
        priceAtAdd: itemData.priceAtAdd,
      });
    });

    await cart.save();
  }

  return cart;
};

/**
 * GET CART
 * Retrieve user's cart by email
 * GET /api/cart?email=user@example.com
 */
const getCart = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    let cart = await Cart.findByEmail(email);

    if (!cart) {
      // Return empty cart structure
      return res.json({
        success: true,
        data: {
          cart: {
            items: [],
            totalItems: 0,
            totalAmount: 0,
            email,
          },
        },
        message: "Cart is empty",
      });
    }
    // Clean up any duplicate items
    cart = await cleanupDuplicateItems(cart);

    res.json({
      success: true,
      data: {
        cart: {
          _id: cart._id,
          email: cart.email,
          items: cart.items,
          totalItems: cart.totalItems,
          totalAmount: parseFloat(cart.totalAmount.toString()),
          updatedAt: cart.updatedAt,
        },
      },
      message: "Cart retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error fetching cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cart",
      details: error.message,
    });
  }
};

/**
 * ADD TO CART
 * Add a product to user's cart
 * POST /api/cart/add
 * Body: { email, productId, quantity, size }
 */
const addToCart = async (req, res) => {
  try {
    const {
      email,
      productId,
      quantity = 1,
      size = "M",
      color,
      variant,
    } = req.body;

    if (!email || !productId) {
      return res.status(400).json({
        success: false,
        error: "Email and product ID are required",
      });
    }

    // Verify product exists and get price with brand information
    const product = await Product.findById(productId).populate(
      "brand",
      "name logo_url"
    );
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Get or create cart for user
    const cart = await Cart.createOrGetCart(email);

    // ✅ VALIDATE STOCK AVAILABILITY BEFORE ADDING TO CART
    console.log(
      `🔍 Validating stock for product ${productId}, size: ${size}, quantity: ${quantity}`
    );

    try {
      const currentStock = InventoryService.getProductStock(product, size);

      // Check if we're trying to add to existing cart item
      const existingItem = cart.items.find((item) => {
        const itemProductId = item.product._id
          ? item.product._id.toString()
          : item.product.toString();
        return (
          itemProductId === productId &&
          item.size === size &&
          item.color === color
        );
      });

      const existingQuantityInCart = existingItem ? existingItem.quantity : 0;
      const totalRequestedQuantity = existingQuantityInCart + quantity;

      if (currentStock < totalRequestedQuantity) {
        console.error(
          `❌ Insufficient stock: ${currentStock} available, ${totalRequestedQuantity} requested (${existingQuantityInCart} in cart + ${quantity} new)`
        );
        return res.status(400).json({
          success: false,
          error: "Insufficient stock",
          message: `Product is out of stock. Please try again in a few days`,
          availableStock: currentStock,
          requestedQuantity: totalRequestedQuantity,
          currentInCart: existingQuantityInCart,
        });
      }

      console.log(
        `✅ Stock validation passed: ${currentStock} available, ${totalRequestedQuantity} will be in cart`
      );
    } catch (stockError) {
      console.error(`❌ Error checking stock:`, stockError);
      return res.status(500).json({
        success: false,
        error: "Failed to validate stock availability",
        details: stockError.message,
      });
    }

    // Check if cart already has items from a different brand
    if (cart.items.length > 0) {
      // Get the first item's brand to compare
      const firstItem = cart.items[0];
      const firstItemProduct = await Product.findById(
        firstItem.product
      ).populate("brand", "name");

      if (
        firstItemProduct &&
        firstItemProduct.brand._id.toString() !== product.brand._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          error: "Brand mismatch",
          message: `Looks like you're shopping from ${product.brand.name} now, but your bag already has items from ${firstItemProduct.brand.name}. No worries! You can either clear your current bag to add from ${product.brand.name}, or keep shopping from ${firstItemProduct.brand.name}.`,
          currentBrand: {
            id: firstItemProduct.brand._id,
            name: firstItemProduct.brand.name,
          },
          newBrand: {
            id: product.brand._id,
            name: product.brand.name,
          },
        });
      }
    }

    // Determine the price to use (variant price or product price)
    let itemPrice = product.price;
    if (variant && variant.price) {
      itemPrice = variant.price;
    }

    // Add item to cart with variant data
    await cart.addItem(productId, quantity, size, itemPrice, color, variant);

    // Get updated cart with populated product details
    const updatedCart = await Cart.findByEmail(email);

    res.json({
      success: true,
      data: {
        cart: {
          _id: updatedCart._id,
          email: updatedCart.email,
          items: updatedCart.items,
          totalItems: updatedCart.totalItems,
          totalAmount: parseFloat(updatedCart.totalAmount.toString()),
          updatedAt: updatedCart.updatedAt,
        },
      },
      message: "Product added to cart successfully",
    });
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add product to cart",
      details: error.message,
    });
  }
};

/**
 * UPDATE QUANTITY
 * Update quantity of a cart item
 * PUT /api/cart/update
 * Body: { email, productId, size, quantity }
 */
const updateQuantity = async (req, res) => {
  try {
    const { email, productId, size, quantity } = req.body;

    if (!email || !productId || !size || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: "Email, product ID, size, and quantity are required",
      });
    }

    const cart = await Cart.findByEmail(email);
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }

    // ✅ VALIDATE STOCK AVAILABILITY BEFORE UPDATING QUANTITY
    const cartItem = cart.items.find((item) => {
      const itemProductId = item.product._id
        ? item.product._id.toString()
        : item.product.toString();
      return itemProductId === productId && item.size === size;
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: "Item not found in cart",
      });
    }

    // Only validate if increasing quantity
    if (parseInt(quantity) > cartItem.quantity) {
      try {
        console.log(
          `🔍 Validating stock for quantity update: ${productId}, size: ${size}, new quantity: ${quantity}`
        );

        // Get product and check stock
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            error: "Product not found",
          });
        }

        const currentStock = InventoryService.getProductStock(product, size);

        if (currentStock < parseInt(quantity)) {
          console.error(
            `❌ Insufficient stock for update: ${currentStock} available, ${quantity} requested`
          );
          return res.status(400).json({
            success: false,
            error: "Insufficient stock",
            message: `Only ${currentStock} items available`,
            availableStock: currentStock,
            requestedQuantity: parseInt(quantity),
          });
        }

        console.log(
          `✅ Stock validation passed for update: ${currentStock} available, ${quantity} requested`
        );
      } catch (stockError) {
        console.error(`❌ Error checking stock for update:`, stockError);
        return res.status(500).json({
          success: false,
          error: "Failed to validate stock availability",
          details: stockError.message,
        });
      }
    }

    // Update quantity
    await cart.updateQuantity(productId, size, parseInt(quantity));

    // Get updated cart
    const updatedCart = await Cart.findByEmail(email);

    res.json({
      success: true,
      data: {
        cart: {
          _id: updatedCart._id,
          email: updatedCart.email,
          items: updatedCart.items,
          totalItems: updatedCart.totalItems,
          totalAmount: parseFloat(updatedCart.totalAmount.toString()),
          updatedAt: updatedCart.updatedAt,
        },
      },
      message: "Quantity updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating cart item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update cart item",
      details: error.message,
    });
  }
};

/**
 * REMOVE FROM CART
 * Remove a product from user's cart
 * DELETE /api/cart/remove
 * Body: { email, productId, size }
 */
const removeFromCart = async (req, res) => {
  try {
    const { email, productId, size } = req.body;

    if (!email || !productId) {
      return res.status(400).json({
        success: false,
        error: "Email and product ID are required",
      });
    }

    const cart = await Cart.findByEmail(email);
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }

    // Remove item
    await cart.removeItem(productId, size);

    // Get updated cart
    const updatedCart = await Cart.findByEmail(email);

    res.json({
      success: true,
      data: {
        cart: {
          _id: updatedCart._id,
          email: updatedCart.email,
          items: updatedCart.items,
          totalItems: updatedCart.totalItems,
          totalAmount: parseFloat(updatedCart.totalAmount.toString()),
          updatedAt: updatedCart.updatedAt,
        },
      },
      message: "Product removed from cart successfully",
    });
  } catch (error) {
    console.error("❌ Error removing from cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove product from cart",
      details: error.message,
    });
  }
};

/**
 * CLEAR CART
 * Clear all items from user's cart
 * DELETE /api/cart/clear
 * Body: { email }
 */
const clearCart = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const cart = await Cart.findByEmail(email);
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }

    // Clear cart
    await cart.clearCart();

    res.json({
      success: true,
      data: {
        cart: {
          _id: cart._id,
          email: cart.email,
          items: cart.items,
          totalItems: cart.totalItems,
          totalAmount: parseFloat(cart.totalAmount.toString()),
          updatedAt: cart.updatedAt,
        },
      },
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("❌ Error clearing cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear cart",
      details: error.message,
    });
  }
};

/**
 * DELETE CART
 * Delete user's entire cart
 * DELETE /api/cart
 * Body: { email }
 */
const deleteCart = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const deleteCart = await Cart.findOneAndDelete({ email });

    if (!deleteCart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }

    res.json({
      success: true,
      message: "Cart deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete cart",
      details: error.message,
    });
  }
};
module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  deleteCart,
};
