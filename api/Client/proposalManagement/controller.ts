import { Request, Response } from "express";
import service, { getClientProposalsService } from "./service.ts";
import { goodResponse, failedResponse } from "../../../helper/response.ts";
import { AuthRequest } from "../../../middleware/auth.ts";


export const getClientProposals = async (req: AuthRequest, res: Response) => {
   try {
      const userId = req.user?.id;

      if (!userId) {
         return res.status(401).json({
            success: false,
            message: "Unauthorized - User ID missing",
         });
      }

      const result = await getClientProposalsService(userId, req.query);
      return res.json(goodResponse(result, "Proposal list fetched"));
   } catch (err: any) {
      return res.status(400).json({
         success: false,
         message: err.message,
      });
   }
};

const getProposalById = async (req: Request, res: Response) => {
   try {
      const result = await service.getProposalById(req.params.id);
      return res.json(goodResponse(result, "Proposal fetched"));
   } catch (error: any) {
      return res.status(404).json(failedResponse(error.message, 404));
   }
};

export default {
   getClientProposals,
   getProposalById,
};
