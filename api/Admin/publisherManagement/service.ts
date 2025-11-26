import prisma from "../../../config/prisma.ts";
import BadRequest from "../../../helper/exception/badRequest.ts";
import {
   buildPublisherLogoPath,
   buildPublisherW9Paths,
   removeFileIfExists,
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
import path from "node:path";
import fs from "fs";

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
            for (const p of data.products) {
               await tx.publisherProduct.create({
                  data: {
                     publisherId: publisher.id,
                     productId: p.productId,
                     price: p.price,
                  },
               });
            }
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
      const page = Math.max(Number(query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
      const search = query.search?.trim() || "";
      const normalizeDate = (date: Date) => {
         const normalized = new Date(date);
         normalized.setHours(0, 0, 0, 0);
         return normalized;
      };
      const fromDate = query.fromDate
         ? normalizeDate(new Date(query.fromDate))
         : null;
      const toDate = query.toDate
         ? normalizeDate(new Date(query.toDate))
         : null;

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

      const skip = (page - 1) * limit;

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
   // data: UpdatePublisherDTO,
   rawData: any,
   logoFilename?: string,
   w9Filenames?: string[],
   removedW9Files: string[] = []
) {
   try {
      let removedW9Files: string[] = [];
      if (rawData.removedW9Files) {
         try {
            removedW9Files = JSON.parse(rawData.removedW9Files);
            if (!Array.isArray(removedW9Files)) removedW9Files = [];
         } catch (e) {
            throw new BadRequest(
               "Invalid removedW9Files payload",
               "INVALID_PAYLOAD"
            );
         }
      }
      let products: any[] | undefined = undefined;
      if (rawData.products) {
         try {
            const parsed =
               typeof rawData.products === "string"
                  ? JSON.parse(rawData.products)
                  : rawData.products;
            if (Array.isArray(parsed)) products = parsed;
         } catch (e) {
            throw new BadRequest("Invalid products payload", "INVALID_PAYLOAD");
         }
      }
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
      const newW9Paths = w9Filenames
         ? buildPublisherW9Paths(w9Filenames)
         : undefined;

      const removedSet = new Set(
         (removedW9Files || []).filter((x) => typeof x === "string")
      );

      const filteredW9 = (existing.w9Files || []).filter(
         (f) => !removedSet.has(f)
      );

      const finalW9Files = newW9Paths
         ? [...filteredW9, ...newW9Paths]
         : filteredW9;

      const updated = await prisma.$transaction(async (tx) => {
         const updateData: any = {
            ...(data.publisherName
               ? { publisherName: data.publisherName }
               : {}),
            ...(data.email ? { email: data.email } : {}),
            ...(data.phoneNo ? { phoneNo: data.phoneNo } : {}),
            ...(data.whatsappNo ? { whatsappNo: data.whatsappNo } : {}),
            ...(data.description ? { description: data.description } : {}),
            ...(logoPath ? { logo: logoPath } : {}),
            w9Files: finalW9Files,
         };

         const pub = await tx.publisher.update({
            where: { id },
            data: updateData,
         });

         if (data.products && Array.isArray(data.products)) {
            const providedProductIds = data.products.map(
               (p: any) => p.productId
            );

            for (const p of data.products) {
               const found = await tx.publisherProduct.findUnique({
                  where: {
                     publisherId_productId: {
                        publisherId: id,
                        productId: p.productId,
                     },
                  } as any,
               });
               if (found) {
                  await tx.publisherProduct.update({
                     where: { id: found.id },
                     data: { price: p.price },
                  });
               } else {
                  await tx.publisherProduct.create({
                     data: {
                        publisherId: id,
                        productId: p.productId,
                        price: p.price,
                     },
                  });
               }
            }

            await tx.publisherProduct.deleteMany({
               where: {
                  publisherId: id,
                  productId: { notIn: providedProductIds },
               },
            });
         }

         return pub;
      });

      if (Array.isArray(removedW9Files) && removedW9Files.length > 0) {
         for (const filePath of removedW9Files) {
            try {
               const filename = path.basename(filePath);
               const fullPath = path.join(
                  process.cwd(),
                  "public",
                  filenameStartsWithSlash(filePath)
                     ? filePath.replace(/^\//, "")
                     : filePath
               );
               if (fs.existsSync(fullPath)) {
                  fs.unlinkSync(fullPath);
               }
            } catch (err) {
               console.error(
                  "Failed to delete removed w9 file:",
                  filePath,
                  err
               );
            }
         }
      }

      if (logoPath && existing.logo && existing.logo !== logoPath) {
         await removeFileIfExists(existing.logo);
      }

      await safeRedisDelPattern(`publisher:id=${id}`);
      await safeRedisDelPattern("publishers:*");
      return updated;
   } catch (err: any) {
      if (err.code === "P2002")
         throw new BadRequest("Unique constraint failed", "DUPLICATE_ENTRY");
      throw err;
   }
}

function filenameStartsWithSlash(p: string) {
   return typeof p === "string" && p.startsWith("/");
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
