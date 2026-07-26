import { Router } from "express";
import {
    checkout,
    paymentSuccess,
    paymentFailure
} from "../controllers/payment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post(
    "/checkout",
    verifyJWT,
    authorizeRoles("customer"),
    checkout
);

router.post(
    "/success",
    verifyJWT,
    authorizeRoles("customer"),
    paymentSuccess
);

router.post(
    "/failure",
    verifyJWT,
    authorizeRoles("customer"),
    paymentFailure
);

export default router;