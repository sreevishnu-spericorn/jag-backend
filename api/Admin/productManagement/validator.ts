import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { failedResponse } from "../../../helper/response.ts";

const createSchema = Joi.object({
   productName: Joi.string().required(),
});

const updateSchema = Joi.object({
   productName: Joi.string(),
   status: Joi.boolean(),
}).min(1);

export async function createProduct(
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

export async function updateProduct(
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

export default { createProduct, updateProduct };
