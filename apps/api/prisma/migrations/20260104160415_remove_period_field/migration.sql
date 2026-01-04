/*
  Warnings:

  - You are about to drop the column `period` on the `Goal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "period";

-- DropEnum
DROP TYPE "GoalPeriod";
