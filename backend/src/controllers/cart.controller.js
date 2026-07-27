import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Cart } from "../models/Cart.model.js";
import { Product } from "../models/Product.model.js";

// @desc    Add product to cart (enforces single-shop per cart)
// @route   POST /api/v1/cart/add
// @access  Private (Customer)
const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity = 1, forceClear = false } = req.body;

    if (!productId) {
        throw new ApiError(400, "Product ID is required");
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    // Verify product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (!product.isAvailable || product.stock < qty) {
        throw new ApiError(400, "Product is currently out of stock or unavailable");
    }

    const productShopId = product.shop.toString();

    // Calculate effective snapshot price (applying discount if any)
    const effectivePrice = product.price * (1 - (product.discountPercent || 0) / 100);

    let cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
        // Create new cart for customer
        cart = await Cart.create({
            customer: req.user._id,
            shop: product.shop,
            items: [
                {
                    product: product._id,
                    quantity: qty,
                    priceAtAdd: Number(effectivePrice.toFixed(2))
                }
            ]
        });
    } else {
        // Enforce single-shop-per-cart rule
        const hasExistingItems = cart.items && cart.items.length > 0;
        const isDifferentShop = cart.shop && cart.shop.toString() !== productShopId;

        if (hasExistingItems && isDifferentShop) {
            if (!forceClear) {
                throw new ApiError(
                    400,
                    "Your cart contains items from a different shop. Clear your cart to add items from this shop.",
                    [
                        {
                            code: "DIFFERENT_SHOP",
                            currentShop: cart.shop,
                            newShop: product.shop,
                            message: "Do you want to clear your cart and add items from the new shop?"
                        }
                    ]
                );
            } else {
                // Customer opted to clear existing items and switch shop
                cart.items = [];
                cart.shop = product.shop;
                cart.couponCode = null;
            }
        }

        // Set shop reference if cart was previously empty
        if (cart.items.length === 0 || !cart.shop) {
            cart.shop = product.shop;
        }

        // Check if product is already in cart
        const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === product._id.toString()
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += qty;
            cart.items[existingItemIndex].priceAtAdd = Number(effectivePrice.toFixed(2));
        } else {
            cart.items.push({
                product: product._id,
                quantity: qty,
                priceAtAdd: Number(effectivePrice.toFixed(2))
            });
        }

        await cart.save();
    }

    // Populate product & shop details for response
    cart = await Cart.findById(cart._id)
        .populate("items.product", "name price discountPercent unit images stock isAvailable")
        .populate("shop", "name address isOpen");

    return res
        .status(200)
        .json(new ApiResponse(200, cart, "Item added to cart successfully"));
});

// @desc    Get logged-in user's cart with calculated total
// @route   GET /api/v1/cart
// @access  Private (Customer)
const getCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ customer: req.user._id })
        .populate("items.product", "name price discountPercent unit images stock isAvailable")
        .populate("shop", "name address isOpen deliveryRadiusKm rating");

    if (!cart) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    customer: req.user._id,
                    shop: null,
                    items: [],
                    totalPrice: 0,
                    totalItems: 0
                },
                "Cart is empty"
            )
        );
    }

    // Calculate cart totals
    let totalPrice = 0;
    let totalItems = 0;

    cart.items.forEach((item) => {
        totalPrice += (item.priceAtAdd || 0) * item.quantity;
        totalItems += item.quantity;
    });

    const cartData = {
        ...cart.toObject(),
        totalPrice: Number(totalPrice.toFixed(2)),
        totalItems
    };

    return res
        .status(200)
        .json(new ApiResponse(200, cartData, "Cart retrieved successfully"));
});

// @desc    Update quantity of an item in cart
// @route   PUT /api/v1/cart/:id (id is productId)
// @access  Private (Customer)
const updateCartItem = asyncHandler(async (req, res) => {
    const { id } = req.params; // productId
    const { quantity } = req.body;

    if (quantity === undefined) {
        throw new ApiError(400, "Quantity is required");
    }

    const qty = parseInt(quantity, 10);

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === id
    );

    if (itemIndex === -1) {
        throw new ApiError(404, "Item not found in cart");
    }

    if (qty <= 0) {
        // Remove item if quantity is zero or negative
        cart.items.splice(itemIndex, 1);
    } else {
        // Verify stock limit
        const product = await Product.findById(id);
        if (product && product.stock < qty) {
            throw new ApiError(400, `Only ${product.stock} items available in stock`);
        }
        cart.items[itemIndex].quantity = qty;
    }

    // Reset shop if cart is now empty
    if (cart.items.length === 0) {
        cart.shop = null;
        cart.couponCode = null;
    }

    await cart.save();

    cart = await Cart.findById(cart._id)
        .populate("items.product", "name price discountPercent unit images stock isAvailable")
        .populate("shop", "name address isOpen");

    return res
        .status(200)
        .json(new ApiResponse(200, cart, "Cart item updated successfully"));
});

// @desc    Remove an item from cart
// @route   DELETE /api/v1/cart/:id (id is productId)
// @access  Private (Customer)
const removeCartItem = asyncHandler(async (req, res) => {
    const { id } = req.params; // productId

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.product.toString() !== id);

    if (cart.items.length === initialLength) {
        throw new ApiError(404, "Item not found in cart");
    }

    // Reset shop if cart becomes empty
    if (cart.items.length === 0) {
        cart.shop = null;
        cart.couponCode = null;
    }

    await cart.save();

    cart = await Cart.findById(cart._id)
        .populate("items.product", "name price discountPercent unit images stock isAvailable")
        .populate("shop", "name address isOpen");

    return res
        .status(200)
        .json(new ApiResponse(200, cart, "Item removed from cart successfully"));
});

// @desc    Clear all items in cart
// @route   DELETE /api/v1/cart/clear
// @access  Private (Customer)
const clearCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ customer: req.user._id });

    if (cart) {
        cart.items = [];
        cart.shop = null;
        cart.couponCode = null;
        await cart.save();
    } else {
        cart = await Cart.create({
            customer: req.user._id,
            shop: null,
            items: []
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, cart, "Cart cleared successfully"));
});

export {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart
};
