import { Router } from "express";
import { registerUser,loginUser,getCurrentUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router=Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

// Protected route (Customer only)
router.route("/current-user").get(
    verifyJWT,
    authorizeRoles("customer"),
    getCurrentUser
);

export default router