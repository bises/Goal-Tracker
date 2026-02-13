import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Task } from '../types';

/**
 * Drop target info returned when a task pill is dropped on a recognized element.
 * The parent decides what to do based on which attribute matched.
 */
export interface DropTargetHit {
  /** The DOM element that was hit */
  element: Element;
  /** The pointer position at drop time */
  point: { x: number; y: number };
}

interface DraggableTaskStripProps {
  /** Tasks to render as draggable pills */
  tasks: Task[];
  /** Data attribute(s) on valid drop target elements (e.g. 'data-calendar-day', 'data-timeline-area') */
  dropTargetAttributes: string[];
  /** Called when a pill is dropped on a matching target */
  onDrop: (task: Task, hit: DropTargetHit) => void;
  /** Called when a pill is being dragged over a matching target (for hover highlights) */
  onDragOverTarget?: (task: Task, hit: DropTargetHit | null) => void;
  /** Called when a pill is clicked (not dragged) */
  onTaskClick: (task: Task) => void;
  /** Optional wrapper className */
  className?: string;
  /** Whether to show the label header */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
}

export const DraggableTaskStrip = ({
  tasks,
  dropTargetAttributes,
  onDrop,
  onDragOverTarget,
  onTaskClick,
  className = '',
  showLabel = true,
  label = 'Unscheduled',
}: DraggableTaskStripProps) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [resetKeys, setResetKeys] = useState<Record<string, number>>({});
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

  const findDropTarget = (x: number, y: number): { element: Element } | null => {
    const elements = document.elementsFromPoint(x, y);
    for (const attr of dropTargetAttributes) {
      const match = elements.find((el) => el.hasAttribute(attr));
      if (match) return { element: match };
    }
    return null;
  };

  const resetPill = (taskId: string) => {
    setResetKeys((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] ?? 0) + 1,
    }));
    setDragPositions((prev) => ({
      ...prev,
      [taskId]: { x: 0, y: 0 },
    }));
  };

  if (tasks.length === 0) return null;

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--warm-gray)' }}>
            {label} ({tasks.length})
          </h3>
        </div>
      )}
      <div
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-transparent"
        style={{ overflow: 'visible' }}
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={`${task.id}-${resetKeys[task.id] ?? 0}`}
              className="flex-shrink-0 px-3 py-1.5 rounded-full cursor-grab active:cursor-grabbing text-sm font-medium max-w-[200px] truncate"
              style={{
                background: 'var(--gradient-subtle)',
                border: '1px solid var(--card-border)',
                color: 'var(--energizing-orange)',
                touchAction: 'none',
              }}
              drag
              dragElastic={0}
              dragMomentum={false}
              dragConstraints={false}
              animate={{
                opacity: 1,
                scale: 1,
                x: dragPositions[task.id]?.x ?? 0,
                y: dragPositions[task.id]?.y ?? 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }}
              onDragStart={() => {
                setDraggedTask(task);
              }}
              onDrag={(_event, info) => {
                const { x, y } = info.point;
                const hit = findDropTarget(x, y);
                onDragOverTarget?.(task, hit ? { element: hit.element, point: { x, y } } : null);
              }}
              onDragEnd={async (_event, info) => {
                const { x, y } = info.point;
                const hit = findDropTarget(x, y);

                if (hit) {
                  await onDrop(task, { element: hit.element, point: { x, y } });
                }

                // Always reset the pill position (whether drop succeeded or not,
                // the task will disappear from unscheduled if it was scheduled)
                resetPill(task.id);
                setDraggedTask(null);
                onDragOverTarget?.(task, null);
              }}
              onClick={() => {
                if (!draggedTask) {
                  onTaskClick(task);
                }
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              exit={{
                opacity: 0,
                scale: 0.5,
                y: -20,
                transition: { duration: 0.3, ease: 'easeOut' },
              }}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 2px 8px rgba(255, 140, 66, 0.2)',
              }}
              whileTap={{ scale: 0.95 }}
              whileDrag={{
                scale: 1.1,
                zIndex: 9999,
                boxShadow: '0 8px 24px rgba(255, 140, 66, 0.5)',
                rotate: 5,
                cursor: 'grabbing',
              }}
              title={task.title}
            >
              {task.title}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
