-- Create function to get all goals (lean version for list view)
-- Returns only fields needed by the UI, including parent via LEFT JOIN
-- Filters by completion status and date range (defaults to current year)
CREATE OR REPLACE FUNCTION get_all_goals(
  include_completed boolean DEFAULT false,
  start_date timestamp DEFAULT date_trunc('year', now()),
  end_date timestamp DEFAULT date_trunc('year', now()) + interval '1 year' - interval '1 day'
)
RETURNS TABLE (
  id text,
  title text,
  scope "GoalScope",
  "progressMode" "ProgressMode",
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
    g."progressMode",
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