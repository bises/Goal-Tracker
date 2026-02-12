/*
  Warnings:

  - The values [HABIT] on the enum `GoalType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `progressMode` on the `Goal` table. All the data in the column will be lost.

*/

-- Step 1: Convert any existing HABIT goals to TOTAL_TARGET
UPDATE "Goal" SET type = 'TOTAL_TARGET' WHERE type = 'HABIT';

-- Step 2: Remove HABIT from GoalType enum
ALTER TYPE "GoalType" RENAME TO "GoalType_old";
CREATE TYPE "GoalType" AS ENUM ('TOTAL_TARGET', 'FREQUENCY');
ALTER TABLE "Goal"
  ALTER COLUMN type TYPE "GoalType" USING (type::text::"GoalType");
DROP TYPE "GoalType_old";

-- Step 3: Add default to type column if not already present
ALTER TABLE "Goal" ALTER COLUMN type SET DEFAULT 'TOTAL_TARGET';

-- Step 4: Drop the function that depends on ProgressMode
DROP FUNCTION IF EXISTS get_all_goals(boolean, timestamp, timestamp);

-- Step 5: Drop progressMode column
ALTER TABLE "Goal" DROP COLUMN IF EXISTS "progressMode";

-- Step 6: Drop ProgressMode enum (now safe after dropping dependent function)
DROP TYPE IF EXISTS "ProgressMode";

-- Step 7: Recreate get_all_goals function without progressMode
CREATE OR REPLACE FUNCTION get_all_goals(
  include_completed boolean DEFAULT false,
  start_date timestamp DEFAULT date_trunc('year', now()),
  end_date timestamp DEFAULT date_trunc('year', now()) + interval '1 year' - interval '1 day'
)
RETURNS TABLE (
  id text,
  title text,
  scope "GoalScope",
  type "GoalType",
  "currentValue" double precision,
  "targetValue" double precision,
  "parentId" text,
  "isMarkedComplete" boolean,
  "createdAt" timestamp(3),
  "updatedAt" timestamp(3),
  parent jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.title,
    g.scope,
    g.type,
    g."currentValue",
    g."targetValue",
    g."parentId",
    g."isMarkedComplete",
    g."createdAt",
    g."updatedAt",
    CASE
      WHEN p.id IS NOT NULL THEN
        jsonb_build_object('id', p.id, 'title', p.title, 'scope', p.scope)
      ELSE NULL
    END as parent
  FROM "Goal" g
  LEFT JOIN "Goal" p ON g."parentId" = p.id
  WHERE
    (include_completed = true OR g."isMarkedComplete" = false)
    AND g."createdAt" >= start_date
    AND g."createdAt" <= end_date
  ORDER BY g."createdAt" DESC;
END;
$$ LANGUAGE plpgsql;
