import { Router } from "express";
import {
    placeOrder,
    getMyOrders,
    getOrderById,
    cancelOrder
} from "../controllers/order.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

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

router.get(
    "/:id",
    verifyJWT,
    authorizeRoles("customer"),
    getOrderById
);

router.put(
    "/cancel/:id",
    verifyJWT,
    authorizeRoles("customer"),
    cancelOrder
);

export default router;