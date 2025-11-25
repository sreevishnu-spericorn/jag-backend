import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";


export interface AuthRequest extends Request {
    user?: JwtPayload & { roleId?: string };
 }
 
export function authorizeRoles(...allowedRoles: string[]) {
   return (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
         const userRole = req.user?.roleId;

         if (!userRole) {
            return res
               .status(401)
               .json({ success: false, message: "Unauthorized: Missing role" });
         }

         if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
               success: false,
               message: "Access denied: Insufficient privileges",
            });
         }
         next();
      } catch (error) {
         console.error("Role auth error:", error);
         return res.status(500).json({
            success: false,
            message: "Server error in role authorization",
         });
      }
   };
}
