import { Router } from "express";
import clientManagementRoute from "./clientManagement/index.ts";
import productManagementRoute from "./productManagement/index.ts";
import publisherManagementRoute from "./publisherManagement/index.ts";
import proposalManagementRoute from "./proposalManagement/index.ts";

import { verifyToken } from "../../middleware/auth.ts";
import { authorizeRoles } from "../../middleware/authorize.ts";
import { RoleId } from "@prisma/client";

const router = Router();

router.use(verifyToken);
router.use(authorizeRoles(RoleId.UserAdmin))

router.use("/clientManagement", clientManagementRoute);
router.use("/productManagement", productManagementRoute);
router.use("/publisherManagement", publisherManagementRoute);
router.use("/proposalManagement", proposalManagementRoute);

export default router;
