import { Router } from "express";

import profileManagement from "./profileManagement/index.ts";
import proposalManagement from "./proposalManagement/index.ts";
import campaignManagement from "./campaignManagement/index.ts";
import advertisementManagement from "./advertisementManagement/index.ts"

import { verifyToken } from "../../middleware/auth.ts";
import { authorizeRoles } from "../../middleware/authorize.ts";
import { RoleId } from "@prisma/client";

const router = Router();

router.use(verifyToken);
router.use(authorizeRoles(RoleId.Client));

router.use("/profileManagement", profileManagement);
router.use("/proposalmanagement", proposalManagement);
router.use("/campaignManagement", campaignManagement);
router.use("/advertisementManagement", advertisementManagement);

export default router;
