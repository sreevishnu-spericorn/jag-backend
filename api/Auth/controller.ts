import { Request, Response } from "express";
import { goodResponse, failedResponse } from "../../helper/response.ts";
import service from "./service.ts";

const signup = async (req: Request, res: Response): Promise<Response> => {
   try {
      const user = await service.signup(req.body);

      return res.json(goodResponse({ user }, "New user Created."));
   } catch (error: any) {
      return res
         .status(error.statusCode || 400)
         .json(
            failedResponse(
               error.message || "Something went wrong",
               error.statusCode || 400
            )
         );
   }
};

const verifyOtp = async (req: Request, res: Response): Promise<Response> => {
   try {
      const result = await service.verifyOtp(req.body);
      res.cookie("refreshToken", result.refreshToken, {
         httpOnly: true,
         secure: false,
         sameSite: "lax",
         path: "/",
         maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json(goodResponse(result, result.message));
   } catch (error: any) {
      return res
         .status(error.statusCode || 400)
         .json(
            failedResponse(
               error.message || "Something went wrong",
               error.statusCode || 400
            )
         );
   }
};

const loginWithOtp = async (req: Request, res: Response): Promise<Response> => {
   try {
      const { email, password } = req.body;

      const result = await service.generateLoginOtp(email, password);

      return res.json(
         goodResponse(
            {
               tempToken: result.tempToken,
            },
            result.message
         )
      );
   } catch (error: any) {
      console.error("[loginWithOtp] Error:", error);

      return res
         .status(400)
         .json(
            failedResponse(error.message || "Failed to login with OTP", 400)
         );
   }
};

const forgotPassword = async (
   req: Request,
   res: Response
): Promise<Response> => {
   try {
      const result = await service.sendPasswordResetEmail(req.body.email);
      return res.json(goodResponse(result, "Password reset email sent"));
   } catch (err: any) {
      return res
         .status(400)
         .json(failedResponse(err.message || "Failed to send reset link", 400));
   }
};

const resetPassword = async (
   req: Request,
   res: Response
): Promise<Response> => {
   try {
      const result = await service.resetPassword(req.body);
      return res.json(
         goodResponse(result, "Password has been reset successfully")
      );
   } catch (err: any) {
      return res
         .status(400)
         .json(failedResponse(err.message || "Failed to reset password", 400));
   }
};

const refreshToken = async (req: Request, res: Response) => {
   try {
      const token = await service.refresh(req as any);
      return res.json(goodResponse({ token }, "Access token refreshed"));
   } catch (error: any) {
      return res.status(401).json({
         success: false,
         message: error.message || "Invalid refresh token",
         code: error.code || "UNAUTHORIZED",
      });
   }
};

export default {
   signup,
   verifyOtp,
   loginWithOtp,
   forgotPassword,
   resetPassword,
   refreshToken,
};
