/*
  Warnings:

  - Added the required column `userId` to the `Publisher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Publisher" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Publisher" ADD CONSTRAINT "Publisher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
