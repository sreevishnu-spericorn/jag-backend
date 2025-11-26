import prisma from "../../../../config/prisma.ts";
import BadRequest from "../../../../helper/exception/badRequest.ts";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CreatePaymentIntentDTO {
   proposalId: string;
   adminId: string;
}

export async function createPaymentIntent({
   proposalId,
   adminId,
}: CreatePaymentIntentDTO) {
   const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
         products: true,
      },
   });

   if (!proposal || proposal.isDeleted)
      throw new BadRequest("Proposal not found", "NOT_FOUND");

   if (proposal.paymentStatus === "Paid")
      throw new BadRequest("Proposal already paid", "ALREADY_PAID");

   const totalAmount = proposal.products.reduce((sum, p) => sum + p.total, 0);

   const amountInPaise = Math.round(totalAmount * 100);

   const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: "usd",
      metadata: {
         proposalId,
         adminId,
      },
   });

   console.log(paymentIntent);

   return { clientSecret: paymentIntent.client_secret };
}

export default { createPaymentIntent };
