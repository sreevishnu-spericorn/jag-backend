import { Router } from "express";
import controller from "./controller.ts";
import validator from "./validator.ts";

const router = Router();

router.post(
   "/create-payment-intent",
   validator.validateCreatePaymentIntent,
   controller.createPaymentIntent
);

export default router;
