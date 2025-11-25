import jwt from "jsonwebtoken";
import { failedResponse } from "../helper/response.js";
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json(failedResponse("Access denied. No token provided.", 400));
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            audience: "access",
        });
        req.user = decoded;
        next();
    }
    catch (err) {
        return res
            .status(403)
            .json(failedResponse("Invalid or expired token.", 403));
    }
};
// Role-based authorization
export function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
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
        }
        catch (error) {
            console.error("Role auth error:", error);
            return res.status(500).json({
                success: false,
                message: "Server error in role authorization",
            });
        }
    };
}
export default { verifyToken };
//# sourceMappingURL=auth.js.map