import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { RoleId } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
   const adminEmail = process?.env?.ADMIN_EMAIL;
   const adminPass = process.env.ADMIN_PASS;

   if (!adminEmail || !adminPass) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASS must be defined in .env");
  }  

   const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
   });

   if (existingAdmin) {
      console.log("Admin already exists");
      return;
   }

   const hashedPassword = await bcrypt.hash(adminPass, 10);

   // Create admin user
   await prisma.user.create({
      data: {
         firstName: "Super",
         lastName: "Admin",
         email: adminEmail,
         password: hashedPassword,
         roleId: RoleId.UserAdmin,
         phoneNumber: "9999999999",
      },
   });

   console.log("Admin user seeded successfully");
}

main()
   .catch((e) => {
      console.error(e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
