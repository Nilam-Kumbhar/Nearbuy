import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DeliveryPartner } from "../models/DeliveryPartner.model.js";
import { Order } from "../models/Order.model.js";
import { Shop } from "../models/Shop.model.js";

// Helper function to get or create DeliveryPartner profile
const getOrCreatePartnerProfile = async (userId) => {
    let partner = await DeliveryPartner.findOne({ user: userId });
    if (!partner) {
        partner = await DeliveryPartner.create({
            user: userId,
            isAvailable: false
        });
    }
    return partner;
};

// @desc    Get active orders assigned to the logged-in delivery partner
// @route   GET /api/v1/delivery/assigned
// @access  Private (Delivery Partner)
const getAssignedOrders = asyncHandler(async (req, res) => {
    const partner = await getOrCreatePartnerProfile(req.user._id);

    // Query active assigned orders (not delivered or cancelled)
    const orders = await Order.find({
        $or: [{ deliveryPartner: partner._id }, { deliveryPartner: req.user._id }],
        status: { $nin: ["delivered", "cancelled", "rejected"] }
    })
        .populate("customer", "username phone email")
        .populate("shop", "name address phone businessHours")
        .populate("items.product", "name images price unit")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Assigned orders retrieved successfully"));
});

// @desc    Update order delivery status (e.g. picked_up, out_for_delivery, delivered)
// @route   PUT /api/v1/delivery/status/:id
// @access  Private (Delivery Partner)
const updateDeliveryStatus = asyncHandler(async (req, res) => {
    const { id } = req.params; // orderId
    const { status } = req.body;

    const allowedStatuses = ["picked_up", "out_for_delivery", "delivered"];
    if (!status || !allowedStatuses.includes(status)) {
        throw new ApiError(400, `Invalid delivery status. Allowed statuses: ${allowedStatuses.join(", ")}`);
    }

    const partner = await getOrCreatePartnerProfile(req.user._id);

    const order = await Order.findById(id);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Verify assignment
    const isAssigned =
        (order.deliveryPartner && order.deliveryPartner.toString() === partner._id.toString()) ||
        (order.deliveryPartner && order.deliveryPartner.toString() === req.user._id.toString());

    if (!isAssigned) {
        throw new ApiError(403, "You are not assigned to this delivery order");
    }

    // Update order status & status history
    order.status = status;
    order.statusHistory.push({
        status,
        at: new Date()
    });

    // If order is delivered, update partner stats & earnings
    if (status === "delivered") {
        partner.totalDeliveries = (partner.totalDeliveries || 0) + 1;
        const deliveryFeeEarned = order.deliveryFee > 0 ? order.deliveryFee : 40;
        partner.earnings = partner.earnings || { total: 0, pendingPayout: 0 };
        partner.earnings.total += deliveryFeeEarned;
        partner.earnings.pendingPayout += deliveryFeeEarned;
        partner.activeOrder = null;
        await partner.save();
    } else {
        partner.activeOrder = order._id;
        await partner.save();
    }

    await order.save();

    return res
        .status(200)
        .json(new ApiResponse(200, order, `Order delivery status updated to "${status}"`));
});

// @desc    Get delivery history for logged-in rider
// @route   GET /api/v1/delivery/history
// @access  Private (Delivery Partner)
const deliveryHistory = asyncHandler(async (req, res) => {
    const partner = await getOrCreatePartnerProfile(req.user._id);
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {
        $or: [{ deliveryPartner: partner._id }, { deliveryPartner: req.user._id }],
        status: "delivered"
    };

    const orders = await Order.find(filter)
        .populate("customer", "username phone")
        .populate("shop", "name address")
        .populate("items.product", "name images price")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Order.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders,
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                stats: {
                    totalDeliveries: partner.totalDeliveries || 0,
                    totalEarnings: partner.earnings?.total || 0,
                    rating: partner.rating || { average: 0, count: 0 }
                }
            },
            "Delivery history fetched successfully"
        )
    );
});

// @desc    Toggle online/offline availability for rider
// @route   PUT /api/v1/delivery/toggle-availability
// @access  Private (Delivery Partner)
const toggleAvailability = asyncHandler(async (req, res) => {
    const partner = await getOrCreatePartnerProfile(req.user._id);

    const { isAvailable } = req.body;

    partner.isAvailable = isAvailable !== undefined ? Boolean(isAvailable) : !partner.isAvailable;
    await partner.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isAvailable: partner.isAvailable,
                partner
            },
            `Rider is now ${partner.isAvailable ? "online" : "offline"}`
        )
    );
});

// @desc    Update live location of delivery partner
// @route   PUT /api/v1/delivery/location
// @access  Private (Delivery Partner)
const updateLiveLocation = asyncHandler(async (req, res) => {
    const { latitude, longitude, lat, lng, coordinates } = req.body;

    let queryLng = lng || longitude;
    let queryLat = lat || latitude;

    if (Array.isArray(coordinates) && coordinates.length === 2) {
        queryLng = coordinates[0];
        queryLat = coordinates[1];
    }

    if (queryLng === undefined || queryLat === undefined || isNaN(parseFloat(queryLng)) || isNaN(parseFloat(queryLat))) {
        throw new ApiError(400, "Valid latitude and longitude are required to update live location");
    }

    const partner = await getOrCreatePartnerProfile(req.user._id);

    partner.currentLocation = {
        type: "Point",
        coordinates: [parseFloat(queryLng), parseFloat(queryLat)]
    };

    await partner.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                currentLocation: partner.currentLocation
            },
            "Live location updated successfully"
        )
    );
});

// @desc    Manually assign delivery partner to an order (fallback for shop owner)
// @route   POST /api/v1/delivery/assign/:orderId
// @access  Private (Shop Owner)
const assignDeliveryPartner = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { deliveryPartnerId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop || order.shop.toString() !== shop._id.toString()) {
        throw new ApiError(403, "You are not authorized to assign a delivery partner for this order");
    }

    let partner = null;

    if (deliveryPartnerId) {
        partner = await DeliveryPartner.findById(deliveryPartnerId);
        if (!partner) {
            partner = await DeliveryPartner.findOne({ user: deliveryPartnerId });
        }

        if (!partner) {
            throw new ApiError(404, "Specified delivery partner not found");
        }

        if (!partner.isAvailable) {
            throw new ApiError(400, "Specified delivery partner is currently not available");
        }

        if (partner.activeOrder && partner.activeOrder.toString() !== order._id.toString()) {
            throw new ApiError(400, "Specified delivery partner already has an active order");
        }
    } else {
        if (!shop.address?.location?.coordinates) {
            throw new ApiError(400, "Shop location coordinates are missing to find nearby delivery partners");
        }

        partner = await DeliveryPartner.findOne({
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

        if (!partner) {
            throw new ApiError(404, "No available delivery partner found nearby");
        }
    }

    if (order.deliveryPartner && order.deliveryPartner.toString() !== partner._id.toString()) {
        const previousPartner = await DeliveryPartner.findById(order.deliveryPartner);
        if (previousPartner && previousPartner.activeOrder?.toString() === order._id.toString()) {
            previousPartner.activeOrder = null;
            await previousPartner.save();
        }
    }

    order.deliveryPartner = partner._id;
    partner.activeOrder = order._id;

    await partner.save();
    await order.save();

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Delivery partner assigned successfully"));
});

export {
    getAssignedOrders,
    updateDeliveryStatus,
    deliveryHistory,
    toggleAvailability,
    updateLiveLocation,
    assignDeliveryPartner
};
