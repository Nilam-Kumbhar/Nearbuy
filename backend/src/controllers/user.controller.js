import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import { User } from "../models/user.model.js";
import { genrateAccessandRefreshTokens } from "../utils/generateToken.js";


const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, role, phone } = req.body;

    // 1. Field validation
    if (!username?.trim() || !email?.trim() || !password?.trim() || !phone?.trim()) {
        throw new ApiError(400, "All fields (username, email, password, phone) are required.");
    }

    // 2. Role normalization
    let targetRole = (role || "customer").toLowerCase().trim();
    if (targetRole === "vendor" || targetRole === "shopowner") {
        targetRole = "shop_owner";
    }

    if (!["customer", "shop_owner", "delivery"].includes(targetRole)) {
        throw new ApiError(400, "Invalid user role specified.");
    }

    // 3. Existing user check
    const existedUser = await User.findOne({
        $or: [
            { username: username.toLowerCase().trim() },
            { email: email.toLowerCase().trim() },
            { phone: phone.trim() }
        ]
    });

    if (existedUser) {
        throw new ApiError(409, "User with this email, username, or phone number already exists.");
    }

    // 4. Avatar processing with fallback
    let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username.trim())}&background=0D8ABC&color=fff`;
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (avatarLocalPath) {
        try {
            const avatar = await uploadOnCloudinary(avatarLocalPath);
            if (avatar?.url) {
                avatarUrl = avatar.url;
            }
        } catch (uploadError) {
            console.warn("Avatar Cloudinary upload error, using fallback:", uploadError);
        }
    }

    // 5. User creation
    const user = await User.create({
        role: targetRole,
        email: email.toLowerCase().trim(),
        password: password.trim(),
        avatar: avatarUrl,
        phone: phone.trim(),
        username: username.toLowerCase().trim()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully.")
    );
});

// @desc    Login user
// @route   POST /api/v1/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user password");
    }

    const { accessToken, refreshToken } = await genrateAccessandRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});

// @desc    Logout user
// @route   POST /api/v1/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// @desc    Get current logged in user details
// @route   GET /api/v1/users/current-user
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser
};