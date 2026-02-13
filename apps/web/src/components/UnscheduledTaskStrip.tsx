import { AnimatePresence, motion } from 'framer-motion';
import { Task } from '../types';

interface UnscheduledTaskStripProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

const getCategoryColor = (category?: string): string => {
  const colors: Record<string, string> = {
    WORK: '#3b82f6',
    PERSONAL: '#8b5cf6',
    HEALTH: '#10b981',
    LEARNING: '#f59e0b',
    FINANCE: '#06b6d4',
    SOCIAL: '#ec4899',
    HOUSEHOLD: '#f97316',
    OTHER: '#6b7280',
  };
  return colors[category || ''] || '#ff8c42';
};

export const UnscheduledTaskStrip = ({
  tasks,
  onTaskClick,
  className = '',
  showLabel = true,
  label = 'Unscheduled',
}: UnscheduledTaskStripProps) => {
  if (tasks.length === 0) return null;

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--warm-gray)' }}>
            {label}
          </h3>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(255, 140, 66, 0.15)',
              color: 'var(--energizing-orange)',
            }}
          >
            {tasks.length}
          </span>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => {
            const color = getCategoryColor(task.category);
            return (
              <motion.button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium max-w-[200px] truncate select-none active:scale-95 transition-transform"
                style={{
                  background: `${color}12`,
                  border: `1px solid ${color}30`,
                  color: 'var(--deep-charcoal)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.5,
                  y: -20,
                  transition: { duration: 0.3, ease: 'easeOut' },
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: `0 2px 8px ${color}30`,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                title={task.title}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="truncate">{task.title}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
