import { Router } from "express";
import controller from "./controller.ts";
import validator from "./validator.ts";
import upload from "../../../middleware/publisherUpload.ts"; 

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Publishers
 *   description: Publisher Management
 */

/**
 * @swagger
 * /api/admin/publisherManagement/create:
 *   post:
 *     summary: Create a new publisher
 *     tags: [Publishers]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - publisherName
 *               - email
 *               - products
 *             properties:
 *               publisherName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNo:
 *                 type: string
 *               whatsappNo:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               w9Files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               products:
 *                 type: string
 *                 description: JSON array of products
 *                 example: '[{"productId":"uuid-here","price":20.5},{"productId":"uuid-here","price":50}]'
 *     responses:
 *       201:
 *         description: Publisher created successfully
 *       400:
 *         description: Validation error
 */


router.post(
   "/create",
   upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "w9Files", maxCount: 10 },
   ]),
   validator.createPublisher,
   controller.createPublisher
);

/**
 * @swagger
 * /api/admin/publisherManagement/list:
 *   get:
 *     summary: Get publishers with pagination
 *     tags: [Publishers]
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
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/list", controller.getPublishers);

/**
 * @swagger
 * /api/admin/publisherManagement/{id}:
 *   get:
 *     summary: Get publisher details by ID
 *     tags: [Publishers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:id", controller.getPublisherById);

/**
 * @swagger
 * /api/admin/publisherManagement/{id}:
 *   put:
 *     summary: Update publisher details
 *     tags: [Publishers]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               publisherName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNo:
 *                 type: string
 *               whatsappNo:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               w9Files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     price:
 *                       type: number
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put(
   "/:id",
   upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "w9Files", maxCount: 10 },
   ]),
   validator.updatePublisher,
   controller.updatePublisher
);

/**
 * @swagger
 * /api/admin/publisherManagement/{id}:
 *   delete:
 *     summary: Soft delete a publisher
 *     tags: [Publishers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.delete("/:id", controller.deletePublisher);

export default router;
