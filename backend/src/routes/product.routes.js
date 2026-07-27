import { Router } from "express";
import {
    addProduct,
    updateProduct,
    deleteProduct,
    getAllProducts,
    getProductById
} from "../controllers/product.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public Routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Shop Owner Routes
router.post(
    "/add",
    verifyJWT,
    authorizeRoles("shop_owner"),
    upload.array("images", 5),
    addProduct
);

router.put(
    "/:id",
    verifyJWT,
    authorizeRoles("shop_owner"),
    upload.array("images", 5),
    updateProduct
);

router.delete(
    "/:id",
    verifyJWT,
    authorizeRoles("shop_owner"),
    deleteProduct
);

export default router;