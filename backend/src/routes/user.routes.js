import { Router } from "express";
import { registerUser,loginUser,getCurrentUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        }
    ]),
    registerUser)
router.route("/login").post(loginUser)

// Protected route (Customer only)
router.route("/current-user").get(
    verifyJWT,
    authorizeRoles("customer"),
    getCurrentUser
);

export default router