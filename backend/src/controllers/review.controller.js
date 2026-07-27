import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Review } from "../models/Review,model.js";
import { Order } from "../models/Order.model.js";
import { Shop } from "../models/Shop.model.js";
import { DeliveryPartner } from "../models/DeliveryPartner.model.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";

// Helper function to recalculate and update aggregate rating
const updateTargetRating = async (targetType, targetId) => {
    const reviews = await Review.find({ targetType, targetId });
    const count = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = count > 0 ? Number((totalRating / count).toFixed(1)) : 0;

    if (targetType === "Shop") {
        await Shop.findByIdAndUpdate(targetId, {
            "rating.average": average,
            "rating.count": count
        });
    } else if (targetType === "DeliveryPartner") {
        await DeliveryPartner.findByIdAndUpdate(targetId, {
            "rating.average": average,
            "rating.count": count
        });
    }
};

// @desc    Add a review for Shop, Product, or DeliveryPartner
// @route   POST /api/v1/reviews/add
// @access  Private (Customer)
const addReview = asyncHandler(async (req, res) => {
    const { orderId, order, targetType = "Product", targetId, rating, comment } = req.body;

    const actualOrderId = orderId || order;

    if (!actualOrderId || !targetId || !rating) {
        throw new ApiError(400, "Order ID, target ID, and rating are required");
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        throw new ApiError(400, "Rating must be a number between 1 and 5");
    }

    const allowedTargetTypes = ["Shop", "Product", "DeliveryPartner"];
    if (!allowedTargetTypes.includes(targetType)) {
        throw new ApiError(400, `Invalid targetType. Allowed: ${allowedTargetTypes.join(", ")}`);
    }

    // Verify order exists and belongs to customer
    const orderDoc = await Order.findById(actualOrderId);
    if (!orderDoc) {
        throw new ApiError(404, "Order not found");
    }

    if (orderDoc.customer.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to review this order");
    }

    if (orderDoc.status !== "delivered") {
        throw new ApiError(400, "You can only review delivered orders");
    }

    // Check if review already exists for this order & target
    const existingReview = await Review.findOne({
        order: actualOrderId,
        targetType,
        targetId
    });

    if (existingReview) {
        throw new ApiError(400, `You have already reviewed this ${targetType} for this order`);
    }

    // Handle optional image uploads
    let imageFiles = [];
    if (req.files) {
        if (Array.isArray(req.files)) {
            imageFiles = req.files;
        } else if (req.files.images) {
            imageFiles = req.files.images;
        }
    } else if (req.file) {
        imageFiles = [req.file];
    }

    const images = [];
    for (const file of imageFiles) {
        const uploaded = await uploadOnCloudinary(file.path);
        if (uploaded) {
            images.push({
                url: uploaded.url,
                publicId: uploaded.public_id
            });
        }
    }

    const review = await Review.create({
        customer: req.user._id,
        order: actualOrderId,
        targetType,
        targetId,
        rating: numRating,
        comment: comment || "",
        images
    });

    // Flag order as rated
    orderDoc.isRated = true;
    await orderDoc.save();

    // Recalculate and update rating summary on target
    await updateTargetRating(targetType, targetId);

    return res
        .status(201)
        .json(new ApiResponse(201, review, "Review added successfully"));
});

// @desc    Update an existing review
// @route   PUT /api/v1/reviews/:id
// @access  Private (Customer)
const updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    if (review.customer.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this review");
    }

    if (rating !== undefined) {
        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            throw new ApiError(400, "Rating must be a number between 1 and 5");
        }
        review.rating = numRating;
    }

    if (comment !== undefined) {
        review.comment = comment;
    }

    // Handle new images if provided
    let imageFiles = [];
    if (req.files) {
        if (Array.isArray(req.files)) {
            imageFiles = req.files;
        } else if (req.files.images) {
            imageFiles = req.files.images;
        }
    } else if (req.file) {
        imageFiles = [req.file];
    }

    if (imageFiles.length > 0) {
        const newImages = [];
        for (const file of imageFiles) {
            const uploaded = await uploadOnCloudinary(file.path);
            if (uploaded) {
                newImages.push({
                    url: uploaded.url,
                    publicId: uploaded.public_id
                });
            }
        }
        if (newImages.length > 0) {
            review.images = [...review.images, ...newImages];
        }
    }

    await review.save();

    // Recalculate rating on target
    await updateTargetRating(review.targetType, review.targetId);

    return res
        .status(200)
        .json(new ApiResponse(200, review, "Review updated successfully"));
});

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private (Customer)
const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    if (review.customer.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this review");
    }

    const { targetType, targetId } = review;

    await Review.findByIdAndDelete(id);

    // Recalculate target rating
    await updateTargetRating(targetType, targetId);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Review deleted successfully"));
});

// @desc    Get reviews for a product or target entity (Shop, Product, DeliveryPartner)
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { targetType = "Product", page = 1, limit = 10 } = req.query;

    const targetId = productId || req.query.targetId;

    if (!targetId) {
        throw new ApiError(400, "Product or target ID is required");
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = { targetType, targetId };

    const reviews = await Review.find(filter)
        .populate("customer", "username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Review.countDocuments(filter);

    // Calculate aggregate summary
    const allReviews = await Review.find(filter).select("rating");
    const count = allReviews.length;
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = count > 0 ? Number((sum / count).toFixed(1)) : 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                reviews,
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                averageRating,
                totalReviews: count
            },
            "Reviews retrieved successfully"
        )
    );
});

export {
    addReview,
    updateReview,
    deleteReview,
    getProductReviews
};
