import { Router } from "express";
import controller from "./controller.ts";
import validator from "./validator.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product Management API
 */

/**
 * @swagger
 * /api/admin/productManagement/create:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "Premium Pack"
 *               customFields:
 *                 type: array
 *                 description: Array of dynamic custom field definitions
 *                 items:
 *                   oneOf:
 *                     - $ref: "#/components/schemas/TextField"
 *                     - $ref: "#/components/schemas/UploadField"
 *             example:
 *               productName: "Premium Pack"
 *               customFields:
 *                 - fieldType: "text"
 *                   fieldLabel: "Title"
 *                   allowedFormats: []
 *                   characterLimit: 100
 *                 - fieldType: "text"
 *                   fieldLabel: "Description"
 *                   allowedFormats: []
 *                   characterLimit: 350
 *                 - fieldType: "upload"
 *                   fieldLabel: "Post"
 *                   widthPx: 1980
 *                   heightPx: 1980
 *                   maxFileSizeMB: 10
 *                   allowedFormats: ["png", "jpeg", "jpg"]
 *                   characterLimit: 250
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation or duplication error
 *       500:
 *         description: Server error
 */

router.post("/create", validator.createProduct, controller.createProduct);

/**
 * @swagger
 * /api/admin/productManagement/list:
 *   get:
 *     summary: Get all products with pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Successfully found products
 *       500:
 *         description: Internal server error
 */
router.get("/list", controller.getProducts);

/**
 * @swagger
 * /api/admin/productManagement/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       404:
 *         description: Product not found
 */
router.get("/:id", controller.getProductById);

/**
 * @swagger
 * /api/admin/productManagement/{id}:
 *   put:
 *     summary: Update product details
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "Updated Product Name"
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", validator.updateProduct, controller.updateProduct);

/**
 * @swagger
 * /api/admin/productManagement/{id}:
 *   delete:
 *     summary: Delete or disable a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", controller.deleteProduct);

export default router;
