import { Router } from "express";
import {
    placeOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getShopOrders,
    updateOrderStatus
} from "../controllers/order.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Customer Routes
router.post(
    "/place",
    verifyJWT,
    authorizeRoles("customer"),
    placeOrder
);

router.get(
    "/my-orders",
    verifyJWT,
    authorizeRoles("customer"),
    getMyOrders
);

// Shop Owner Routes
router.get(
    "/shop-orders",
    verifyJWT,
    authorizeRoles("shop_owner"),
    getShopOrders
);

router.get(
    "/:id",
    verifyJWT,
    authorizeRoles("customer", "shop_owner", "delivery"),
    getOrderById
);

router.put(
    "/cancel/:id",
    verifyJWT,
    authorizeRoles("customer"),
    cancelOrder
);



router.put(
    "/status/:id",
    verifyJWT,
    authorizeRoles("shop_owner"),
    updateOrderStatus
);

export default router;