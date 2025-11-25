import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { failedResponse } from "../../../helper/response.ts";

const createSchema = Joi.object({
   accountName: Joi.string().required(),
   contactName: Joi.string().required(),
   email: Joi.string().email().required(),
   phone: Joi.string().min(8).required(),
   sendWelcome: Joi.boolean(),
});

const updateSchema = Joi.object({
   accountName: Joi.string().optional(),
   contactName: Joi.string().optional(),
   email: Joi.string().email().optional(),
   phone: Joi.string().optional(),
   welcomeEmail: Joi.boolean().optional(),

   // logo will be available as req.file so skip strict validation
   logo: Joi.any().optional(),
}).min(1);

export async function createClient(
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

export async function updateClient(
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

export default { createClient, updateClient };
