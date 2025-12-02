import prisma from "../../../config/prisma.ts";
import { parseListQuery } from "../../../utils/common/query.ts";
import {
   safeRedisGet,
   safeRedisSet,
} from "../../../utils/proposals/proposalRedis.ts";

async function getClientCampaigns(userId: string, query: any) {
   const { page, limit, search, fromDate, toDate, skip } =
      parseListQuery(query);

   const cacheKey = `client:campaigns:${userId}:${page}:${limit}:${search || ""}:${fromDate || ""}:${toDate || ""}`;
   const cached = await safeRedisGet(cacheKey);

   if (cached) {
      console.log("Data from redis")
      return JSON.parse(cached);
   }

   const client = await prisma.client.findFirst({
      where: { userId, isDeleted: false },
      select: { id: true },
   });

   if (!client) throw new Error("Client not found");
   const clientId = client.id;

   const where: any = {
      proposal: {
         clientId,
         proposalStatus: "Paid",
         paymentStatus: "Paid",
      },
   };

   if (search) {
      where.OR = [
         {
            product: { productName: { contains: search, mode: "insensitive" } },
         },
         {
            publisher: {
               publisherName: { contains: search, mode: "insensitive" },
            },
         },
         {
            proposal: {
               proposalName: { contains: search, mode: "insensitive" },
            },
         },
      ];
   }

   if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
   }

   const [rows, total] = await Promise.all([
      prisma.proposalProduct.findMany({
         where,
         orderBy: { createdAt: "desc" },
         skip,
         take: limit,

         include: {
            product: {
               select: {
                  id: true,
                  productName: true,
                  status: true,
                  customFields: true,
               },
            },
            publisher: {
               select: {
                  id: true,
                  publisherName: true,
               },
            },
            proposal: {
               select: {
                  id: true,
                  proposalName: true,
                  createdAt: true,
                  paymentStatus: true,
                  proposalStatus: true,

                  client: {
                     select: {
                        id: true,
                        accountName: true,
                        email: true,
                        logo: true,
                        phone: true,
                     },
                  },
               },
            },
         },
      }),

      prisma.proposalProduct.count({ where }),
   ]);

   const campaigns = rows.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      price: i.price,
      total: i.total,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      product: i.product,
      publisher: i.publisher,

      proposal: {
         id: i.proposal.id,
         proposalName: i.proposal.proposalName,
         createdAt: i.proposal.createdAt,
         paymentStatus: i.proposal.paymentStatus,
         proposalStatus: i.proposal.proposalStatus,
      },

      client: i.proposal.client,
   }));

   const response = {
      campaigns,
      pagination: {
         total,
         page,
         limit,
         pages: Math.ceil(total / limit),
      },
   };

   await safeRedisSet(cacheKey, response, 60);

   return response;
}

async function getClientCampaignById(userId: string, id: string) {
   const cacheKey = `client:campaign:${id}`;
   const cached = await safeRedisGet(cacheKey);

   if (cached) return JSON.parse(cached);

   const client = await prisma.client.findFirst({
      where: { userId, isDeleted: false },
      select: { id: true },
   });

   if (!client) throw new Error("Client not found");

   const campaign = await prisma.proposalProduct.findUnique({
      where: { id },
      include: {
         product: {
            select: {
               id: true,
               productName: true,
               status: true,
               customFields: true,
            },
         },
         publisher: {
            select: {
               id: true,
               publisherName: true,
            },
         },
         proposal: {
            select: {
               id: true,
               proposalName: true,
               createdAt: true,
               proposalStatus: true,
               paymentStatus: true,
               clientId: true,
               client: {
                  select: {
                     id: true,
                     accountName: true,
                     email: true,
                     logo: true,
                     phone: true,
                  },
               },
            },
         },
      },
   });

   if (!campaign) throw new Error("Campaign not found");

   if (campaign.proposal.clientId !== client.id) {
      throw new Error("Unauthorized: Campaign does not belong to this client");
   }

   const response = {
      id: campaign.id,
      quantity: campaign.quantity,
      price: campaign.price,
      total: campaign.total,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      product: campaign.product,
      publisher: campaign.publisher,

      proposal: {
         id: campaign.proposal.id,
         proposalName: campaign.proposal.proposalName,
         createdAt: campaign.proposal.createdAt,
         paymentStatus: campaign.proposal.paymentStatus,
         proposalStatus: campaign.proposal.proposalStatus,
      },

      client: campaign.proposal.client,
   };

   await safeRedisSet(cacheKey, response, 60);

   return response;
}

export default { getClientCampaignById, getClientCampaigns };
