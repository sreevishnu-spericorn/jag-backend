import { Router } from "express";
import controller from "./controller.ts";
import validator from "./validator.ts";
import upload from "../../../middleware/upload.ts";
import uploadAdvertisement from "../../../middleware/uploadAdvertisement.ts";

const router = Router();

router.post(
   "/create",
   uploadAdvertisement.array("files"),
   validator.validateCreateAdvertisement,
   controller.createAdvertisement
);

router.get("/list", controller.getClientAdvertisements);

router.get("/:id", validator.getById, controller.getClientAdvertisementById);

router.put(
   "/update/:id",
   upload.any(),
   validator.update,
   controller.updateAdvertisement
);

router.delete("/:id", validator.getById, controller.softDeleteAdvertisement);

export default router;
