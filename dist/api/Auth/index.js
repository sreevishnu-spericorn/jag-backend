import { Router } from "express";
import controller from "./controller";
import validator from "./validator";
const router = Router();
/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       content:
 *         application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *                required: true
 *                example: 'user@exmp.com'
 *              password:
 *                 type: string
 *                 required: true
 *                 minLength: 8
 *              firstName:
 *                type: string
 *                required: true
 *              lastName:
 *                type: string
 *                required: true
 *              phoneNumber:
 *                type: string
 *                required: true
 *                example: '1234567890'
 */
router.post("/signup", validator.signup, controller.signup);
/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for signup or login
 *     tags:
 *       - Auth
 */
router.post("/verify-otp", validator.verifyOtp, controller.verifyOtp);
/**
 * @swagger
 * /api/auth/loginWithOtp:
 *   post:
 *     summary: Login a user using email & password, then generates OTP
 *     tags:
 *       - Auth
 */
router.post("/loginWithOtp", validator.loginWithOtp, controller.loginWithOtp);
export default router;
//# sourceMappingURL=index.js.map