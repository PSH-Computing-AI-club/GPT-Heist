/*
  Warnings:

  - You are about to drop the column `systemPromptId` on the `chatResults` table. All the data in the column will be lost.
  - You are about to drop the column `userPromptId` on the `chatResults` table. All the data in the column will be lost.
  - You are about to drop the `systemPrompts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userPrompts` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PromptType" AS ENUM ('USER', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "chatResults" DROP CONSTRAINT "chatResults_systemPromptId_fkey";

-- DropForeignKey
ALTER TABLE "chatResults" DROP CONSTRAINT "chatResults_userPromptId_fkey";

-- DropForeignKey
ALTER TABLE "systemPrompts" DROP CONSTRAINT "systemPrompts_userId_fkey";

-- DropForeignKey
ALTER TABLE "userPrompts" DROP CONSTRAINT "userPrompts_userId_fkey";

-- AlterTable
ALTER TABLE "chatResults" DROP COLUMN "systemPromptId",
DROP COLUMN "userPromptId";

-- DropTable
DROP TABLE "systemPrompts";

-- DropTable
DROP TABLE "userPrompts";

-- CreateTable
CREATE TABLE "prompts" (
    "id" SERIAL NOT NULL,
    "prompt" TEXT NOT NULL,
    "type" "PromptType" NOT NULL,
    "userId" INTEGER NOT NULL,
    "chatResultId" INTEGER,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_chatResultId_fkey" FOREIGN KEY ("chatResultId") REFERENCES "chatResults"("id") ON DELETE SET NULL ON UPDATE CASCADE;
