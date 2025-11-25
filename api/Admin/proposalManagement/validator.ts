import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { failedResponse } from "../../../helper/response.ts";

const productSchema = Joi.object({
   publisherId: Joi.string().uuid().required(),
   productId: Joi.string().uuid().required(),
   quantity: Joi.number().integer().min(1).required(),
   price: Joi.number().min(0).required(),
   total: Joi.number().min(0).required(), // Total calculated on frontend/backend
});

const createSchema = Joi.object({
   clientId: Joi.string().uuid().required(),
   proposalName: Joi.string().max(255).required(),
   proposalEmail: Joi.string().email().required(),
   products: Joi.array().items(productSchema).min(1).required(),
});

const updateSchema = Joi.object({
   clientId: Joi.string().uuid().optional(),
   proposalName: Joi.string().max(255).optional(),
   proposalEmail: Joi.string().email().optional(),
   proposalStatus: Joi.string()
      .valid("Pending", "Approved", "Rejected", "Sent", "Paid")
      .optional(),
   paymentStatus: Joi.string().valid("Unpaid", "Paid", "Canceled").optional(),
   totalAmount: Joi.number().min(0).optional(),
   // For updates, the products array is optional but must match the schema if present
   products: Joi.array().items(productSchema).min(0).optional(),
}).min(1);

export async function createProposal(
   req: Request,
   res: Response,
   next: NextFunction
) {
   try {
      req.body = await createSchema.validateAsync(req.body, {
         abortEarly: false,
      });
      return next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err.message, 400));
   }
}

export async function updateProposal(
   req: Request,
   res: Response,
   next: NextFunction
) {
   try {
      req.body = await updateSchema.validateAsync(req.body, {
         abortEarly: false,
      });
      return next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err.message, 400));
   }
}

export default { createProposal, updateProposal };
