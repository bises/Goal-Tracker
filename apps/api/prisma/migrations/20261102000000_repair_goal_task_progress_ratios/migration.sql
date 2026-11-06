-- Data Migration: Repair Goal targetValue and currentValue ratios (Issue #14)

-- Step 1: Recalculate targetValue and currentValue for all goals with direct tasks
WITH task_stats AS (
  SELECT 
    gt."goalId",
    COUNT(DISTINCT t.id)::double precision AS total_tasks,
    COUNT(DISTINCT CASE WHEN t."isCompleted" = true THEN t.id END)::double precision AS completed_tasks
  FROM "GoalTask" gt
  JOIN "Task" t ON gt."taskId" = t.id
  GROUP BY gt."goalId"
)
UPDATE "Goal" g
SET 
  "targetValue" = ts.total_tasks,
  "currentValue" = ts.completed_tasks
FROM task_stats ts
WHERE g.id = ts."goalId";

-- Step 2: Recalculate targetValue and currentValue for parent goals that track child goals (and have no direct tasks)
WITH child_stats AS (
  SELECT 
    c."parentId",
    COUNT(DISTINCT c.id)::double precision AS total_children,
    COUNT(DISTINCT CASE WHEN c."isMarkedComplete" = true THEN c.id END)::double precision AS completed_children
  FROM "Goal" c
  WHERE c."parentId" IS NOT NULL
  GROUP BY c."parentId"
)
UPDATE "Goal" g
SET 
  "targetValue" = cs.total_children,
  "currentValue" = cs.completed_children
FROM child_stats cs
WHERE g.id = cs."parentId"
  AND NOT EXISTS (SELECT 1 FROM "GoalTask" gt WHERE gt."goalId" = g.id);
