import prisma from "../../../config/prisma.ts";
import BadRequest from "../../../helper/exception/badRequest.ts";
import { parseListQuery } from "../../../utils/common/query.ts";
import {
   safeRedisDelPattern,
   safeRedisGet,
   safeRedisSet,
} from "../../../utils/proposals/proposalRedis.ts";

const isUUID = (uuid: string): boolean => {
   const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
   return uuidRegex.test(uuid);
};
interface ProposalProductDTO {
   publisherId: string;
   productId: string;
   quantity: number;
   price: number;
   total: number;
}

interface ProposalCreateDTO {
   clientId: string;
   proposalName: string;
   ccEMail?: string | null;
   totalAmount: number;
   products: ProposalProductDTO[];
}

interface ProposalUpdateDTO {
   clientId?: string;
   proposalName?: string;
   ccEMail?: string | null;
   proposalStatus?: "Pending" | "Approved" | "Rejected" | "Sent" | "Paid";
   paymentStatus?: "Unpaid" | "Paid" | "Canceled";
   totalAmount?: number;
   products?: ProposalProductDTO[];
}

const buildCacheKey = (query: any) => {
   const { page = 1, limit = 10, search = "" } = query;
   return `proposals:page=${page}:limit=${limit}:search=${search}`;
};

export async function createProposal(data: ProposalCreateDTO) {
   try {
      // 1. Basic Validation (Prisma will validate UUIDs, but check client existence)
      const client = await prisma.client.findUnique({
         where: { id: data.clientId },
      });
      if (!client || client.isDeleted) {
         throw new BadRequest("Client not found.", "NOT_FOUND");
      }
      const uniqueProductIds = [
         ...new Set(data.products.map((p) => p.productId)),
      ];
      const existingProducts = await prisma.product.findMany({
         where: {
            id: { in: uniqueProductIds },
            isDeleted: false,
            status: true, // Ensure the product is active
         },
         select: { id: true },
      });
      if (existingProducts.length !== uniqueProductIds.length) {
         const foundIds = new Set(existingProducts.map((p) => p.id));
         const invalidIds = uniqueProductIds.filter((id) => !foundIds.has(id));

         throw new BadRequest(
            `One or more products are invalid or inactive. Invalid IDs: ${invalidIds.join(
               ", "
            )}`,
            "INVALID_PRODUCTS"
         );
      }

      const newProposal = await prisma.$transaction(async (tx) => {
         const proposal = await tx.proposal.create({
            data: {
               clientId: data.clientId,
               proposalName: data.proposalName,
               ccEmail: data.ccEMail ?? null,
            },
         });

         const proposalProductsData = data.products.map((p) => ({
            proposalId: proposal.id,
            publisherId: p.publisherId,
            productId: p.productId,
            quantity: p.quantity,
            price: p.price,
            total: p.total,
         }));

         await tx.proposalProduct.createMany({
            data: proposalProductsData,
         });

         return proposal;
      });

      await safeRedisDelPattern("proposals:*");

      return newProposal;
   } catch (error: any) {
      if (error.code === "P2002")
         throw new BadRequest("Unique constraint failed", "DUPLICATE_ENTRY");
      throw error;
   }
}

export async function getProposals(query: any) {
   try {
      const { page, limit, search, fromDate, toDate, skip } =
         parseListQuery(query);

      const cacheKey = `proposals:page=${page}:limit=${limit}${query.q ? `:q=${query.q}` : ""}:search=${search}:fromDate=${fromDate?.toISOString()}:toDate=${toDate?.toISOString()}`;
      const cached = await safeRedisGet(cacheKey);

      if (cached) {
         console.log("💾 Proposal Data from Redis Cache");
         return JSON.parse(cached);
      }

      const where: any = { isDeleted: false };

      if (search) {
         where.OR = [
            { proposalName: { contains: search, mode: "insensitive" } },
            {
               client: {
                  accountName: { contains: search, mode: "insensitive" },
               },
            },
            {
               client: {
                  email: { contains: search, mode: "insensitive" },
               },
            },
         ];
      }

      if (fromDate) {
         where.createdAt = { gte: fromDate };
      }

      if (toDate) {
         where.createdAt = {
            ...where.createdAt,
            lte: toDate,
         };
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
               }, // 💡 Include logo/phone for frontend table
            },
         }),
         prisma.proposal.count({ where }),
      ]);

      const proposalIds = baseProposals.map((p) => p.id);

      // 2. Aggregate the Total Amount for the Proposals we fetched (Batch Query)
      const aggregatedTotals = await prisma.proposalProduct.groupBy({
         by: ["proposalId"],
         where: {
            proposalId: { in: proposalIds },
         },
         _sum: {
            total: true,
         },
      });

      // 3. Merge the results
      const totalMap = new Map(
         aggregatedTotals.map((agg) => [agg.proposalId, agg._sum.total || 0])
      );

      const proposals = baseProposals.map((proposal) => ({
         ...proposal,
         totalAmount: totalMap.get(proposal.id) || 0, // Add the calculated total
      }));
      // Note: We cast the client properties directly into the object above.

      const result = {
         proposals,
         pagination: { total, page, pages: Math.ceil(total / limit), limit },
      };
      await safeRedisSet(cacheKey, result, 60);

      return result;
   } catch (err) {
      throw err;
   }
}

