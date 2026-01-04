-- CreateEnum
CREATE TYPE "GoalScope" AS ENUM ('YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'STANDALONE');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "scheduledDate" TIMESTAMP(3),
ADD COLUMN     "scope" "GoalScope" NOT NULL DEFAULT 'STANDALONE';

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
