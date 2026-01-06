/*
  Warnings:

  - The values [DAILY] on the enum `GoalScope` will be removed. If these variants are still used in the database, this will fail.
  - The values [COMPLETION] on the enum `GoalType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `completedAt` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledDate` on the `Goal` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GoalScope_new" AS ENUM ('YEARLY', 'MONTHLY', 'WEEKLY', 'STANDALONE');
ALTER TABLE "Goal" ALTER COLUMN "scope" DROP DEFAULT;
ALTER TABLE "Goal" ALTER COLUMN "scope" TYPE "GoalScope_new" USING ("scope"::text::"GoalScope_new");
ALTER TYPE "GoalScope" RENAME TO "GoalScope_old";
ALTER TYPE "GoalScope_new" RENAME TO "GoalScope";
DROP TYPE "GoalScope_old";
ALTER TABLE "Goal" ALTER COLUMN "scope" SET DEFAULT 'STANDALONE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "GoalType_new" AS ENUM ('TOTAL_TARGET', 'FREQUENCY', 'HABIT');
ALTER TABLE "Goal" ALTER COLUMN "type" TYPE "GoalType_new" USING ("type"::text::"GoalType_new");
ALTER TYPE "GoalType" RENAME TO "GoalType_old";
ALTER TYPE "GoalType_new" RENAME TO "GoalType";
DROP TYPE "GoalType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "completedAt",
DROP COLUMN "isCompleted",
DROP COLUMN "scheduledDate";

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "size" INTEGER NOT NULL DEFAULT 1,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "goalId" TEXT,
    "parentTaskId" TEXT,
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
