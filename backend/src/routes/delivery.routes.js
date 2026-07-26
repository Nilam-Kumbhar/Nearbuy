import { Router } from "express";
import {
    getAssignedOrders,
    updateDeliveryStatus,
    deliveryHistory
} from "../controllers/delivery.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
    "/assigned",
    verifyJWT,
    authorizeRoles("delivery"),
    getAssignedOrders
);

router.put(
    "/status/:id",
    verifyJWT,
    authorizeRoles("delivery"),
    updateDeliveryStatus
);

router.get(
    "/history",
    verifyJWT,
    authorizeRoles("delivery"),
    deliveryHistory
);

export default router;