import { Request, Response, NextFunction } from "express";
import Joi from "joi";

import { failedResponse } from "../../helper/response.ts";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRegex =
   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;

export async function signup(req: Request, res: Response, next: NextFunction) {
   const schema = Joi.object({
      email: Joi.string()
         .required()
         .lowercase()
         .trim()
         .regex(emailRegex)
         .message("Please Provide a Valid Email ID"),

      password: Joi.string()
         .required()
         .regex(passwordRegex)
         .message(
            "Password must be at least 8 chars and contain uppercase, lowercase, number and special character."
         ),

      firstName: Joi.string()
         .trim()
         .regex(/^[\p{Letter}\s\-.']+$/u)
         .required(),

      lastName: Joi.string()
         .trim()
         .regex(/^[\p{Letter}\s\-.']+$/u)
         .required(),

      phoneNumber: Joi.string()
         .trim()
         .regex(/^\+?[0-9]{7,15}$/)
         .message("Invalid phone number format"),
   }).options({ stripUnknown: true });

   try {
      req.body = await schema.validateAsync(req.body);
      return next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err.message, 400));
   }
}

export async function verifyOtp(
   req: Request,
   res: Response,
   next: NextFunction
) {
   const schema = Joi.object({
      otp: Joi.string().length(6).required(),
      accessToken: Joi.string().required(),
   });

   try {
      req.body = await schema.validateAsync(req.body, { abortEarly: false });
      return next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err.message, 400));
   }
}

export async function loginWithOtp(
   req: Request,
   res: Response,
   next: NextFunction
) {
   const schema = Joi.object({
      email: Joi.string()
         .required()
         .trim()
         .lowercase()
         .regex(emailRegex)
         .message("Please provide a valid email"),

      password: Joi.string().required(),
   });

   try {
      req.body = await schema.validateAsync(req.body, { abortEarly: false });
      return next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err.message, 400));
   }
}

async function forgotPassword(req: Request, res: Response, next: NextFunction) {
   const schema = Joi.object({
      email: Joi.string()
         .required()
         .trim()
         .lowercase()
         .regex(emailRegex)
         .message("Please provide a valid email"),
   });

   try {
      req.body = await schema.validateAsync(req.body, { abortEarly: false });
      next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err.message, 400));
   }
}

async function resetPassword(req: Request, res: Response, next: NextFunction) {
   const schema = Joi.object({
      token: Joi.string().required().messages({
         "string.empty": "Reset token is required",
      }),
      newPassword: Joi.string()
         .required()
         .regex(passwordRegex)
         .message(
            "Password must be at least 8 characters, include uppercase, lowercase, digit, and special character"
         ),
   });

   try {
      req.body = await schema.validateAsync(req.body, { abortEarly: false });
      next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err?.message, 400));
   }
}

export default {
   signup,
   verifyOtp,
   loginWithOtp,
   forgotPassword,
   resetPassword,
};
