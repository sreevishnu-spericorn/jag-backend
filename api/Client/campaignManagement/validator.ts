import Joi from "joi";
import { Request, Response, NextFunction } from "express";

const getByIdSchema = Joi.object({
   id: Joi.string().uuid().required(),
});

const validate =
   (schema: any) => (req: Request, res: Response, next: NextFunction) => {
      const { error } = schema.validate(req.params);
      if (error) {
         return res.status(400).json({
            success: false,
            message: error.message,
         });
      }
      next();
   };

export default {
   getById: validate(getByIdSchema),
};
