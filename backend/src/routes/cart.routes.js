import { Router } from "express";
import {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart
} from "../controllers/cart.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post(
    "/add",
    verifyJWT,
    authorizeRoles("customer"),
    addToCart
);

router.get(
    "/",
    verifyJWT,
    authorizeRoles("customer"),
    getCart
);

router.put(
    "/:id",
    verifyJWT,
    authorizeRoles("customer"),
    updateCartItem
);

router.delete(
    "/:id",
    verifyJWT,
    authorizeRoles("customer"),
    removeCartItem
);

router.delete(
    "/clear",
    verifyJWT,
    authorizeRoles("customer"),
    clearCart
);

export default router;