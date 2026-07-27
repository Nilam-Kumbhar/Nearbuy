import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Shop } from "../models/Shop.model.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";

// @desc    Create a new shop for logged-in shop owner
// @route   POST /api/v1/shops/create
// @access  Private (Shop Owner)
const createShop = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        category,
        gstNumber,
        addressLine,
        city,
        pincode,
        latitude,
        longitude,
        coordinates,
        opensAt,
        closesAt,
        workingDays,
        deliveryRadiusKm
    } = req.body;

    if (!name || !category) {
        throw new ApiError(400, "Shop name and category are required");
    }

    // Check if shop owner already created a shop
    const existingShop = await Shop.findOne({ owner: req.user._id });
    if (existingShop) {
        throw new ApiError(400, "You have already registered a shop");
    }

    // Parse coordinates [longitude, latitude]
    let lng = longitude;
    let lat = latitude;

    if (Array.isArray(coordinates) && coordinates.length === 2) {
        lng = coordinates[0];
        lat = coordinates[1];
    } else if (req.body.address?.location?.coordinates) {
        lng = req.body.address.location.coordinates[0];
        lat = req.body.address.location.coordinates[1];
    }

    if (lng === undefined || lat === undefined || isNaN(parseFloat(lng)) || isNaN(parseFloat(lat))) {
        throw new ApiError(400, "Valid longitude and latitude are required for shop location");
    }

    const location = {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)]
    };

    // Handle image upload if provided
    const images = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
            const uploaded = await uploadOnCloudinary(file.path);
            if (uploaded) {
                images.push({ url: uploaded.url, publicId: uploaded.public_id });
            }
        }
    } else if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path);
        if (uploaded) {
            images.push({ url: uploaded.url, publicId: uploaded.public_id });
        }
    }

    const shop = await Shop.create({
        owner: req.user._id,
        name,
        description: description || "",
        category,
        gstNumber: gstNumber || null,
        address: {
            addressLine: addressLine || req.body.address?.addressLine || "",
            city: city || req.body.address?.city || "",
            pincode: pincode || req.body.address?.pincode || "",
            location
        },
        businessHours: {
            opensAt: opensAt || req.body.businessHours?.opensAt || "09:00",
            closesAt: closesAt || req.body.businessHours?.closesAt || "21:00",
            workingDays: workingDays || req.body.businessHours?.workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        },
        deliveryRadiusKm: deliveryRadiusKm || 5,
        images: images.length > 0 ? images : (req.body.images || [])
    });

    return res
        .status(201)
        .json(new ApiResponse(201, shop, "Shop created successfully"));
});

// @desc    Get details of logged-in user's shop
// @route   GET /api/v1/shops/my-shop
// @access  Private (Shop Owner)
const getMyShop = asyncHandler(async (req, res) => {
    const shop = await Shop.findOne({ owner: req.user._id });

    if (!shop) {
        throw new ApiError(404, "Shop not found for this user");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, shop, "Shop details retrieved successfully"));
});

// @desc    Update shop details
// @route   PUT /api/v1/shops/update/:id
// @access  Private (Shop Owner)
const updateShop = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const shop = await Shop.findById(id);

    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    if (shop.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this shop");
    }

    const {
        name,
        description,
        category,
        gstNumber,
        addressLine,
        city,
        pincode,
        latitude,
        longitude,
        coordinates,
        opensAt,
        closesAt,
        workingDays,
        isOpen,
        deliveryRadiusKm
    } = req.body;

    if (name) shop.name = name;
    if (description !== undefined) shop.description = description;
    if (category) shop.category = category;
    if (gstNumber !== undefined) shop.gstNumber = gstNumber;
    if (isOpen !== undefined) shop.isOpen = isOpen;
    if (deliveryRadiusKm !== undefined) shop.deliveryRadiusKm = deliveryRadiusKm;

    if (addressLine) shop.address.addressLine = addressLine;
    if (city) shop.address.city = city;
    if (pincode) shop.address.pincode = pincode;

    let lng = longitude;
    let lat = latitude;
    if (Array.isArray(coordinates) && coordinates.length === 2) {
        lng = coordinates[0];
        lat = coordinates[1];
    } else if (req.body.address?.location?.coordinates) {
        lng = req.body.address.location.coordinates[0];
        lat = req.body.address.location.coordinates[1];
    }

    if (lng !== undefined && lat !== undefined && !isNaN(parseFloat(lng)) && !isNaN(parseFloat(lat))) {
        shop.address.location = {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
        };
    }

    if (opensAt) shop.businessHours.opensAt = opensAt;
    if (closesAt) shop.businessHours.closesAt = closesAt;
    if (workingDays) shop.businessHours.workingDays = workingDays;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const newImages = [];
        for (const file of req.files) {
            const uploaded = await uploadOnCloudinary(file.path);
            if (uploaded) {
                newImages.push({ url: uploaded.url, publicId: uploaded.public_id });
            }
        }
        if (newImages.length > 0) {
            shop.images = [...shop.images, ...newImages];
        }
    } else if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path);
        if (uploaded) {
            shop.images.push({ url: uploaded.url, publicId: uploaded.public_id });
        }
    }

    await shop.save();

    return res
        .status(200)
        .json(new ApiResponse(200, shop, "Shop updated successfully"));
});

// @desc    Get nearby shops based on user location using 2dsphere $geoNear
// @route   GET /api/v1/shops/nearby
// @access  Public
const getNearbyShops = asyncHandler(async (req, res) => {
    const { longitude, latitude, lng, lat, maxDistance, radius, category } = req.query;

    const queryLng = parseFloat(lng || longitude);
    const queryLat = parseFloat(lat || latitude);

    if (isNaN(queryLng) || isNaN(queryLat)) {
        throw new ApiError(400, "Valid latitude and longitude query parameters are required");
    }

    // Default distance: 10km (10000m)
    let distanceInMeters = 10000;
    if (maxDistance) {
        distanceInMeters = parseFloat(maxDistance);
    } else if (radius) {
        const rad = parseFloat(radius);
        distanceInMeters = rad > 100 ? rad : rad * 1000;
    }

    const geoNearOptions = {
        near: {
            type: "Point",
            coordinates: [queryLng, queryLat]
        },
        distanceField: "distance", // distance in meters returned in output documents
        maxDistance: distanceInMeters,
        spherical: true,
        query: {}
    };

    if (category) {
        geoNearOptions.query.category = category;
    }

    if (req.query.isOpen !== undefined) {
        geoNearOptions.query.isOpen = req.query.isOpen === "true";
    }

    const shops = await Shop.aggregate([
        {
            $geoNear: geoNearOptions
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, shops, "Nearby shops retrieved successfully"));
});

export {
    createShop,
    getMyShop,
    updateShop,
    getNearbyShops
};
