import { AuthRequest } from "../../../middleware/auth.ts";
import { Response } from "express";
import { goodResponse } from "../../../helper/response.ts";
import service from "./service.ts";

const createAdvertisement = async (req: AuthRequest, res: Response) => {
   try {
      const userId = req.user?.id;
      if (!userId) {
         return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
      }

      const result = await service.createAdvertisement(
         userId,
         req.body,
         req.files as Express.Multer.File[]
      );

      return res.json(
         goodResponse(result, "Advertisement created successfully")
      );
   } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
   }
};

const getClientAdvertisements = async (req: AuthRequest, res: Response) => {
   try {
      const userId = req.user?.id;
      const result = await service.getClientAdvertisements(userId!, req.query);

      return res.json(goodResponse(result, "Advertisements fetched"));
   } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
   }
};

const getClientAdvertisementById = async (req: AuthRequest, res: Response) => {
   try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await service.getClientAdvertisementById(userId!, id);

      return res.json(goodResponse(result, "Advertisement fetched"));
   } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
   }
};

const updateAdvertisement = async (req: AuthRequest, res: Response) => {
   try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await service.updateAdvertisement(
         userId!,
         id,
         req.body,
         req.files
      );

      return res.json(goodResponse(result, "Advertisement updated"));
   } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
   }
};

const softDeleteAdvertisement = async (req: AuthRequest, res: Response) => {
   try {
      const { id } = req.params;

      await service.softDeleteAdvertisement(id);

      return res.json(goodResponse({}, "Advertisement deleted"));
   } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
   }
};

export default {
   createAdvertisement,
   getClientAdvertisements,
   getClientAdvertisementById,
   updateAdvertisement,
   softDeleteAdvertisement,
};
