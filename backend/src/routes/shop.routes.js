import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    createShop,
    getMyShop,
    updateShop
} from "../controllers/shop.controller.js";

const router = Router();

router.post(
    "/create",
    verifyJWT,
    authorizeRoles("shop_owner"),
    createShop
);

router.get(
    "/my-shop",
    verifyJWT,
    authorizeRoles("shop_owner"),
    getMyShop
);

router.put(
    "/update/:id",
    verifyJWT,
    authorizeRoles("shop_owner"),
    updateShop
);

export default router;