import prisma from "../../../config/prisma.ts";
import BadRequest from "../../../helper/exception/badRequest.ts";

interface PaymentsQuery {
   page: number;
   limit: number;
   proposalId?: string;
   fromDate?: Date | null;
   toDate?: Date | null;
}

export const getAllPaymentsService = async ({
   page,
   limit,
   proposalId,
   fromDate,
   toDate,
}: PaymentsQuery) => {
   try {
      const skip = (page - 1) * limit;
      const whereCondition: any = {};

      if (proposalId) whereCondition.proposalId = proposalId;
      if (fromDate) whereCondition.createdAt = { gte: fromDate };
      if (toDate)
         whereCondition.createdAt = {
            ...whereCondition.createdAt,
            lte: toDate,
         };

      const [payments, total] = await Promise.all([
         prisma.payment.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
         }),
         prisma.payment.count({ where: whereCondition }),
      ]);

      return {
         payments,
         pagination: { total, page, pages: Math.ceil(total / limit), limit },
      };
   } catch (error: any) {
      console.error("Error in getAllPaymentsService:", error);
      throw new BadRequest(error.message, "Failed to fetch payments");
   }
};

export const getPaymentByIdService = async (id: string) => {
   try {
      const payment = await prisma.payment.findUnique({
         where: { id },
         include: { proposal: true }, // optional: include related proposal
      });

      if (!payment) {
         throw new BadRequest("Payment not found", "NOT_FOUND");
      }

      return payment;
   } catch (error: any) {
      console.error("Error in getPaymentByIdService:", error);
      throw new BadRequest(error.message, "Failed to fetch payment");
   }
};
