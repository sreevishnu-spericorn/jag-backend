import { Router } from "express";
import controller from "./controller.ts";
import validator from "./validator.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Admin Profile Management API
 */

/**
 * @swagger
 * /api/admin/profileManagement/me:
 *   get:
 *     summary: Get the current logged-in admin profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     roleId:
 *                       type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized or missing token
 *       403:
 *         description: Invalid or expired token
 */
router.get("/me", controller.getProfile);

/**
 * @swagger
 * /api/admin/profileManagement/update:
 *   put:
 *     summary: Update the current logged-in admin profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Super"
 *               lastName:
 *                 type: string
 *                 example: "Admin"
 *               email:
 *                 type: string
 *                 example: "admin@mailinator.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "9999999999"
 *               password:
 *                 type: string
 *                 example: "newStrongPassword123"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     roleId:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid or expired token
 */
router.put("/update", validator.updateProfile, controller.updateProfile);

/**
 * @swagger
 * /api/admin/profileManagement/change-password:
 *   put:
 *     summary: Change admin password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "oldPass123"
 *               newPassword:
 *                 type: string
 *                 example: "NewStrongPass@123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or incorrect password
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid or expired token
 */
router.put(
   "/change-password",
   validator.changePassword,
   controller.changePassword
);

/**
 * @swagger
 * /api/admin/profileManagement/logout:
 *   post:
 *     summary: Logout the admin and clear all credentials
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post("/logout", controller.logout);

export default router;
