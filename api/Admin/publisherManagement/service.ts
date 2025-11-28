import prisma from "../../../config/prisma.ts";
import BadRequest from "../../../helper/exception/badRequest.ts";
import {
   buildPublisherLogoPath,
   buildPublisherW9Paths,
   removeFileIfExists,
   removePathIfExists,
   safeJsonArray,
} from "../../../utils/publishers/publisherFileManagement.ts";
import {
   safeRedisGet,
   safeRedisSet,
   safeRedisDelPattern,
} from "../../../utils/publishers/publisherRedis.ts";
import {
   CreatePublisherDTO,
   UpdatePublisherDTO,
} from "../../../types/publisherTypes/publisherTypes.ts";
import { parseListQuery } from "../../../utils/common/query.ts";

export async function createPublisher(
   data: CreatePublisherDTO,
   logoFilename?: string,
   w9Filenames?: string[]
) {
   try {
      if (!data.publisherName || !data.email)
         throw new BadRequest(
            "publisherName and email are required",
            "INVALID_PAYLOAD"
         );

      if (!data.products)
         throw new BadRequest(
            "Products and must be available for publisher",
            "Products Missing"
         );

      const logoPath = buildPublisherLogoPath(logoFilename);
      const w9Paths = buildPublisherW9Paths(w9Filenames);

      const result = await prisma.$transaction(async (tx) => {
         const existing = await tx.publisher.findUnique({
            where: { email: data.email },
         });
         if (existing)
            throw new BadRequest(
               "Publisher with this email already exists",
               "EMAIL_EXISTS"
            );

         const publisher = await tx.publisher.create({
            data: {
               publisherName: data.publisherName,
               email: data.email,
               phoneNo: data.phoneNo,
               whatsappNo: data.whatsappNo,
               logo: logoPath,
               w9Files: w9Paths,
               description: data.description,
            },
         });

         if (!data.products) {
            throw new BadRequest(
               "Products must be needed",
               "Products Required"
            );
         }

         if (
            data.products &&
            Array.isArray(data.products) &&
            data.products.length
         ) {
            await Promise.all(
               data.products.map((p) =>
                  tx.publisherProduct.create({
                     data: {
                        publisherId: publisher.id,
                        productId: p.productId,
                        price: p.price,
                     },
                  })
               )
            );
         }

         return publisher;
      });

      await safeRedisDelPattern("publishers:*");
      return result;
   } catch (err: any) {
      if (err.code === "P2002")
         throw new BadRequest("Unique constraint failed", "DUPLICATE_ENTRY");
      throw err;
   }
}

export const getPublishers = async (query: any) => {
   try {
      const { page, limit, search, fromDate, toDate, skip } =
         parseListQuery(query);
      const cacheKey = `publishers:page=${page}:limit=${limit}:search=${search}:fromDate=${fromDate?.toISOString()}:toDate=${toDate?.toISOString()}`;
      const cached = await safeRedisGet(cacheKey);
      if (cached) return JSON.parse(cached);

      const where: any = { isDeleted: false };

      if (search) {
         where.OR = [
            { publisherName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
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

      const [publishers, total] = await Promise.all([
         prisma.publisher.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
               products: {
                  include: { product: true },
               },
            },
         }),
         prisma.publisher.count({ where }),
      ]);

      const result = {
         publishers,
         pagination: { total, page, pages: Math.ceil(total / limit), limit },
      };
      await safeRedisSet(cacheKey, result, 60);

      return result;
   } catch (err) {
      throw err;
   }
};

export async function getPublisherById(id: string) {
   try {
      const cacheKey = `publisher:id=${id}`;
      const cached = await safeRedisGet(cacheKey);
      if (cached) return JSON.parse(cached);

      const pub = await prisma.publisher.findUnique({
         where: { id },
         include: {
            products: { include: { product: true } },
         },
      });
      if (!pub || pub.isDeleted)
         throw new BadRequest("Publisher not found", "NOT_FOUND");

      await safeRedisSet(cacheKey, pub, 300);
      return pub;
   } catch (err) {
      throw err;
   }
}

