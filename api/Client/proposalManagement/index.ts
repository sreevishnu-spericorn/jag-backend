import { Router } from "express";
import controller from "./controller.ts";

const router = Router();

/**
 * @swagger
 * /api/client/proposalManagement/list:
 *   get:
 *     summary: Get proposals for the logged-in client with pagination & search
 *     description: |
 *       Fetches proposals belonging **only to the authenticated Client user**.
 *       Supports pagination, search, and date range filtering.
 *     tags: [Client Proposals]
 *     security:
 *       - bearerAuth: []   # This ensures Swagger knows token is required
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of proposals per page
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by proposal name or client accountName
 *
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter proposals created after this date
 *
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter proposals created before this date
 *
 *     responses:
 *       200:
 *         description: Client proposals fetched successfully
 *       401:
 *         description: Unauthorized – Token missing or invalid
 */
router.get("/list", controller.getClientProposals);

/**
 * @swagger
 * /api/client/proposalManagement/{id}:
 *   get:
 *     summary: Get proposal details by ID (includes nested products)
 *     tags: [Client Proposals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Proposal fetched successfully
 *       404:
 *         description: Proposal not found
 */
router.get("/:id", controller.getProposalById);


export default router;
