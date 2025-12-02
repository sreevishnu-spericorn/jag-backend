import Joi from "joi";
import { Request, Response, NextFunction } from "express";

const createSchema = Joi.object({
   proposalId: Joi.string().uuid().required().messages({
      "any.required": "proposalId is required",
      "string.uuid": "proposalId must be a valid UUID",
   }),
   publisherId: Joi.string().uuid().required().messages({
      "any.required": "publisherId is required",
      "string.uuid": "publisherId must be a valid UUID",
   }),
   productId: Joi.string().uuid().required().messages({
      "any.required": "productId is required",
      "string.uuid": "productId must be a valid UUID",
   }),
   adDate: Joi.string()
      .required()
      .custom((value, helpers) => {
         if (isNaN(Date.parse(value))) {
            return helpers.error("any.invalid");
         }
         return value;
      }, "adDate validation")
      .messages({
         "any.required": "adDate is required",
         "any.invalid": "adDate must be a valid date",
      }),
   adTime: Joi.string()
      .required()
      .custom((value, helpers) => {
         if (isNaN(Date.parse(value))) {
            return helpers.error("any.invalid");
         }
         return value;
      }, "adTime validation")
      .messages({
         "any.required": "adTime is required",
         "any.invalid": "adTime must be a valid date/time",
      }),
}).unknown(true);

const updateSchema = Joi.object({
   adDate: Joi.date().optional(),
   adTime: Joi.date().optional(),
   customData: Joi.any().optional(),
});

const getByIdSchema = Joi.object({
   id: Joi.string().uuid().required(),
});

const validateBody =
   (schema: any) => (req: Request, res: Response, next: NextFunction) => {
      const { error } = schema.validate(req.body);
      if (error)
         return res
            .status(400)
            .json({ success: false, message: error.message });
      next();
   };

const validateParams =
   (schema: any) => (req: Request, res: Response, next: NextFunction) => {
      const { error } = schema.validate(req.params);
      if (error)
         return res
            .status(400)
            .json({ success: false, message: error.message });
      next();
   };

export const validateCreateAdvertisement = (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   const files = req.files as Express.Multer.File[] | undefined;

   const { error, value } = createSchema.validate(req.body, {
      abortEarly: false,
   });

   if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return res.status(400).json({ success: false, message: messages });
   }

   // Extract custom fields (exclude known required fields)
   const { proposalId, publisherId, productId, adDate, adTime, ...customData } =
      value;

   // Ensure customData or files exist
   const hasCustom =
      Object.keys(customData).length > 0 || (files && files.length > 0);

   if (!hasCustom) {
      return res.status(400).json({
         success: false,
         message:
            "customData cannot be empty. Please provide text fields or upload files.",
      });
   }

   next();
};

export default {
    validateCreateAdvertisement,
   getById: validateParams(getByIdSchema),
   update: validateBody(updateSchema),
};
