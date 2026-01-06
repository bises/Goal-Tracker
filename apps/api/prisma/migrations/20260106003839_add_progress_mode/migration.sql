-- CreateEnum
CREATE TYPE "ProgressMode" AS ENUM ('TASK_BASED', 'MANUAL_TOTAL', 'HABIT');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "progressMode" "ProgressMode" NOT NULL DEFAULT 'TASK_BASED';
