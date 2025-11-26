import Stripe from "stripe";
import prisma from "../../../../config/prisma.ts";
import { Request, Response } from "express";
import { safeRedisDelPattern } from "../../../../utils/proposals/proposalRedis.ts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function paymentWebhook(req: Request, res: Response) {
   const sig = req.headers["stripe-signature"]!;
   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

   let event;

   try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
   } catch (err: any) {
      console.error("Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
   }

   if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const proposalId = paymentIntent.metadata.proposalId;

      try {
         // Use Prisma transaction
         await prisma.$transaction(async (tx) => {
            // 1️⃣ Prepare update and create operations
            const updateProposal = tx.proposal.update({
               where: { id: proposalId },
               data: {
                  paymentStatus: "Paid",
                  proposalStatus: "Paid",
               },
            });


            const createPayment = tx.payment.create({
               data: {
                  proposalId,
                  stripePaymentId: paymentIntent.id,
                  amount: (paymentIntent.amount ?? 0) / 100, // convert cents to dollars
                  currency: paymentIntent.currency,
                  paymentMethod:
                     paymentIntent.payment_method_types?.[0] || null,
                  status: paymentIntent.status, // "succeeded"
               },
            });

            await Promise.all([updateProposal, createPayment]);
         });

         // 3️⃣ Clear Redis cache after transaction
         await Promise.all([
            safeRedisDelPattern(`proposal:id=${proposalId}`),
            safeRedisDelPattern("proposals:*"),
         ]);

         console.log(
            `✅ Proposal ${proposalId} marked as PAID and Payment recorded`
         );
      } catch (err: any) {
         console.error("Failed to record payment:", err.message);
      }
   }

   res.sendStatus(200);
}
