import { Router } from "express";
import authRoute from "../api/Auth/index.ts";
import adminRoute from "../api/Admin/index.ts";
import clientRoutes from "../api/Client/index.ts";

const router: Router = Router();

router.use("/auth", authRoute);
router.use("/admin", adminRoute);
router.use("/client",clientRoutes);

export default router;
