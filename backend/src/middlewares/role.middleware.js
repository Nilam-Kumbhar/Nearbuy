// customer/shop/delivery guard
import { ApiError } from "../utils/ApiError.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user exists (added by verifyJWT)
        if (!req.user) {
            throw new ApiError(401, "Unauthorized. Please login first.");
        }

        // Check if user's role is allowed
        if (!allowedRoles.includes(req.user.role)) {
            throw new ApiError(
                403,
                "Forbidden. You do not have permission to access this resource."
            );
        }

        next();
    };
};