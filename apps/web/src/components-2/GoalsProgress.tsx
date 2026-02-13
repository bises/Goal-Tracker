import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { useGoalContext } from '../contexts/GoalContext';
import { Goal, GoalScope } from '../types';
import { SquircleCard } from './SquircleCard';

export const GoalsProgress = () => {
  const { goals, loading } = useGoalContext();
  const navigate = useNavigate();

  const activeGoals = useMemo(() => {
    // Filter goals by scope - show all goals with YEARLY, MONTHLY, or WEEKLY scope
    return goals.filter((goal) => {
      if (!goal || !goal.id) return false;

      // Show all goals with these scopes
      return goal.scope === 'YEARLY' || goal.scope === 'MONTHLY' || goal.scope === 'WEEKLY';
    });
  }, [goals]);

  const getScopeLabel = (scope: GoalScope): string => {
    switch (scope) {
      case 'YEARLY':
        return 'This Year';
      case 'MONTHLY':
        return 'This Month';
      case 'WEEKLY':
        return 'This Week';
      default:
        return '';
    }
  };

  const getScopeColor = (scope: GoalScope) => {
    switch (scope) {
      case 'YEARLY':
        return { bg: 'rgba(147, 51, 234, 0.15)', color: '#9333EA' }; // Purple
      case 'MONTHLY':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }; // Blue
      case 'WEEKLY':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }; // Green
      default:
        return { bg: 'rgba(107, 114, 128, 0.15)', color: '#6B7280' }; // Gray
    }
  };

  const getProgress = (goal: Goal): number => {
    // Check progressSummary first
    if (goal.progressSummary) {
      return Math.round(goal.progressSummary.percentComplete);
    }

    // Fallback: calculate from currentValue and targetValue
    if (goal.targetValue && goal.targetValue > 0) {
      const percentage = (goal.currentValue / goal.targetValue) * 100;
      return Math.round(Math.min(percentage, 100));
    }

    return 0;
  };

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
        {activeGoals.map((goal) => {
          const progress = getProgress(goal);
          const scopeColors = getScopeColor(goal.scope);

          return (
            <SquircleCard
              key={goal.id}
              className="p-3 transition-all hover:shadow-lg cursor-pointer"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(147, 51, 234, 0.03) 100%)',
              }}
              onClick={() => navigate(`/goals/${goal.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">
                  <div
                    className="font-semibold text-sm truncate"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    {goal.title}
                  </div>
                  {goal.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--warm-gray)' }}>
                      {goal.description}
                    </p>
                  )}
                </div>
                <Badge
                  className="text-xs font-medium flex-shrink-0"
                  style={{
                    background: scopeColors.bg,
                    color: scopeColors.color,
                    border: 'none',
                  }}
                >
                  {getScopeLabel(goal.scope)}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--warm-gray)' }}>
                    Progress
                  </span>
                  <span className="text-xs font-bold" style={{ color: scopeColors.color }}>
                    {progress}%
                  </span>
                </div>
                <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${scopeColors.color}99, ${scopeColors.color})`,
                    }}
                  />
                </div>
              </div>
            </SquircleCard>
          );
        })}
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
