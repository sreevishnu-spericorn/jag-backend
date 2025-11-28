import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { failedResponse } from "../helper/response.js";

export interface AuthRequest extends Request {
   user?: JwtPayload & { roleId?: string };
}

export const verifyToken = (
   req: AuthRequest,
   res: Response,
   next: NextFunction
) => {
   const authHeader = req.headers.authorization;
   console.log(`[DEBUG] JWT_SECRET:'${process.env.JWT_SECRET}'`);
   console.log(
      `[DEBUG] JWT_REFRESH_SECRET:'${process.env.JWT_REFRESH_SECRET}'`
   );

   if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
         .status(401)
         .json(failedResponse("Access denied. No token provided.", 400));
   }

   const token = authHeader.split(" ")[1];
   console.log(token);
   try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
         audience: "access",
      }) as JwtPayload & { roleId?: string };

      console.log("Decoded token:", decoded);

      req.user = decoded;
      next();
   } catch (err) {
      console.error("JWT verification error:", err);
      return res
         .status(403)
         .json(failedResponse("Invalid or expired token.", 403));
   }
};


export default { verifyToken };
