import { Router } from "express";
import {
    addReview,
    updateReview,
    deleteReview,
    getProductReviews
} from "../controllers/review.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post(
    "/add",
    verifyJWT,
    authorizeRoles("customer"),
    upload.array("images", 5),
    addReview
);

router.put(
    "/:id",
    verifyJWT,
    authorizeRoles("customer"),
    upload.array("images", 5),
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