import { goodResponse } from "../../../helper/response.ts";
import { AuthRequest } from "../../../middleware/auth.ts";
import { Response } from "express";
import service from "./service.ts";

export const getClientCampaigns = async (req: AuthRequest, res: Response) => {
   try {
      const userId = req.user?.id;

      const result = await service.getClientCampaigns(userId, req.query);

      return res.json(goodResponse(result, "Campaign list fetched"));
   } catch (error: any) {
      return res.status(400).json({
         success: false,
         message: error.message,
      });
   }
};

export const getClientCampaignById = async (
   req: AuthRequest,
   res: Response
) => {
   try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await service.getClientCampaignById(userId, id);

      return res.json(goodResponse(result, "Campaign fetched successfully"));
   } catch (error: any) {
      return res.status(400).json({
         success: false,
         message: error.message,
      });
   }
};
export default { getClientCampaigns,getClientCampaignById };
