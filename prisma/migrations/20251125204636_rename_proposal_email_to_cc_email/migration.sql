/*
  Warnings:

  - You are about to drop the column `proposalEmail` on the `Proposal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "proposalEmail",
ADD COLUMN     "ccEmail" TEXT;
