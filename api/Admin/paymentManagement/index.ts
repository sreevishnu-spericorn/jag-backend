import { Router } from "express";
import {
   getAllPaymentsController,
   getPaymentByIdController,
} from "./controller.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment Management API
 */

/**
 * @swagger
 * /api/admin/paymentManagement/list:
 *   get:
 *     summary: Get all payments (supports pagination and optional filters)
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: proposalId
 *         schema:
 *           type: string
 *         description: Filter payments by proposal ID
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter payments created after this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter payments created before this date
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     payments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           proposalId:
 *                             type: string
 *                           stripePaymentId:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           currency:
 *                             type: string
 *                           status:
 *                             type: string
 *                           paymentMethod:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                           updatedAt:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.get("/list", getAllPaymentsController);


/**
 * @swagger
 * /api/admin/paymentManagement/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     proposalId:
 *                       type: string
 *                     stripePaymentId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     status:
 *                       type: string
 *                     paymentMethod:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: Payment not found
 */
router.get("/:id", getPaymentByIdController);

export default router;
