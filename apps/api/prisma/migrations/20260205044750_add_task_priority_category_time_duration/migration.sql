-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('WORK', 'PERSONAL', 'HEALTH', 'LEARNING', 'FINANCE', 'SOCIAL', 'HOUSEHOLD', 'OTHER');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "category" "TaskCategory",
ADD COLUMN     "estimatedCompletionDate" TIMESTAMP(3),
ADD COLUMN     "estimatedDurationMinutes" INTEGER,
ADD COLUMN     "priority" "TaskPriority",
ADD COLUMN     "scheduledTime" TEXT;
