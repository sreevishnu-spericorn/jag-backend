/*
  Warnings:

  - The values [User] on the enum `RoleId` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoleId_new" AS ENUM ('UserAdmin', 'Client', 'Publisher');
ALTER TABLE "User" ALTER COLUMN "roleId" TYPE "RoleId_new" USING ("roleId"::text::"RoleId_new");
ALTER TYPE "RoleId" RENAME TO "RoleId_old";
ALTER TYPE "RoleId_new" RENAME TO "RoleId";
DROP TYPE "public"."RoleId_old";
COMMIT;
