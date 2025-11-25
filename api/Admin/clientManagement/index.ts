import { Router } from "express";
import controller from "./controller.ts";
import validator from "./validator.ts";
import upload from "../../../middleware/upload.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Client Management
 */

/**
 * @swagger
 * /api/admin/clientManagement/create:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - accountName
 *               - contactName
 *               - email
 *               - phone
 *             properties:
 *               accountName:
 *                 type: string
 *               contactName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               sendWelcome:
 *                 type: boolean
 *                 example: false
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Client created
 *       400:
 *         description: Invalid request
 */

router.post(
   "/create",
   upload.single("logo"),
   validator.createClient,
   controller.createClient
);

/**
 * @swagger
 * /api/admin/clientManagement/list:
 *   get:
 *     summary: Get all clients with pagination
 *     tags: [Clients]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client list fetched successfully
 */

router.get("/list", controller.getClients);

/**
 * @swagger
 * /api/admin/clientManagement/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Client not found
 */

router.get("/:id", controller.getClientById);

/**
 * @swagger
 * /api/admin/clientManagement/{id}:
 *   put:
 *     summary: Update client details
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Client updated
 */

router.put("/:id",  upload.single("logo"), validator.updateClient, controller.updateClient);

/**
 * @swagger
 * /api/admin/clientManagement/{id}:
 *   delete:
 *     summary: Soft delete client
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: Deleted successfully
 */

router.delete("/:id", controller.deleteClient);

export default router;
