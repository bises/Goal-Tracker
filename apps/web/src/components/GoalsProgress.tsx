import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { useGoalContext } from '../contexts/GoalContext';
import { GoalCard } from './GoalCard';

export const GoalsProgress = () => {
  const { goals, loading, fetchGoals } = useGoalContext();
  const navigate = useNavigate();

  const activeGoals = useMemo(() => {
    // Filter goals by scope - show all goals with YEARLY, MONTHLY, or WEEKLY scope
    return goals.filter((goal) => {
      if (!goal || !goal.id) return false;

      // Show all goals with these scopes
      return goal.scope === 'YEARLY' || goal.scope === 'MONTHLY' || goal.scope === 'WEEKLY';
    });
  }, [goals]);

  if (loading) {
    return null; // Or show a skeleton
  }

  if (activeGoals.length === 0) {
    return null; // Don't show section if no active goals
  }

  return (
    <section className="space-y-4">
      <div className="px-4">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold font-display" style={{ color: 'var(--deep-charcoal)' }}>
            Active Goals
          </div>
          <Badge
            className="text-xs font-bold"
            style={{
              background: 'rgba(147, 51, 234, 0.15)',
              color: '#9333EA',
              border: 'none',
            }}
          >
            {activeGoals.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {activeGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onUpdate={fetchGoals} variant="compact" />
        ))}
      </div>

      {activeGoals.length > 3 && (
        <button
          className="w-full mt-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 rounded-lg"
          style={{ color: 'var(--warm-gray)' }}
          onClick={() => navigate('/goals')}
        >
          See all {activeGoals.length} goals →
        </button>
      )}
    </section>
  );
};
