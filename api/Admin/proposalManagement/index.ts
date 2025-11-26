import { Router } from "express";
import controller from "./controller.ts";
import validator from "./validator.ts";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProposalProduct:
 *       type: object
 *       required:
 *         - publisherId
 *         - productId
 *         - quantity
 *         - price
 *         - total
 *       properties:
 *         publisherId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated Publisher.
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated Product.
 *         quantity:
 *           type: integer
 *           minimum: 1
 *         price:
 *           type: number
 *           format: float
 *         total:
 *           type: number
 *           format: float
 *   tags:
 *     - name: Proposals
 *       description: Proposal Management
 */

/**
 * @swagger
 * /api/admin/proposalManagement/create:
 *   post:
 *     summary: Create a new proposal with associated products
 *     tags: [Proposals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - proposalName
 *               - products
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the client this proposal is for.
 *               proposalName:
 *                 type: string
 *               ccEmail:
 *                 type: string
 *                 format: email
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProposalProduct'
 *                 minItems: 1
 *             example:
 *               clientId: "c4d3e2a1-b0c9-8d7f-6e5a-4b3c2d1e0f98"
 *               proposalName: "Q4 Marketing Campaign"
 *               ccEmail: "contact@clientcorp.com"
 *               products:
 *                 - publisherId: "p1111111-a1b2-c3d4-e5f6-a1b2c3d4e5f6"
 *                   productId: "i2222222-a1b2-c3d4-e5f6-a1b2c3d4e5f6"
 *                   quantity: 5
 *                   price: 100.00
 *                   total: 500.00
 *                 - publisherId: "p3333333-a1b2-c3d4-e5f6-a1b2c3d4e5f6"
 *                   productId: "i4444444-a1b2-c3d4-e5f6-a1b2c3d4e5f6"
 *                   quantity: 2
 *                   price: 2250.25
 *                   total: 4500.50
 *     responses:
 *       201:
 *         description: Proposal created successfully
 *       400:
 *         description: Invalid request payload or validation failure
 */
router.post("/create", validator.createProposal, controller.createProposal);

/**
 * @swagger
 * /api/admin/proposalManagement/list:
 *   get:
 *     summary: Get all proposals with pagination and search
 *     tags: [Proposals]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by proposal name, email, or client name.
 *     responses:
 *       200:
 *         description: Proposal list fetched successfully
 */
router.get("/list", controller.getProposals);

/**
 * @swagger
 * /api/admin/proposalManagement/{id}:
 *   get:
 *     summary: Get proposal details by ID (includes nested products)
 *     tags: [Proposals]
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

/**
 * @swagger
 * /api/admin/proposalManagement/{id}:
 *   put:
 *     summary: Update proposal details and associated products
 *     tags: [Proposals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proposalName:
 *                 type: string
 *               proposalStatus:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected, Sent, Paid]
 *               paymentStatus:
 *                 type: string
 *                 enum: [Unpaid, Paid, Canceled]
 *               ccEmail:
 *                 type: string
 *                 format: email
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProposalProduct'
 *                 description: Provide the full, new list of products. Products not in this list will be deleted.
 *                 minItems: 1
 *     responses:
 *       200:
 *         description: Proposal updated successfully
 *       400:
 *         description: Invalid request or product data
 *       404:
 *         description: Proposal not found
 */
router.put("/:id", validator.updateProposal, controller.updateProposal);

/**
 * @swagger
 * /api/admin/proposalManagement/{id}:
 *   delete:
 *     summary: Soft delete a proposal
 *     tags: [Proposals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Proposal deleted successfully
 *       400:
 *         description: Invalid ID or deletion failed
 */
router.delete("/:id", controller.deleteProposal);

export default router;
