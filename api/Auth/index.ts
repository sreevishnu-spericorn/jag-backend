import { Router } from "express";
import controller from "./controller.ts";
import validator from "./validator.ts";

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
 *     responses:
 *       200:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 *
 */
router.post("/signup", validator.signup, controller.signup);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for signup or login
 *     tags:
 *       - Auth
 *     requestBody:
 *       content:
 *         application/json:
 *          schema:
 *            type: object
 *            properties:
 *              otp:
 *                type: string
 *                required: true
 *                example: '123456'
 *              accessToken:
 *                type: string
 *                required: true
 *                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP or token
 *       401:
 *         description: Token expired
 *       500:
 *         description: Internal server error
 */

router.post("/verify-otp", validator.verifyOtp, controller.verifyOtp);

/**
 * @swagger
 * /api/auth/loginWithOtp:
 *   post:
 *     summary: Login a user using email and password, generates OTP
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 required: true
 *                 example: 'user@example.com'
 *               password:
 *                 type: string
 *                 required: true
 *                 minLength: 8
 *                 example: 'Password@123'
 *     responses:
 *       200:
 *         description: OTP sent to email, temp token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     tempToken:
 *                       type: string
 *                       description: Temporary token for OTP verification
 *       400:
 *         description: Bad request / invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post("/loginWithOtp", validator.loginWithOtp, controller.loginWithOtp);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 required: true
 *                 example: 'user@example.com'
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 *       400:
 *         description: Invalid email or user not found
 *       500:
 *         description: Internal server error
 */
router.post(
   "/forgot-password",
   validator.forgotPassword,
   controller.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password using token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 required: true
 *                 example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *               newPassword:
 *                 type: string
 *                 required: true
 *                 minLength: 8
 *                 example: 'NewPassword@123'
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.post(
   "/reset-password",
   validator.resetPassword,
   controller.resetPassword
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", controller.refreshToken);

export default router;