export async function updatePublisher(
   id: string,
   rawData: any,
   logoFilename?: string,
   w9Filenames?: string[]
) {
   try {

      const removedW9Files = safeJsonArray(rawData.removedW9Files);
      const products = safeJsonArray(rawData.products);

      const data: UpdatePublisherDTO = {
         ...rawData,
         ...(products ? { products } : {}),
      };
      delete (data as any).removedW9Files;

      const existing = await prisma.publisher.findUnique({
         where: { id },
         include: { products: true },
      });

      if (!existing || existing.isDeleted)
         throw new BadRequest("Publisher not found", "NOT_FOUND");

      if (data.email && data.email !== existing.email) {
         const other = await prisma.publisher.findUnique({
            where: { email: data.email },
         });
         if (other)
            throw new BadRequest(
               "Another publisher with this email exists",
               "EMAIL_EXISTS"
            );
      }
      const logoPath = logoFilename
         ? buildPublisherLogoPath(logoFilename)
         : undefined;

      const newW9Paths = w9Filenames ? buildPublisherW9Paths(w9Filenames) : [];

      const removedSet = new Set(removedW9Files);

      const finalW9Files = [
         ...existing.w9Files.filter((f) => !removedSet.has(f)),
         ...newW9Paths,
      ];

      const updated = await prisma.$transaction(async (tx) => {
         const updateData: any = {
            ...(data.publisherName && { publisherName: data.publisherName }),
            ...(data.email && { email: data.email }),
            ...(data.phoneNo && { phoneNo: data.phoneNo }),
            ...(data.whatsappNo && { whatsappNo: data.whatsappNo }),
            ...(data.description && { description: data.description }),
            ...(logoPath && { logo: logoPath }),
            w9Files: finalW9Files,
         };

         const pub = await tx.publisher.update({
            where: { id },
            data: updateData,
         });

         if (Array.isArray(data.products)) {
            const providedIds = data.products.map((p) => p.productId);

            const existingMap = new Map(
               existing.products.map((p) => [p.productId, p])
            );

            const tasks = data.products.map((p) => {
               const found = existingMap.get(p.productId);

               if (found) {
                  return tx.publisherProduct.update({
                     where: { id: found.id },
                     data: { price: p.price },
                  });
               }

               return tx.publisherProduct.create({
                  data: {
                     publisherId: id,
                     productId: p.productId,
                     price: p.price,
                  },
               });
            });

            await Promise.all(tasks);

            await tx.publisherProduct.deleteMany({
               where: {
                  publisherId: id,
                  productId: { notIn: providedIds },
               },
            });
         }

         return pub;
      });

      await Promise.all([
         ...removedW9Files.map(async (filePath:any) =>
            removePathIfExists(filePath)
         ),
         existing.logo &&
            logoPath &&
            existing.logo !== logoPath &&
            removePathIfExists(existing.logo),
      ]);
      await Promise.all([
         safeRedisDelPattern(`publisher:id=${id}`),
         safeRedisDelPattern("publishers:*"),
      ]);

      return updated;
   } catch (err: any) {
      if (err.code === "P2002")
         throw new BadRequest("Unique constraint failed", "DUPLICATE_ENTRY");
      throw err;
   }
}

export async function deletePublisher(id: string) {
   try {
      const existing = await prisma.publisher.findUnique({ where: { id } });
      if (!existing || existing.isDeleted)
         throw new BadRequest("Publisher not found", "NOT_FOUND");

      const updated = await prisma.publisher.update({
         where: { id },
         data: { isDeleted: true },
      });

      await safeRedisDelPattern("publishers:*");
      return updated;
   } catch (err) {
      throw err;
   }
}

export default {
   createPublisher,
   getPublishers,
   getPublisherById,
   updatePublisher,
   deletePublisher,
};
