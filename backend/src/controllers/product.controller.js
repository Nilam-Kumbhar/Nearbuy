import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/Product.model.js";
import { Shop } from "../models/Shop.model.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";

// @desc    Add a new product with Cloudinary image upload
// @route   POST /api/v1/products/add
// @access  Private (Shop Owner)
const addProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        category,
        discountPercent,
        unit,
        stock,
        lowStockThreshold,
        isAvailable
    } = req.body;

    if (!name || price === undefined || !category) {
        throw new ApiError(400, "Product name, price, and category are required");
    }

    // Check if shop owner has a registered shop
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
        throw new ApiError(404, "No shop found for this owner. Please create a shop first.");
    }

    // Process image uploads via Cloudinary (same pattern as avatar upload)
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

    const product = await Product.create({
        shop: shop._id,
        category,
        name,
        description: description || "",
        price: Number(price),
        discountPercent: discountPercent ? Number(discountPercent) : 0,
        unit: unit || "1 pc",
        stock: stock !== undefined ? Number(stock) : 0,
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
        isAvailable: isAvailable !== undefined ? (isAvailable === true || isAvailable === "true") : true,
        images
    });

    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product added successfully"));
});

// @desc    Update a product details
// @route   PUT /api/v1/products/:id
// @access  Private (Shop Owner)
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Verify ownership via shop
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop || product.shop.toString() !== shop._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this product");
    }

    const {
        name,
        description,
        price,
        category,
        discountPercent,
        unit,
        stock,
        lowStockThreshold,
        isAvailable
    } = req.body;

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (category) product.category = category;
    if (discountPercent !== undefined) product.discountPercent = Number(discountPercent);
    if (unit) product.unit = unit;
    if (stock !== undefined) product.stock = Number(stock);
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);
    if (isAvailable !== undefined) product.isAvailable = isAvailable === true || isAvailable === "true";

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
            product.images = [...product.images, ...newImages];
        }
    }

    await product.save();

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product updated successfully"));
});

// @desc    Delete a product
// @route   DELETE /api/v1/products/:id
// @access  Private (Shop Owner)
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop || product.shop.toString() !== shop._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this product");
    }

    await Product.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Product deleted successfully"));
});

// @desc    Get all products with category and shop query filters
// @route   GET /api/v1/products
// @access  Public
const getAllProducts = asyncHandler(async (req, res) => {
    const { category, shop, search, isAvailable, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (category) {
        filter.category = category;
    }

    if (shop) {
        filter.shop = shop;
    }

    if (isAvailable !== undefined) {
        filter.isAvailable = isAvailable === "true";
    }

    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
        .populate("shop", "name address")
        .populate("category", "name shopCategory icon")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Product.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products,
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            },
            "Products fetched successfully"
        )
    );
});

// @desc    Get product details by ID
// @route   GET /api/v1/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id)
        .populate("shop", "name address businessHours isOpen deliveryRadiusKm rating")
        .populate("category", "name shopCategory icon");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

export {
    addProduct,
    updateProduct,
    deleteProduct,
    getAllProducts,
    getProductById
};
