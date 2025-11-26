import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { failedResponse } from "../../../helper/response.ts";

const updateSchema = Joi.object({
   firstName: Joi.string().optional(),
   lastName: Joi.string().optional(),
   email: Joi.string().email().optional(),
   phoneNumber: Joi.string().optional(),
}).min(1);

export async function updateProfile(
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

const passwordSchema = Joi.object({
   currentPassword: Joi.string().required(),
   newPassword: Joi.string().min(6).required(),
});

export async function changePassword(
   req: Request,
   res: Response,
   next: NextFunction
) {
   try {
      req.body = await passwordSchema.validateAsync(req.body, {
         abortEarly: false,
      });
      next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err.message, 400));
   }
}

export default { updateProfile, changePassword };
