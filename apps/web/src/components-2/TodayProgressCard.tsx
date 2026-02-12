import { getTodayString } from '@goal-tracker/shared';
import { useMemo } from 'react';
import { Badge } from '../components/ui/badge';
import { useTaskContext } from '../contexts/TaskContext';
import { SquircleCard } from './SquircleCard';

export const TodayProgressCard = () => {
  const { tasks } = useTaskContext();

  const todayStats = useMemo(() => {
    const today = getTodayString();

    const todayTasks = tasks
      .filter((task) => task && task.id) // Filter out undefined/invalid tasks
      .filter((task) => {
        if (!task.scheduledDate) return false;
        // Extract date part from ISO timestamp (e.g., "2026-02-04T00:00:00.000Z" -> "2026-02-04")
        const taskDate = task.scheduledDate.split('T')[0];
        return taskDate === today;
      });

    const completedTasks = todayTasks.filter((task) => task.isCompleted);

    return {
      total: todayTasks.length,
      completed: completedTasks.length,
      percentage: todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0,
    };
  }, [tasks]);

  const getMotivationMessage = () => {
    const { percentage } = todayStats;

    if (percentage === 100) return 'Amazing work! 🎉';
    if (percentage >= 75) return 'Almost there! 🔥';
    if (percentage >= 50) return "You're halfway! 💪";
    if (percentage >= 25) return 'Keep it up! ✨';
    return 'Keep it up!';
  };

  return (
    <SquircleCard variant="glow" className="p-6">
      {/* Header with Badge */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-lg font-semibold" style={{ color: 'var(--deep-charcoal)' }}>
            Today's Progress
          </div>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--warm-gray)' }}>
            {getMotivationMessage()}
          </p>
        </div>
        <Badge
          className="text-sm font-bold"
          style={{
            background: 'rgba(255, 140, 66, 0.15)',
            color: 'var(--energizing-orange)',
            border: 'none',
          }}
        >
          {Math.round(todayStats.percentage)}%
        </Badge>
      </div>

      {/* Simple Progress Bar */}
      <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-6">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${todayStats.percentage}%`,
            background: 'var(--gradient-primary)',
            boxShadow: todayStats.percentage > 0 ? 'var(--glow-gradient)' : 'none',
          }}
        />
      </div>

      {/* Tasks Done Display */}
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold" style={{ color: 'var(--deep-charcoal)' }}>
          {todayStats.completed}/{todayStats.total}
        </span>
        <span className="font-medium pt-1" style={{ color: 'var(--warm-gray)' }}>
          Tasks Done
        </span>
      </div>
    </SquircleCard>
  );
};
