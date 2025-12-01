import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { failedResponse } from "../../../helper/response.ts";

const customFieldSchema = Joi.object({
  fieldType: Joi.string().valid("text", "upload").required(),
  fieldLabel: Joi.string().required(),
  characterLimit: Joi.number().integer().min(1).optional(),
  allowedFormats: Joi.array().items(Joi.string()).optional(),
  maxFileSizeMB: Joi.number().positive().optional().allow(null).empty(""),
  widthPx: Joi.number().positive().optional().allow(null).empty(""),
  heightPx: Joi.number().positive().optional().allow(null).empty(""),
  isMultipleUpload: Joi.boolean().optional(),
  maxUploadCount: Joi.number().integer().min(1).optional(),
});

const createSchema = Joi.object({
  productName: Joi.string().required(),
  customFields: Joi.array().items(customFieldSchema).min(1).required(),
});

const updateSchema = Joi.object({
  productName: Joi.string().optional(),
  status: Joi.boolean().optional(),
  customFields: Joi.array().items(customFieldSchema).optional(),
}).min(1);

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    req.body = await createSchema.validateAsync(req.body, { abortEarly: false });
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
    req.body = await updateSchema.validateAsync(req.body, { abortEarly: false });
    return next();
  } catch (err: any) {
    return res.status(400).json(failedResponse(err.message, 400));
  }
}

export default { createProduct, updateProduct };
