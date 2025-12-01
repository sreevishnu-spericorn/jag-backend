import { Request, Response } from "express";
import service from "./service.ts";
import { goodResponse, failedResponse } from "../../../helper/response.ts";
import { AuthRequest } from "../../../middleware/auth.ts";

const getProfile = async (req: AuthRequest, res: Response) => {
   try {
      const userId = req.user!.id;
      const result = await service.getProfile(userId);
      return res.json(goodResponse(result, "Profile fetched successfully"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const updateProfile = async (req: AuthRequest, res: Response) => {
   try {
      const userId = req.user!.id;
      const result = await service.updateProfile(userId, req.body);
      return res.json(goodResponse(result, "Profile updated successfully"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const changePassword = async (req: AuthRequest, res: Response) => {
   try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      const result = await service.changePassword(userId, {
         currentPassword,
         newPassword,
      });

      return res.json(goodResponse(result, "Password changed successfully"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const logout = async (req: Request, res: Response) => {
   try {
      res.clearCookie("refreshToken", {
         httpOnly: true,
         secure: false,
         sameSite: "lax",
         path: "/",
      });

      return res.json({
         success: true,
         message: "Logged out successfully",
      });
   } catch (error: any) {
      return res.status(500).json({
         success: false,
         message: error.message || "Failed to logout",
      });
   }
};

export default { getProfile, updateProfile, changePassword, logout };
