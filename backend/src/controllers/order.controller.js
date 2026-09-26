import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/Order.model.js";
import { Cart } from "../models/Cart.model.js";
import { Product } from "../models/Product.model.js";
import { Shop } from "../models/Shop.model.js";
import { DeliveryPartner } from "../models/DeliveryPartner.model.js";

// @desc    Place a new order (converts cart -> order, snapshots prices, decrements stock)
// @route   POST /api/v1/orders/place
// @access  Private (Customer)
const placeOrder = asyncHandler(async (req, res) => {
    const {
        deliveryAddress,
        paymentMethod = "cod",
        deliveryFee = 0,
        discount = 0
    } = req.body;

    // Fetch user's active cart
    const cart = await Cart.findOne({ customer: req.user._id }).populate("items.product");

    if (!cart || !cart.items || cart.items.length === 0) {
        throw new ApiError(400, "Your cart is empty. Please add items before placing an order.");
    }

    if (!cart.shop) {
        throw new ApiError(400, "Cart does not have an associated shop.");
    }

    // Parse and validate delivery address
    let formattedAddress = deliveryAddress;

    if (!formattedAddress) {
        const { addressLine, city, pincode, latitude, longitude, coordinates } = req.body;

        let lng = longitude;
        let lat = latitude;

        if (Array.isArray(coordinates) && coordinates.length === 2) {
            lng = coordinates[0];
            lat = coordinates[1];
        }

        if (lng === undefined || lat === undefined || isNaN(parseFloat(lng)) || isNaN(parseFloat(lat))) {
            throw new ApiError(400, "Valid delivery address coordinates (latitude and longitude) are required.");
        }

        formattedAddress = {
            addressLine: addressLine || "",
            city: city || "",
            pincode: pincode || "",
            location: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)]
            }
        };
    } else if (!formattedAddress.location || !formattedAddress.location.coordinates) {
        const { latitude, longitude, coordinates } = req.body;
        let lng = longitude;
        let lat = latitude;
        if (Array.isArray(coordinates) && coordinates.length === 2) {
            lng = coordinates[0];
            lat = coordinates[1];
        }

        if (lng === undefined || lat === undefined || isNaN(parseFloat(lng)) || isNaN(parseFloat(lat))) {
            throw new ApiError(400, "Delivery location coordinates [longitude, latitude] are required.");
        }

        formattedAddress.location = {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
        };
    }

    // Process cart items, snapshot prices & product names, decrement product stock
    const orderItems = [];
    let itemsTotal = 0;

    for (const item of cart.items) {
        const product = await Product.findById(item.product._id || item.product);

        if (!product) {
            throw new ApiError(404, `Product ${item.product} no longer exists`);
        }

        if (!product.isAvailable) {
            throw new ApiError(400, `Product "${product.name}" is currently unavailable.`);
        }

        if (product.stock < item.quantity) {
            throw new ApiError(
                400,
                `Insufficient stock for "${product.name}". Only ${product.stock} left in stock.`
            );
        }

        // Snapshot price (prefer priceAtAdd if saved, else current product effective price)
        const snapshotPrice = item.priceAtAdd || Number((product.price * (1 - (product.discountPercent || 0) / 100)).toFixed(2));
        const itemSubtotal = snapshotPrice * item.quantity;
        itemsTotal += itemSubtotal;

        orderItems.push({
            product: product._id,
            name: product.name,
            price: snapshotPrice,
            quantity: item.quantity
        });

        // Decrement product stock & increment sales count
        product.stock -= item.quantity;
        product.salesCount = (product.salesCount || 0) + item.quantity;
        await product.save();
    }

    const calculatedGrandTotal = Math.max(0, itemsTotal + Number(deliveryFee) - Number(discount));

    // Create Order
    const order = await Order.create({
        customer: req.user._id,
        shop: cart.shop,
        items: orderItems,
        deliveryAddress: formattedAddress,
        itemsTotal: Number(itemsTotal.toFixed(2)),
        deliveryFee: Number(Number(deliveryFee).toFixed(2)),
        discount: Number(Number(discount).toFixed(2)),
        grandTotal: Number(calculatedGrandTotal.toFixed(2)),
        paymentMethod,
        status: "placed",
        statusHistory: [
            {
                status: "placed",
                at: new Date()
            }
        ]
    });

    // Clear Customer Cart
    cart.items = [];
    cart.shop = null;
    cart.couponCode = null;
    await cart.save();

    return res
        .status(201)
        .json(new ApiResponse(201, order, "Order placed successfully"));
});

