/*
  Warnings:

  - Made the column `userId` on table `systemPrompts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `userPrompts` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "systemPrompts" DROP CONSTRAINT "systemPrompts_userId_fkey";

-- DropForeignKey
ALTER TABLE "userPrompts" DROP CONSTRAINT "userPrompts_userId_fkey";

-- AlterTable
ALTER TABLE "systemPrompts" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "userPrompts" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "systemPrompts" ADD CONSTRAINT "systemPrompts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userPrompts" ADD CONSTRAINT "userPrompts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
