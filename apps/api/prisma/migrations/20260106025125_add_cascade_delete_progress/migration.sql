-- DropForeignKey
ALTER TABLE "Progress" DROP CONSTRAINT "Progress_goalId_fkey";

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