export async function getProposalById(id: string) {
   try {
      if (!id)
         throw new BadRequest("Invalid Proposal ID format.", "INVALID_ID");

      const cacheKey = `proposal:id=${id}`;
      const cached = await safeRedisGet(cacheKey);
      if (cached) return JSON.parse(cached);

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

export async function updateProposal(id: string, data: ProposalUpdateDTO) {
   try {
      if (!isUUID(id))
         throw new BadRequest("Invalid Proposal ID format.", "INVALID_ID");

      const existing = await prisma.proposal.findUnique({
         where: { id },
         include: { products: true },
      });
      if (!existing || existing.isDeleted)
         throw new BadRequest("Proposal not found", "NOT_FOUND");

      if (
         existing.paymentStatus === "Paid" ||
         existing.proposalStatus === "Paid"
      ) {
         throw new BadRequest(
            "Cannot edit a proposal that has already been paid",
            "EDIT_BLOCKED"
         );
      }

      const productsToUpdate = data.products;
      delete data.products;

      const updated = await prisma.$transaction(async (tx) => {
         const proposal = await tx.proposal.update({
            where: { id },
            data: data as any,
         });

         if (productsToUpdate && Array.isArray(productsToUpdate)) {
            const existingProductMap = new Map(
               existing.products.map((p) => [
                  `${p.publisherId}-${p.productId}`,
                  p.id, // We store the ProposalProduct ID here
               ])
            );

            const productsToCreate: ProposalProductDTO[] = [];
            const productsToUpdateInBatch: {
               id: string;
               price: number;
               quantity: number;
               total: number;
            }[] = [];
            const providedKeys: { publisherId: string; productId: string }[] =
               [];

            for (const p of productsToUpdate) {
               const mapKey = `${p.publisherId}-${p.productId}`;
               providedKeys.push({
                  publisherId: p.publisherId,
                  productId: p.productId,
               });

               if (existingProductMap.has(mapKey)) {
                  productsToUpdateInBatch.push({
                     id: existingProductMap.get(mapKey)!,
                     price: p.price,
                     quantity: p.quantity,
                     total: p.total,
                  });
               } else {
                  productsToCreate.push(p);
               }
            }
            if (productsToCreate.length > 0) {
               const newProductData = productsToCreate.map((p) => ({
                  proposalId: id,
                  publisherId: p.publisherId,
                  productId: p.productId,
                  quantity: p.quantity,
                  price: p.price,
                  total: p.total,
               }));
               await tx.proposalProduct.createMany({ data: newProductData });
            }
            for (const item of productsToUpdateInBatch) {
               await tx.proposalProduct.update({
                  where: { id: item.id },
                  data: {
                     quantity: item.quantity,
                     price: item.price,
                     total: item.total,
                  },
               });
            }

            const keysToDelete = existing.products
               .filter(
                  (ep) =>
                     !providedKeys.some(
                        (pk) =>
                           pk.publisherId === ep.publisherId &&
                           pk.productId === ep.productId
                     )
               )
               .map((ep) => ({
                  publisherId: ep.publisherId,
                  productId: ep.productId,
               }));

            if (keysToDelete.length > 0) {
               await tx.proposalProduct.deleteMany({
                  where: {
                     proposalId: id,
                     OR: keysToDelete.map((k) => ({
                        publisherId: k.publisherId,
                        productId: k.productId,
                     })),
                  },
               });
            }
         }

         return proposal;
      });

      await safeRedisDelPattern(`proposal:id=${id}`);
      await safeRedisDelPattern("proposals:*");

      return updated;
   } catch (err) {
      throw err;
   }
}

export async function deleteProposal(id: string) {
   try {
      if (!isUUID(id))
         throw new BadRequest("Invalid Proposal ID format.", "INVALID_ID");

      const existing = await prisma.proposal.findUnique({ where: { id } });
      if (!existing || existing.isDeleted)
         throw new BadRequest("Proposal not found", "NOT_FOUND");

      const updated = await prisma.proposal.update({
         where: { id },
         data: { isDeleted: true },
      });

      await safeRedisDelPattern("proposals:*");

      return updated;
   } catch (err) {
      throw err;
   }
}

export default {
   createProposal,
   getProposals,
   getProposalById,
   updateProposal,
   deleteProposal,
};
