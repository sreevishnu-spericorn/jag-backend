import prisma from "../../../config/prisma.ts";
import BadRequest from "../../../helper/exception/badRequest.ts";
import { parseListQuery } from "../../../utils/common/query.ts";
import {
   safeRedisGet,
   safeRedisSet,
} from "../../../utils/proposals/proposalRedis.ts";

export async function getClientProposalsService(userId: string, query: any) {
   try {
      const { page, limit, search, fromDate, toDate, skip } =
         parseListQuery(query);

      const client = await prisma.client.findFirst({
         where: { userId, isDeleted: false },
         select: { id: true },
      });

      if (!client) throw new Error("Client not found");

      const clientId = client.id;

      const cacheKey = `client:${clientId}:proposals:page=${page}:limit=${limit}:search=${search}:from=${fromDate?.toISOString()}:to=${toDate?.toISOString()}`;
      const cached = await safeRedisGet(cacheKey);

      if (cached) {
         console.log("Fetched from Redis");
         return JSON.parse(cached);
      }

      const where: any = {
         isDeleted: false,
         clientId,
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

      const [baseProposals, total] = await Promise.all([
         prisma.proposal.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
               id: true,
               clientId: true,
               proposalName: true,
               proposalStatus: true,
               paymentStatus: true,
               createdAt: true,
               updatedAt: true,
               isDeleted: true,
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

      const proposalIds = baseProposals.map((p) => p.id);

      const aggregatedTotals = await prisma.proposalProduct.groupBy({
         by: ["proposalId"],
         where: { proposalId: { in: proposalIds } },
         _sum: { total: true },
      });

      const totalMap = new Map(
         aggregatedTotals.map((a) => [a.proposalId, a._sum.total || 0])
      );

      const proposals = baseProposals.map((p) => ({
         ...p,
         totalAmount: totalMap.get(p.id) || 0,
      }));

      const result = {
         proposals,
         pagination: { total, page, pages: Math.ceil(total / limit), limit },
      };

      await safeRedisSet(cacheKey, result, 60);

      return result;
   } catch (error) {
      throw error;
   }
}

export async function getProposalById(id: string) {
   try {
      if (!id)
         throw new BadRequest("Invalid Proposal ID format.", "INVALID_ID");

      const cacheKey = `proposal:id=${id}`;
      const cached = await safeRedisGet(cacheKey);
      if (cached) {
         console.log("Fetching from DBBBBBBB");
         return JSON.parse(cached);
      }

      const proposal = await prisma.proposal.findUnique({
         where: { id },
         include: {
            client: { select: { accountName: true } },
            products: {
               include: {
                  publisher: { select: { publisherName: true } },
                  product: { select: { productName: true } },
               },
            },
         },
      });

      if (!proposal || proposal.isDeleted)
         throw new BadRequest("Proposal not found", "NOT_FOUND");

      await safeRedisSet(cacheKey, proposal, 300);

      return proposal;
   } catch (err) {
      throw err;
   }
}

export default {
   getClientProposalsService,
   getProposalById,
};
