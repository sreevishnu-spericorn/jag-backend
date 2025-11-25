import { Router } from "express";
import authRoute from "../api/Auth/index.js";
const router = Router();
router.use("/auth", authRoute);
export default router;
//# sourceMappingURL=routes.js.map