import { Response } from "express";
import service from "./service.ts";
import { goodResponse, failedResponse } from "../../../../helper/response.ts";

import { AuthRequest } from "../../../../middleware/auth.ts";

const createPaymentIntent = async (req: AuthRequest, res: Response) => {
   try {
      const adminId = req.user!.id;

      const result = await service.createPaymentIntent({
         proposalId: req.body.proposalId,
         adminId,
      });

      return res.json(goodResponse(result, "Payment Intent created"));
   } catch (error: any) {
      return res
         .status(400)
         .json(failedResponse(error.message, error.statusCode || 400));
   }
};

export default {
   createPaymentIntent,
};