// @desc    Get customer's orders history
// @route   GET /api/v1/orders/my-orders
// @access  Private (Customer)
const getMyOrders = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { customer: req.user._id };
    if (status) {
        filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(filter)
        .populate("shop", "name address businessHours isOpen")
        .populate("items.product", "name images price unit")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Order.countDocuments(filter);

    const response = new ApiResponse(200, orders, "Customer orders fetched successfully");
    response.total = total;
    response.page = pageNum;
    response.pages = Math.ceil(total / limitNum);

    return res.status(200).json(response);
});

// @desc    Get order details by ID
// @route   GET /api/v1/orders/:id
// @access  Private (Customer / Shop Owner / Delivery)
const getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id)
        .populate("customer", "username email phone")
        .populate("shop", "name address businessHours owner")
        .populate("deliveryPartner", "vehicleType rating phone")
        .populate("items.product", "name images price unit");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Check authorization: customer, shop owner, or delivery partner
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isShopOwner = order.shop.owner && order.shop.owner.toString() === req.user._id.toString();
    const isDeliveryPartner = order.deliveryPartner && order.deliveryPartner._id.toString() === req.user._id.toString();

    if (!isCustomer && !isShopOwner && !isDeliveryPartner) {
        throw new ApiError(403, "You are not authorized to view this order");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order details fetched successfully"));
});

// @desc    Cancel order by customer
// @route   PUT /api/v1/orders/cancel/:id
// @access  Private (Customer)
const cancelOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.customer.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to cancel this order");
    }

    // Order can only be cancelled before it's being prepared or picked up
    if (["delivered", "cancelled", "rejected", "preparing", "picked_up", "out_for_delivery"].includes(order.status)) {
        throw new ApiError(400, `Order cannot be cancelled at status "${order.status}"`);
    }

    // Restore stock for each product item
    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: {
                stock: item.quantity,
                salesCount: -item.quantity
            }
        });
    }

    order.status = "cancelled";
    order.statusHistory.push({
        status: "cancelled",
        at: new Date()
    });

    await order.save();

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order cancelled successfully"));
});

// @desc    Get all orders for a shop (Shop Owner flow)
// @route   GET /api/v1/orders/shop-orders
// @access  Private (Shop Owner)
const getShopOrders = asyncHandler(async (req, res) => {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
        throw new ApiError(404, "Shop not found for this user");
    }

    const { status, page = 1, limit = 10 } = req.query;

    const filter = { shop: shop._id };
    if (status) {
        filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(filter)
        .populate("customer", "username email phone")
        .populate("items.product", "name images price unit")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Order.countDocuments(filter);

    const response = new ApiResponse(200, orders, "Shop orders fetched successfully");
    response.total = total;
    response.page = pageNum;
    response.pages = Math.ceil(total / limitNum);

    return res.status(200).json(response);
});

// @desc    Update order status (Accept/Reject/Preparing flow by Shop Owner)
// @route   PUT /api/v1/orders/status/:id
// @access  Private (Shop Owner)
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Order.ORDER_STATUSES.includes(status)) {
        throw new ApiError(400, `Invalid order status. Allowed: ${Order.ORDER_STATUSES.join(", ")}`);
    }

    const order = await Order.findById(id);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop || order.shop.toString() !== shop._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this order");
    }

    // Auto-assign nearest available delivery partner when status is updated to "preparing"
    if (status === "preparing" && !order.deliveryPartner) {
        if (shop.address?.location?.coordinates) {
            const nearestPartner = await DeliveryPartner.findOne({
                isAvailable: true,
                activeOrder: null,
                currentLocation: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: shop.address.location.coordinates
                        }
                    }
                }
            });

            if (nearestPartner) {
                order.deliveryPartner = nearestPartner._id;
                nearestPartner.activeOrder = order._id;
                await nearestPartner.save();
            }
        }
    }

    // If status is being set to rejected, restore product stock & clear delivery partner active order if assigned
    if (status === "rejected" && order.status !== "rejected" && order.status !== "cancelled") {
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: {
                    stock: item.quantity,
                    salesCount: -item.quantity
                }
            });
        }
        if (order.deliveryPartner) {
            await DeliveryPartner.findByIdAndUpdate(order.deliveryPartner, { activeOrder: null });
        }
    }

    order.status = status;
    order.statusHistory.push({
        status,
        at: new Date()
    });

    await order.save();

    return res
        .status(200)
        .json(new ApiResponse(200, order, `Order status updated to "${status}" successfully`));
});

export {
    placeOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getShopOrders,
    updateOrderStatus
};
