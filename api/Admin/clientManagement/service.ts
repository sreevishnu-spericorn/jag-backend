import prisma from "../../../config/prisma.ts";
import BadRequest from "../../../helper/exception/badRequest.ts";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { RoleId } from "@prisma/client";
import {
   ClientCreateDTO,
   ClientUpdateDTO,
} from "../../../types/clientTypes/clientTypes.ts";
import transporter from "../../../config/nodemailer-config.ts";
import {
   safeRedisDelPattern,
   safeRedisGet,
   safeRedisSet,
} from "../../../utils/clients/clientRedis.ts";
import {
   buildLogoPath,
   removeFileIfExists,
} from "../../../utils/clients/clientFileManagement.ts";

// const RESET_PASSWORD_AUDIENCE = "resetPassword";
// const TEMP_TOKEN_SECRET = process.env.JWT_SECRET as string;
// const CLIENT_FRONTEND = process.env.CLIENT_URL;

async function createClient(data: ClientCreateDTO, logoFilename?: string) {
   try {
      if (!data.email)
         throw new BadRequest("Email is required", "INVALID_PAYLOAD");

      console.log("Data is", data);

      const randomPassword = crypto.randomBytes(6).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const logoPath = buildLogoPath(logoFilename);

      const result = await prisma.$transaction(async (tx) => {
         const existingUser = await tx.user.findUnique({
            where: { email: data.email },
         });
         console.log(existingUser);
         if (existingUser)
            throw new BadRequest(
               "User with this email already exists",
               "EMAIL_EXISTS"
            );

         const existingClient = await tx.client.findUnique({
            where: { email: data.email },
         });
         if (existingClient)
            throw new BadRequest(
               "Client with this email already exists",
               "EMAIL_EXISTS"
            );

         const user = await tx.user.create({
            data: {
               email: data.email,
               password: hashedPassword,
               firstName: data.contactName ?? undefined,
               phoneNumber: data.phone ?? undefined,
               roleId: RoleId.User,
            },
         });

         const client = await tx.client.create({
            data: {
               userId: user.id,
               accountName: data.accountName,
               contactName: data.contactName,
               email: data.email,
               phone: data.phone,
               logo: logoPath,
            },
         });

         return { user, client };
      });

      await safeRedisDelPattern("clients:*");

      if (data.sendWelcome) {
         //    try {
         //       const token = jwt.sign(
         //          { id: result.user.id, email: result.user.email },
         //          TEMP_TOKEN_SECRET,
         //          {
         //             expiresIn: "15m",
         //             audience: RESET_PASSWORD_AUDIENCE,
         //          }
         //       );
         //       const resetLink = `${CLIENT_FRONTEND}/forgot-password?token=${token}`;
         //       const html = `
         //     <p>Hi ${result.client.contactName || result.user.email},</p>
         //     <p>A client account has been created for you. Please set your password using the link below:</p>
         //     <p><a href="${resetLink}">Set your password</a></p>
         //     <p>This link expires in 15 minutes.</p>
         //   `;
         //       await transporter.sendMail({
         //          from: process.env.MAILER_FROM,
         //          to: result.user.email,
         //          subject: "Welcome — Set your password",
         //          html,
         //       });
         //    } catch (err) {
         //       console.error("Email sending failed:", err);
         //    }
      }

      return result.client;
   } catch (error: any) {
      if (error.code === "P2002") {
         throw new BadRequest("Unique constraint failed", "DUPLICATE_ENTRY");
      }
      console.error(error);
      throw error;
   }
}

const getClients = async (query: any) => {
   try {
      const page = Math.max(Number(query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
      const search = query.search?.trim() || "";

      const normalizeDate = (date: Date) => {
         const d = new Date(date);
         d.setHours(0, 0, 0, 0);
         return d;
      };

      const fromDate = query.fromDate
         ? normalizeDate(new Date(query.fromDate))
         : null;
      const toDate = query.toDate
         ? normalizeDate(new Date(query.toDate))
         : null;

      const skip = (page - 1) * limit;

      const cacheKey = `clients:page=${page}:limit=${limit}${query.q ? `:q=${query.q}` : ""}:search=${search}:fromDate=${fromDate?.toISOString()}:toDate=${toDate?.toISOString()}`;

      const cached = await safeRedisGet(cacheKey);
      if (cached) {
         console.log("💾 Data from Redis Cache");
         return JSON.parse(cached);
      }

      const where: any = { isDeleted: false };

      if (search) {
         where.OR = [
            { accountName: { contains: search, mode: "insensitive" } },
            { contactName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
         ];
      }

      if (fromDate) where.createdAt = { gte: fromDate };
      if (toDate) where.createdAt = { ...where.createdAt, lte: toDate };

      if (query.q) {
         where.OR = [
            {
               accountName: {
                  contains: query.q as string,
                  mode: "insensitive",
               },
            },
            {
               contactName: {
                  contains: query.q as string,
                  mode: "insensitive",
               },
            },
            { email: { contains: query.q as string, mode: "insensitive" } },
         ];
      }

      const [clients, total] = await Promise.all([
         prisma.client.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
         }),
         prisma.client.count({ where }),
      ]);

      const result = {
         clients,
         pagination: { total, page, pages: Math.ceil(total / limit), limit },
      };
      await safeRedisSet(cacheKey, result, 60);

      return result;
   } catch (err) {
      throw err;
   }
};

async function getClientById(id: string) {
   try {
      const cacheKey = `client:id=${id}`;
      const cached = await safeRedisGet(cacheKey);
      if (cached) return JSON.parse(cached);

      const client = await prisma.client.findUnique({ where: { id } });
      if (!client || client.isDeleted)
         throw new BadRequest("Client not found", "NOT_FOUND");

      await safeRedisSet(cacheKey, client, 300);

      return client;
   } catch (err) {
      throw err;
   }
}

async function updateClient(
   id: string,
   data: ClientUpdateDTO,
   logoFilename?: string
) {
   try {
      const existing = await prisma.client.findUnique({ where: { id } });
      if (!existing || existing.isDeleted)
         throw new BadRequest("Client not found", "NOT_FOUND");

      console.log("Data is", data);
      const { welcomeEmail, ...rest } = data;

      if (data.email && data.email !== existing.email) {
         const other = await prisma.client.findUnique({
            where: { email: data.email },
         });
         if (other)
            throw new BadRequest(
               "Another client with this email exists",
               "EMAIL_EXISTS"
            );
      }

      const logoPath = logoFilename ? buildLogoPath(logoFilename) : undefined;

      console.log("LogoPath is", logoPath);

      const updated = await prisma.client.update({
         where: { id },
         data: {
            ...rest,
            ...(logoPath ? { logo: logoPath } : {}),
         },
      });

      console.log("Updated is", updated);

      if (logoPath && existing.logo && existing.logo !== logoPath) {
         await removeFileIfExists(existing.logo);
      }

      await safeRedisDelPattern(`client:id=${id}`);
      await safeRedisDelPattern("clients:*");

      return updated;
   } catch (err) {
      throw err;
   }
}

async function deleteClient(id: string) {
   try {
      const existing = await prisma.client.findUnique({ where: { id } });
      if (!existing || existing.isDeleted)
         throw new BadRequest("Client not found", "NOT_FOUND");

      const updated = await prisma.client.update({
         where: { id },
         data: { isDeleted: true },
      });

      await safeRedisDelPattern("clients:*");

      return updated;
   } catch (err) {
      throw err;
   }
}

export default {
   createClient,
   getClients,
   getClientById,
   updateClient,
   deleteClient,
};