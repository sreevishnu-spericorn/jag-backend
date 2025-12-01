import prisma from "../../../config/prisma.ts";
import { parseListQuery } from "../../../utils/common/query.ts";
import {
   safeRedisGet,
   safeRedisSet,
} from "../../../utils/proposals/proposalRedis.ts";

async function getClientCampaigns(userId: string, query: any) {
   const { page, limit, search, fromDate, toDate, skip } =
      parseListQuery(query);

   console.log("111111111111111");

   const client = await prisma.client.findFirst({
      where: { userId, isDeleted: false },
      select: { id: true },
   });

   if (!client) throw new Error("Client not found");

   const clientId = client.id;

   const cacheKey = `client:${clientId}:campaigns:page=${page}:limit=${limit}:search=${search}:from=${fromDate?.toISOString()}:to=${toDate?.toISOString()}`;
   const cached = await safeRedisGet(cacheKey);

   const where: any = {
      isDeleted: false,
      clientId,
      proposalStatus: "Paid",
      paymentStatus: "Paid",
   };

   if (search) {
      where.OR = [
         { proposalName: { contains: search, mode: "insensitive" } },
         {
            client: {
               accountName: { contains: search, mode: "insensitive" },
            },
         },
      ];
   }

   if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
   }

   // 4. Fetch base campaigns + count
   const [baseCampaigns, total] = await Promise.all([
      prisma.proposal.findMany({
         where,
         skip,
         take: limit,
         orderBy: { createdAt: "desc" },
         select: {
            id: true,
            proposalName: true,
            proposalStatus: true,
            paymentStatus: true,
            createdAt: true,
            updatedAt: true,
            clientId: true,

            products: {
               select: {
                  id: true,
                  quantity: true,
                  price: true,
                  total: true,
                  product: {
                     select: {
                        id: true,
                        productName: true,
                        status: true,
                        isDeleted: true,
                        customFields: true,
                        createdAt: true,
                        updatedAt: true,
                     },
                  },
                  publisher: {
                     select: { id: true, publisherName: true },
                  },
               },
            },

            client: {
               select: {
                  accountName: true,
                  email: true,
                  id: true,
                  logo: true,
                  phone: true,
               },
            },
         },
      }),

      prisma.proposal.count({ where }),
   ]);

   // 5. Calculate totals from proposalProduct (same logic as proposals)
   const proposalIds = baseCampaigns.map((p) => p.id);

   const aggregatedTotals = await prisma.proposalProduct.groupBy({
      by: ["proposalId"],
      where: { proposalId: { in: proposalIds } },
      _sum: { total: true },
   });

   const totalMap = new Map(
      aggregatedTotals.map((a) => [a.proposalId, a._sum.total || 0])
   );

   // 6. Attach totals
   const campaigns = baseCampaigns.map((p) => ({
      ...p,
      totalAmount: totalMap.get(p.id) || 0,
   }));

   // 7. Final response structure
   const result = {
      campaigns,
      pagination: {
         total,
         page,
         pages: Math.ceil(total / limit),
         limit,
      },
   };

   // 8. Cache
   await safeRedisSet(cacheKey, result, 60);

   return result;
}

export default { getClientCampaigns };
