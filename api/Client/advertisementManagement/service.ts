import prisma from "../../../config/prisma.ts";
import { parseListQuery } from "../../../utils/common/query.ts";
import { extractFiles } from "../../../utils/advertisements/extractFiles.ts";
import BadRequest from "../../../helper/exception/badRequest.ts";
import { safeRedisGet, safeRedisSet } from "../../../utils/redis.ts";

export async function createAdvertisement(
    userId: string,
    body: any,
    files: Express.Multer.File[]
 ) {
    try {
       const { proposalProductId, adDate, adTime, ...customTextFields } = body;
 
       if (!proposalProductId)
          throw new BadRequest("proposalProductId is required", "INVALID_PP_ID");
 
       const [client, proposalProduct] = await Promise.all([
          prisma.client.findFirst({
             where: { userId, isDeleted: false },
             select: { id: true },
          }),
 
          prisma.proposalProduct.findUnique({
             where: { id: proposalProductId },
             include: {
                proposal: {
                   select: { id: true, clientId: true, isDeleted: true },
                },
                product: { select: { id: true, status: true, isDeleted: true } },
                publisher: { select: { id: true, isDeleted: true } },
             },
          }),
       ]);
 
       if (!client)
          throw new BadRequest("Client not found for user", "INVALID_CLIENT");
 
       if (!proposalProduct)
          throw new BadRequest("ProposalProduct not found", "INVALID_PP");
 
       if (proposalProduct.proposal.isDeleted)
          throw new BadRequest("Proposal deleted", "INVALID_PROPOSAL");
 
       if (proposalProduct.proposal.clientId !== client.id)
          throw new BadRequest("Unauthorized", "UNAUTHORIZED");
 
       if (proposalProduct.product.isDeleted || !proposalProduct.product.status)
          throw new BadRequest("Invalid product", "INVALID_PRODUCT");
 
       if (proposalProduct.publisher.isDeleted)
          throw new BadRequest("Invalid publisher", "INVALID_PUBLISHER");
 
       if (proposalProduct.quantity <= 0)
          throw new BadRequest("No credits left", "NO_CREDITS");
 
       const fileMap = extractFiles(files);
 
       const customData = {
          ...customTextFields,
          ...fileMap,
       };
 
       const advertisement = await prisma.$transaction(async (tx) => {
          const created = await tx.advertisement.create({
             data: {
                proposalProductId,
                adDate: new Date(adDate),
                adTime: new Date(adTime),
                customData,
             },
          });
 
          await tx.proposalProduct.update({
             where: { id: proposalProductId },
             data: {
                quantity: proposalProduct.quantity - 1,
             },
          });
 
          return created;
       });
 
       return advertisement;
    } catch (error: any) {
       if (error.code === "P2003") {
          throw new BadRequest("Invalid relational reference", "INVALID_FK");
       }
       throw error;
    }
 }
 

 export async function getClientAdvertisements(userId: string, query: any) {
    const { page, limit, skip } = parseListQuery(query);
 
    const cacheKey = `ads:list:${userId}:page:${page}:limit:${limit}`;
    const cached = await safeRedisGet(cacheKey);
    if (cached) return JSON.parse(cached);
 
    const client = await prisma.client.findFirst({
       where: { userId, isDeleted: false },
       select: { id: true },
    });
    if (!client) throw new BadRequest("Client not found", "INVALID_CLIENT");
 
    const [rows, total] = await Promise.all([
       prisma.advertisement.findMany({
          where: {
             isDeleted: false,
             proposalProduct: { proposal: { clientId: client.id } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
             proposalProduct: {
                include: {
                   proposal: true,
                   product: true,
                   publisher: true,
                },
             },
          },
       }),
 
       prisma.advertisement.count({
          where: {
             isDeleted: false,
             proposalProduct: { proposal: { clientId: client.id } },
          },
       }),
    ]);
 
    const response = {
       advertisements: rows,
       pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
       },
    };
 
    await safeRedisSet(cacheKey, response, 60);
    return response;
 }
 

 export async function getClientAdvertisementById(userId: string, id: string) {
    const cacheKey = `ads:single:${id}`;
 
    const cached = await safeRedisGet(cacheKey);
    if (cached) return JSON.parse(cached);
 
    const client = await prisma.client.findFirst({
       where: { userId, isDeleted: false },
       select: { id: true },
    });
    if (!client) throw new BadRequest("Client not found", "INVALID_CLIENT");
 
    const ad = await prisma.advertisement.findUnique({
       where: { id },
       include: {
          proposalProduct: {
             include: {
                proposal: true,
                product: true,
                publisher: true,
             },
          },
       },
    });
 
    if (!ad) throw new BadRequest("Advertisement not found", "NOT_FOUND");
 
    if (ad.proposalProduct.proposal.clientId !== client.id)
       throw new BadRequest("Unauthorized", "UNAUTHORIZED");
 
    await safeRedisSet(cacheKey, ad, 120);
    return ad;
 }
 

async function updateAdvertisement(
   userId: string,
   id: string,
   body: any,
   files: any
) {
   const client = await prisma.client.findFirst({
      where: { userId, isDeleted: false },
      select: { id: true },
   });

   const ad = await prisma.advertisement.findUnique({ where: { id } });
   if (!ad) throw new Error("Advertisement not found");
   if (ad.clientId !== client.id) throw new Error("Unauthorized");

   const fileMap = extractFiles(files);

   const customData = {
      ...ad.customData,
      ...body.customData,
      ...fileMap,
   };

   const updated = await prisma.advertisement.update({
      where: { id },
      data: {
         adDate: body.adDate ? new Date(body.adDate) : undefined,
         adTime: body.adTime ? new Date(body.adTime) : undefined,
         customData,
      },
   });

   return updated;
}

async function softDeleteAdvertisement(id: string) {
   return prisma.advertisement.update({
      where: { id },
      data: { isDeleted: true },
   });
}

export default {
   createAdvertisement,
   getClientAdvertisements,
   getClientAdvertisementById,
   updateAdvertisement,
   softDeleteAdvertisement,
};
