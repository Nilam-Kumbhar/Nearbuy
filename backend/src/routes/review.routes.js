import { Router } from "express";
import {
    addReview,
    updateReview,
    deleteReview,
    getProductReviews
} from "../controllers/review.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post(
    "/add",
    verifyJWT,
    authorizeRoles("customer"),
    addReview
);

router.put(
    "/:id",
    verifyJWT,
    authorizeRoles("customer"),
    updateReview
);

router.delete(
    "/:id",
    verifyJWT,
    authorizeRoles("customer"),
    deleteReview
);

router.get(
    "/product/:productId",
    getProductReviews
);

export default router;