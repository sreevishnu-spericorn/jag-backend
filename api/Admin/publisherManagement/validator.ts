import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { failedResponse } from "../../../helper/response.ts";

const updateSchema = Joi.object({
   publisherName: Joi.string().optional(),
   email: Joi.string().email().optional(),
   phoneNo: Joi.string().optional(),
   whatsappNo: Joi.string().optional(),
   description: Joi.string().optional(),
   products: Joi.alternatives()
      .try(
         Joi.string(),
         Joi.array().items(
            Joi.object({
               productId: Joi.string().required(),
               price: Joi.number().required(),
            })
         )
      )
      .optional(),
   removedW9Files: Joi.alternatives()
      .try(
         Joi.string(), // allow JSON string
         Joi.array().items(Joi.string())
      )
      .optional(),
}).min(1); // must update at least one

const createSchema = Joi.object({
   publisherName: Joi.string().required(),
   email: Joi.string().email().required(),
   phoneNo: Joi.string().min(6).optional(),
   whatsappNo: Joi.string().min(6).optional(),
   description: Joi.string().optional(),

   products: Joi.array()
      .items(
         Joi.object({
            productId: Joi.string().guid({ version: "uuidv4" }).required(),
            price: Joi.number().min(0).required(),
         })
      )
      .required(),
});

export async function createPublisher(
   req: Request,
   res: Response,
   next: NextFunction
) {
   try {
      // Parse JSON string to array of objects
      if (req.body.products && typeof req.body.products === "string") {
         try {
            req.body.products = JSON.parse(req.body.products);
         } catch (err) {
            return res
               .status(400)
               .json(
                  failedResponse(
                     "Products must be a valid JSON array of objects",
                     400
                  )
               );
         }
      }

      // Validate array of objects
      req.body = await createSchema.validateAsync(req.body, {
         abortEarly: false,
      });

      return next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err.message, 400));
   }
}

export async function updatePublisher(
   req: Request,
   res: Response,
   next: NextFunction
) {
   try {
      if (typeof req.body === "string") {
         try {
            req.body = JSON.parse(req.body);
         } catch {}
      }

      req.body = await updateSchema.validateAsync(req.body, {
         abortEarly: false,
      });

      return next();
   } catch (err: any) {
      return res.status(400).json(failedResponse(err.message, 400));
   }
}

export default { createPublisher, updatePublisher };
