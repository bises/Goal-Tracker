/**
 * ⚠️  CURRENTLY NOT IN USE — Preserved for future drag-and-drop implementation.
 *
 * STATUS (Feb 2026):
 *   This component was replaced by `UnscheduledTaskStrip` in PlannerPage and
 *   DailyTimelineView because the drag-and-drop UX conflicts with horizontal
 *   scroll on mobile (touch-based) devices.
 *
 * KNOWN ISSUES:
 *   1. Framer Motion `drag` intercepts all touch events, preventing native
 *      horizontal scroll of the pill container.
 *   2. Long-press-to-drag workaround (using `useDragControls` + `dragListener={false}`)
 *      was implemented but `controls.start()` called from a `setTimeout` receives a
 *      stale React synthetic event. Passing `e.nativeEvent` instead partially fixes it,
 *      but the drag still doesn't reliably initiate on mobile Safari / Chrome.
 *   3. `AnimatePresence mode="popLayout"` wraps children in `PopChild` which forwards
 *      a ref — the pill component must use `React.forwardRef` or the ref warning fires.
 *   4. The pill container had `overflow: visible` which caused the entire page width
 *      to expand past 768px, triggering Tailwind `md:` breakpoints on mobile and
 *      showing the desktop sidebar layout.
 *
 * NEXT STEPS TO FIX:
 *   - Consider using a dedicated touch-drag library (e.g. `@dnd-kit/core`) instead
 *     of Framer Motion `drag` for the pills.
 *   - Or use HTML5 native drag on desktop only, and a "schedule" button / sheet on
 *     mobile instead of actual drag-and-drop.
 *   - The drop-target detection (`document.elementsFromPoint`) works well and can be
 *     reused.
 */

import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import React, { useCallback, useRef, useState } from 'react';
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

// ── Long-press threshold ───────────────────────────────────────
const LONG_PRESS_MS = 300;
const MOVE_THRESHOLD = 8; // px – movement beyond this cancels the long press

// ── Individual pill with long-press-to-drag ────────────────────
interface DraggablePillProps {
  task: Task;
  findDropTarget: (x: number, y: number) => { element: Element } | null;
  onDrop: (task: Task, hit: DropTargetHit) => void;
  onDragOverTarget?: (task: Task, hit: DropTargetHit | null) => void;
  onTaskClick: (task: Task) => void;
}

const DraggablePill = React.forwardRef<HTMLDivElement, DraggablePillProps>(
  ({ task, findDropTarget, onDrop, onDragOverTarget, onTaskClick }, ref) => {
    const controls = useDragControls();
    const [isDragActive, setIsDragActive] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const startPos = useRef({ x: 0, y: 0 });
    const didDrag = useRef(false);
    const pillRef = useRef<HTMLDivElement>(null);

    // Merge forwarded ref with local ref
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        (pillRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref]
    );

    const cancelTimer = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    }, []);

    const handlePointerDown = useCallback(
      (e: React.PointerEvent) => {
        startPos.current = { x: e.clientX, y: e.clientY };
        didDrag.current = false;

        // Store the native event for use in setTimeout (React synthetic events get pooled)
        const nativeEvent = e.nativeEvent;

        timerRef.current = setTimeout(() => {
          didDrag.current = true;
          setIsDragActive(true);
          // Use the native PointerEvent — synthetic event is stale by now
          controls.start(nativeEvent);
        }, LONG_PRESS_MS);
      },
      [controls]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!timerRef.current) return;
        const dx = Math.abs(e.clientX - startPos.current.x);
        const dy = Math.abs(e.clientY - startPos.current.y);
        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
          cancelTimer();
        }
      },
      [cancelTimer]
    );

    const handlePointerUp = useCallback(() => {
      cancelTimer();
    }, [cancelTimer]);

    return (
      <motion.div
        ref={setRefs}
        className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium max-w-[200px] truncate select-none"
        style={{
          background: isDragActive ? 'var(--gradient-primary)' : 'var(--gradient-subtle)',
          border: isDragActive
            ? '1px solid var(--energizing-orange)'
            : '1px solid var(--card-border)',
          color: isDragActive ? 'white' : 'var(--energizing-orange)',
          cursor: isDragActive ? 'grabbing' : 'grab',
        }}
        drag
        dragControls={controls}
        dragListener={false}
        dragElastic={0}
        dragMomentum={false}
        dragConstraints={false}
        dragSnapToOrigin
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
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
          setIsDragActive(false);
          onDragOverTarget?.(task, null);
        }}
        onClick={() => {
          if (!didDrag.current) {
            onTaskClick(task);
          }
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
          boxShadow: '0 2px 8px rgba(255, 140, 66, 0.2)',
        }}
        whileDrag={{
          scale: 1.1,
          zIndex: 9999,
          boxShadow: '0 8px 24px rgba(255, 140, 66, 0.5)',
          rotate: 5,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        title={task.title}
      >
        {task.title}
      </motion.div>
    );
  }
);

DraggablePill.displayName = 'DraggablePill';

// ── Strip container ────────────────────────────────────────────
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
  const findDropTarget = useCallback(
    (x: number, y: number): { element: Element } | null => {
      const elements = document.elementsFromPoint(x, y);
      for (const attr of dropTargetAttributes) {
        const match = elements.find((el) => el.hasAttribute(attr));
        if (match) return { element: match };
      }
      return null;
    },
    [dropTargetAttributes]
  );

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
        style={{ overflowY: 'visible' }}
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <DraggablePill
              key={task.id}
              task={task}
              findDropTarget={findDropTarget}
              onDrop={onDrop}
              onDragOverTarget={onDragOverTarget}
              onTaskClick={onTaskClick}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
