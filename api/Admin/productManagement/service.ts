import prisma from "../../../config/prisma.ts";
import BadRequest from "../../../helper/exception/badRequest.ts";
import { parseListQuery } from "../../../utils/common/query.ts";
import {
   safeRedisDelPattern,
   safeRedisGet,
   safeRedisSet,
} from "../../../utils/products/productRedis.ts";

const createProduct = async (data: { productName: string }) => {
   try {
      const exists = await prisma.product.findUnique({
         where: { productName: data.productName },
      });

      if (exists)
         throw new BadRequest("Product already exists", "DUPLICATE_ENTRY");

      const product = await prisma.product.create({
         data: { productName: data.productName },
      });

      await safeRedisDelPattern("products:*");

      return product;
   } catch (error) {
      throw error;
   }
};

const getProducts = async (query: any) => {
   try {
      const { page, limit, search, fromDate, toDate, skip } = parseListQuery(query);

      const cacheKey = `products:page=${page}:limit=${limit}:search=${search}:fromDate=${fromDate?.toISOString()}:toDate=${toDate?.toISOString()}`;

      const cached = await safeRedisGet(cacheKey);
      if (cached) {
         console.log("💾 Data from Redis Cache");
         return JSON.parse(cached);
      }

      console.log("🗄 Fetching from DB");
      const whereCondition: any = { isDeleted: false };

      if (search) {
         whereCondition.productName = { contains: search, mode: "insensitive" };
      }

      if (fromDate) {
         whereCondition.createdAt = { gte: fromDate };
      }

      if (toDate) {
         whereCondition.createdAt = {
            ...whereCondition.createdAt,
            lte: toDate,
         };
      }

      console.log("From date is", fromDate, "To date is ", toDate);

      const [products, total] = await Promise.all([
         prisma.product.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
         }),
         prisma.product.count({
            where: whereCondition,
         }),
      ]);

      const result = {
         products,
         pagination: { total, page, pages: Math.ceil(total / limit), limit },
      };

      await safeRedisSet(cacheKey, result, 60);

      return result;
   } catch (err) {
      throw err;
   }
};

const getProductById = async (id: string) => {
   try {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) throw new BadRequest("Product not found", "NOT_FOUND");
      return product;
   } catch (err) {
      throw err;
   }
};

const updateProduct = async (id: string, data: any) => {
   try {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) throw new BadRequest("Product not found", "NOT_FOUND");

      await safeRedisDelPattern("products:*");

      return await prisma.product.update({ where: { id }, data });
   } catch (err) {
      throw err;
   }
};

export const deleteProduct = async (id: string) => {
   try {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) throw new BadRequest("Product not found", "NOT_FOUND");

      console.log("🗑 Updating product delete flag...");
      const updated = await prisma.product.update({
         where: { id },
         data: { isDeleted: true },
      });

      await safeRedisDelPattern("products:*");

      return updated;
   } catch (err) {
      console.error("❌ Delete failed:", err);
      throw err;
   }
};

export default {
   createProduct,
   getProducts,
   getProductById,
   updateProduct,
   deleteProduct,
};
