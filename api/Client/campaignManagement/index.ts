import { Router } from "express";
import controller from "./controller.ts";
import validator from "./validator.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Client Campaigns
 *   description: Client campaign management
 */

/**
 * @swagger
 * /api/client/campaignManagement/list:
 *   get:
 *     summary: Get approved & paid campaigns for a client (with pagination + caching)
 *     tags: [Client Campaigns]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: "Items per page (default: 10, max: 100)"
 *     responses:
 *       200:
 *         description: Campaign list fetched successfully
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
 *                     campaigns:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           proposalName:
 *                             type: string
 *                           proposalStatus:
 *                             type: string
 *                           paymentStatus:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                           updatedAt:
 *                             type: string
 *                           products:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 quantity:
 *                                   type: number
 *                                 price:
 *                                   type: number
 *                                 total:
 *                                   type: number
 *                                 product:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: string
 *                                     productName:
 *                                       type: string
 *                                 publisher:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: string
 *                                     publisherName:
 *                                       type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */

router.get("/list", controller.getClientCampaigns);

/**
 * @swagger
 * /api/client/campaignManagement/{id}:
 *   get:
 *     summary: Get single campaign by proposalProduct ID
 *     tags: [Client Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign (proposalProduct) ID
 *     responses:
 *       200:
 *         description: Campaign fetched successfully
 */
router.get("/:id", validator.getById, controller.getClientCampaignById);

export default router;
