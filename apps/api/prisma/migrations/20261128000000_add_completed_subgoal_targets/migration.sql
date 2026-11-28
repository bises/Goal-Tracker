CREATE TYPE "GoalProgressMode" AS ENUM ('AUTOMATIC', 'COMPLETED_SUBGOALS');

ALTER TABLE "Goal"
    ADD COLUMN "progressMode" "GoalProgressMode" NOT NULL DEFAULT 'AUTOMATIC',
    ADD CONSTRAINT "Goal_completed_subgoals_target_check" CHECK (
        "progressMode" <> 'COMPLETED_SUBGOALS'
        OR ("targetValue" IS NOT NULL AND "targetValue" >= 1 AND "targetValue" <= 2147483647
            AND "targetValue" = trunc("targetValue"))
    );

CREATE INDEX "Goal_parentId_isMarkedComplete_idx" ON "Goal"("parentId", "isMarkedComplete");
