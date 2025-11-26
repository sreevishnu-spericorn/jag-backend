import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { failedResponse } from "../../../../helper/response.ts";

const createPaymentSchema = Joi.object({
   proposalId: Joi.string().uuid().required(),
});

export async function validateCreatePaymentIntent(
   req: Request,
   res: Response,
   next: NextFunction
) {
   try {
      req.body = await createPaymentSchema.validateAsync(req.body, {
         abortEarly: false,
      });
      return next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err.message, 400));
   }
}

export default {
   validateCreatePaymentIntent,
};
