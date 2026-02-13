import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Clock, GripVertical } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { Task } from '../types';
import { parseLocalDate } from '../utils/dateUtils';
import { DraggableTaskStrip, DropTargetHit } from './DraggableTaskStrip';
import { SquircleCard } from './SquircleCard';

// ── Constants ──────────────────────────────────────────────────
const HOUR_HEIGHT = 64; // px per hour
const SLOT_SNAP = 15; // minutes snap
const DAY_START_HOUR = 0; // 12 AM
const DAY_END_HOUR = 24; // 12 AM next day
const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR;
const DEFAULT_DURATION = 60; // minutes

// ── Helpers ────────────────────────────────────────────────────
const formatHour = (hour: number): string => {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h} ${ampm}`;
};

const timeToY = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return ((h - DAY_START_HOUR) * 60 + m) * (HOUR_HEIGHT / 60);
};

const yToMinutes = (y: number): number => {
  return Math.round(y / (HOUR_HEIGHT / 60));
};

const minutesToTime = (totalMinutes: number): string => {
  const clamped = Math.max(0, Math.min(totalMinutes, TOTAL_HOURS * 60));
  const minutes = DAY_START_HOUR * 60 + clamped;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const snapToGrid = (minutes: number): number => {
  return Math.round(minutes / SLOT_SNAP) * SLOT_SNAP;
};

const formatTimeRange = (startTime: string, durationMin: number): string => {
  const [sh, sm] = startTime.split(':').map(Number);
  const startTotal = sh * 60 + sm;
  const endTotal = startTotal + durationMin;
  const endH = Math.floor(endTotal / 60);
  const endM = endTotal % 60;

  const fmtStart = `${sh % 12 || 12}:${String(sm).padStart(2, '0')} ${sh < 12 ? 'AM' : 'PM'}`;
  const fmtEnd = `${endH % 12 || 12}:${String(endM).padStart(2, '0')} ${endH < 12 ? 'AM' : 'PM'}`;
  return `${fmtStart} – ${fmtEnd}`;
};

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

// ── Props ──────────────────────────────────────────────────────
interface DailyTimelineViewProps {
  date: Date;
  onDateChange: (date: Date) => void;
  onTaskClick: (task: Task) => void;
  onCreateTask?: (date: Date, time: string) => void;
  unscheduledTasks: Task[];
}

// ── Component ──────────────────────────────────────────────────
export const DailyTimelineView = ({
  date,
  onDateChange,
  onTaskClick,
  onCreateTask,
  unscheduledTasks,
}: DailyTimelineViewProps) => {
  const { tasks: allTasks, updateTaskFields, scheduleTask } = useTaskContext();
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [untimedPanelOpen, setUntimedPanelOpen] = useState(false);
  const [dragState, setDragState] = useState<{
    taskId: string;
    type: 'move' | 'resize';
    startY: number;
    originalTime: string;
    originalDuration: number;
    currentY: number;
  } | null>(null);
  const [dropPreview, setDropPreview] = useState<{
    time: string;
    duration: number;
  } | null>(null);

  // Compute time from a Y coordinate relative to the timeline
  const yToTime = useCallback((clientY: number): string => {
    if (!timelineRef.current || !scrollRef.current) return '08:00';
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current.scrollTop;
    const relY = clientY - rect.top + scrollTop;
    const totalMinutes = snapToGrid(yToMinutes(relY));
    return minutesToTime(totalMinutes);
  }, []);

  // Tasks for this day
  const dayTasks = useMemo(() => {
    const dateStr = date.toDateString();
    return allTasks.filter((t) => {
      if (!t.scheduledDate || t.isCompleted) return false;
      return parseLocalDate(t.scheduledDate).toDateString() === dateStr;
    });
  }, [allTasks, date]);

  // Scheduled tasks (with time)
  const scheduledTasks = useMemo(() => {
    return dayTasks
      .filter((t) => t.scheduledTime)
      .sort((a, b) => (a.scheduledTime! > b.scheduledTime! ? 1 : -1));
  }, [dayTasks]);

  // Unscheduled-for-time tasks (scheduled for this day but no specific time)
  const noTimeTasks = useMemo(() => {
    return dayTasks.filter((t) => !t.scheduledTime);
  }, [dayTasks]);

  // Scroll to current time if today, otherwise 8 AM
  useEffect(() => {
    if (!scrollRef.current) return;

    // Use multiple animation frames to ensure layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!scrollRef.current) return;

        const scrollContainer = scrollRef.current;

        // Wait for scrollable content to be ready
        if (scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
          setTimeout(() => {
            if (!scrollRef.current) return;
            performScroll(scrollRef.current);
          }, 100);
          return;
        }

        performScroll(scrollContainer);
      });
    });

    function performScroll(container: HTMLDivElement) {
      const now = new Date();
      const currentHour = now.getHours();
      const isToday = date.toDateString() === now.toDateString();

      let scrollY;
      if (isToday) {
        // Today: scroll to current time with some offset to show context
        const minutesSinceStart = (currentHour - DAY_START_HOUR) * 60 + now.getMinutes();
        scrollY = Math.max(0, (minutesSinceStart * HOUR_HEIGHT) / 60 - 120 + 12);
      } else {
        // Other days: scroll to 8 AM
        scrollY = (8 - DAY_START_HOUR) * HOUR_HEIGHT + 12;
      }

      // Temporarily disable smooth scrolling for instant positioning
      const originalBehavior = container.style.scrollBehavior;
      container.style.scrollBehavior = 'auto';
      container.scrollTop = scrollY;

      // Re-enable smooth scrolling after a moment
      setTimeout(() => {
        container.style.scrollBehavior = originalBehavior;
      }, 50);
    }
  }, [date]);

  // Current time line position
  const [currentTimeY, setCurrentTimeY] = useState(0);
  const isToday = date.toDateString() === new Date().toDateString();

  useEffect(() => {
    if (!isToday) return;
    const update = () => {
      const now = new Date();
      const mins = (now.getHours() - DAY_START_HOUR) * 60 + now.getMinutes();
      setCurrentTimeY(mins * (HOUR_HEIGHT / 60));
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [isToday]);

  // Navigation
  const title = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const navigateDay = (dir: 'prev' | 'next') => {
    const d = new Date(date);
    d.setDate(d.getDate() + (dir === 'prev' ? -1 : 1));
    onDateChange(d);
  };

  const goToday = () => onDateChange(new Date());

  // ── Drag to move/resize a task ───────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, task: Task, type: 'move' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setDragState({
        taskId: task.id,
        type,
        startY: e.clientY,
        originalTime: task.scheduledTime || '08:00',
        originalDuration: task.estimatedDurationMinutes || DEFAULT_DURATION,
        currentY: e.clientY,
      });
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;
      setDragState((prev) => (prev ? { ...prev, currentY: e.clientY } : null));
    },
    [dragState]
  );

  const handlePointerUp = useCallback(async () => {
    if (!dragState) return;
    const deltaY = dragState.currentY - dragState.startY;
    const deltaMinutes = snapToGrid(yToMinutes(deltaY));
    const [origH, origM] = dragState.originalTime.split(':').map(Number);
    const origTotalMin = origH * 60 + origM;

    if (dragState.type === 'move') {
      const newTotalMin = Math.max(
        DAY_START_HOUR * 60,
        Math.min(origTotalMin + deltaMinutes, DAY_END_HOUR * 60 - 15)
      );
      const newH = Math.floor(newTotalMin / 60);
      const newM = newTotalMin % 60;
      const newTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;

      if (newTime !== dragState.originalTime) {
        await updateTaskFields(dragState.taskId, { scheduledTime: newTime });
      }
    } else {
      // resize
      const newDuration = Math.max(15, snapToGrid(dragState.originalDuration + deltaMinutes));
      if (newDuration !== dragState.originalDuration) {
        await updateTaskFields(dragState.taskId, { estimatedDurationMinutes: newDuration });
      }
    }

    setDragState(null);
  }, [dragState, updateTaskFields]);

  // ── Drop from DraggableTaskStrip (Framer Motion) ─────────────
  const handleStripDrop = useCallback(
    async (task: Task, hit: DropTargetHit) => {
      const time = yToTime(hit.point.y);
      await scheduleTask(task.id, date);
      await updateTaskFields(task.id, {
        scheduledTime: time,
        estimatedDurationMinutes: DEFAULT_DURATION,
      });
      setDropPreview(null);
    },
    [date, scheduleTask, updateTaskFields, yToTime]
  );

  const handleStripDragOver = useCallback(
    (_task: Task, hit: DropTargetHit | null) => {
      if (hit && hit.element.hasAttribute('data-timeline-area')) {
        const time = yToTime(hit.point.y);
        setDropPreview({ time, duration: DEFAULT_DURATION });
      } else {
        setDropPreview(null);
      }
    },
    [yToTime]
  );

  // ── Drop from desktop sidebar (HTML5 drag) ───────────────────
  const handleTimelineDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const relY = e.clientY - rect.top + scrollTop;
    const totalMinutes = snapToGrid(yToMinutes(relY));
    const time = minutesToTime(totalMinutes);
    setDropPreview({ time, duration: DEFAULT_DURATION });
  }, []);

  const handleTimelineDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/taskId');
      if (!taskId || !dropPreview) return;

      // Schedule the task for this date + time
      await scheduleTask(taskId, date);
      await updateTaskFields(taskId, {
        scheduledTime: dropPreview.time,
        estimatedDurationMinutes: DEFAULT_DURATION,
      });

      setDropPreview(null);
    },
    [date, dropPreview, scheduleTask, updateTaskFields]
  );

  const handleTimelineDragLeave = useCallback(() => {
    setDropPreview(null);
  }, []);

  // ── Click empty slot to create task ──────────────────────────
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onCreateTask || !timelineRef.current) return;
      // Don't create task if clicking a task block
      if ((e.target as HTMLElement).closest('[data-task-block]')) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const scrollTop = scrollRef.current?.scrollTop || 0;
      const relY = e.clientY - rect.top + scrollTop;
      const totalMinutes = snapToGrid(yToMinutes(relY));
      const time = minutesToTime(totalMinutes);
      onCreateTask(date, time);
    },
    [date, onCreateTask]
  );

  // ── Get computed position for a task during drag ─────────────
  const getTaskPosition = useCallback(
    (task: Task) => {
      const time = task.scheduledTime || '08:00';
      const duration = task.estimatedDurationMinutes || DEFAULT_DURATION;
      let y = timeToY(time);
      let height = (duration / 60) * HOUR_HEIGHT;

      if (dragState && dragState.taskId === task.id) {
        const deltaY = dragState.currentY - dragState.startY;
        if (dragState.type === 'move') {
          const deltaMin = snapToGrid(yToMinutes(deltaY));
          const [h, m] = time.split(':').map(Number);
          const newMin = Math.max(
            DAY_START_HOUR * 60,
            Math.min(h * 60 + m + deltaMin, DAY_END_HOUR * 60 - 15)
          );
          y = ((newMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
        } else {
          const deltaMin = snapToGrid(yToMinutes(deltaY));
          height = (Math.max(15, duration + deltaMin) / 60) * HOUR_HEIGHT;
        }
      }

      return { y, height };
    },
    [dragState]
  );

  // ── Render ───────────────────────────────────────────────────
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => DAY_START_HOUR + i);

  const totalUntimedTasks = noTimeTasks.length + unscheduledTasks.length;

  return (
    <div className="flex flex-col md:flex-row h-full gap-3 relative min-h-0">
      {/* Timeline Section */}
      <div className="flex-1 flex flex-col min-h-0 relative max-h-full">
        {/* Mobile Floating Button - Top Position */}
        {totalUntimedTasks > 0 && (
          <div className="md:hidden fixed top-4 right-4 z-[60]">
            <AnimatePresence mode="wait">
              {!untimedPanelOpen ? (
                <motion.button
                  key="button"
                  onClick={() => setUntimedPanelOpen(true)}
                  className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center relative transition-transform active:scale-90"
                  style={{
                    background: 'var(--gradient-primary)',
                    boxShadow: '0 6px 20px rgba(255, 140, 66, 0.4)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <Clock size={22} color="white" />
                  {totalUntimedTasks > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: '#ef4444',
                        color: 'white',
                      }}
                    >
                      {totalUntimedTasks}
                    </span>
                  )}
                </motion.button>
              ) : (
                <motion.div
                  key="panel"
                  className="fixed top-4 right-4 w-[calc(100vw-2rem)] max-w-sm max-h-[50vh]"
                  initial={{ y: -20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -20, opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  <SquircleCard
                    className="overflow-hidden"
                    style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
                  >
                    <div
                      className="px-3 py-2 border-b flex items-center justify-between"
                      style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold font-display"
                          style={{ color: 'var(--deep-charcoal)' }}
                        >
                          Untimed Tasks
                        </span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(255, 140, 66, 0.15)',
                            color: 'var(--energizing-orange)',
                          }}
                        >
                          {totalUntimedTasks}
                        </span>
                      </div>
                      <button
                        onClick={() => setUntimedPanelOpen(false)}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ChevronDown size={16} style={{ color: 'var(--warm-gray)' }} />
                      </button>
                    </div>
                    <div
                      className="overflow-y-auto p-3 space-y-3"
                      style={{ maxHeight: 'calc(50vh - 48px)' }}
                    >
                      {noTimeTasks.length > 0 && (
                        <div>
                          <p
                            className="text-[9px] font-bold mb-1.5 uppercase tracking-wider"
                            style={{ color: 'var(--warm-gray)' }}
                          >
                            All Day
                          </p>
                          <div className="space-y-1">
                            {noTimeTasks.map((task) => (
                              <button
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                                style={{
                                  background: `${getCategoryColor(task.category)}12`,
                                  border: `1px solid ${getCategoryColor(task.category)}30`,
                                  color: 'var(--deep-charcoal)',
                                }}
                              >
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: getCategoryColor(task.category) }}
                                  />
                                  <span className="truncate">{task.title}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {unscheduledTasks.length > 0 && (
                        <div>
                          <p
                            className="text-[9px] font-bold mb-1.5 uppercase tracking-wider"
                            style={{ color: 'var(--warm-gray)' }}
                          >
                            Unscheduled
                          </p>
                          <DraggableTaskStrip
                            tasks={unscheduledTasks}
                            dropTargetAttributes={['data-timeline-area']}
                            onDrop={handleStripDrop}
                            onDragOverTarget={handleStripDragOver}
                            onTaskClick={onTaskClick}
                            showLabel={false}
                          />
                        </div>
                      )}
                    </div>
                  </SquircleCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Compact Day Navigation */}
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <button
            onClick={() => navigateDay('prev')}
            className="p-1 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
            style={{ color: 'var(--energizing-orange)' }}
          >
            <ChevronLeft size={18} />
          </button>
          <div
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <span
              className="text-sm font-bold font-display"
              style={{ color: 'var(--deep-charcoal)' }}
            >
              {isToday ? 'Today' : title}
            </span>
            {isToday && (
              <span className="text-[10px] font-medium" style={{ color: 'var(--warm-gray)' }}>
                {title}
              </span>
            )}
            {!isToday && (
              <button
                onClick={goToday}
                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition-colors"
                style={{
                  background: 'rgba(255, 140, 66, 0.1)',
                  color: 'var(--energizing-orange)',
                }}
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={() => navigateDay('next')}
            className="p-1 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
            style={{ color: 'var(--energizing-orange)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Timeline */}
        <SquircleCard className="flex-1 min-h-0 overflow-hidden">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto overflow-x-hidden"
            style={{ scrollBehavior: 'smooth', maxHeight: 'calc(100vh - 200px)' }}
          >
            <div
              ref={timelineRef}
              className="relative pt-3"
              data-timeline-area
              style={{ height: TOTAL_HOURS * HOUR_HEIGHT + 12 }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDragOver={handleTimelineDragOver}
              onDrop={handleTimelineDrop}
              onDragLeave={handleTimelineDragLeave}
              onClick={handleTimelineClick}
            >
              {/* Hour lines */}
              {hours.map((hour) => {
                const y = (hour - DAY_START_HOUR) * HOUR_HEIGHT;
                return (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 flex items-start"
                    style={{ top: y }}
                  >
                    <div
                      className="w-12 md:w-14 flex-shrink-0 text-right pr-2 select-none"
                      style={{
                        fontSize: '10px',
                        color: 'var(--warm-gray)',
                        opacity: 0.7,
                        marginTop: '-2px',
                      }}
                    >
                      {formatHour(hour)}
                    </div>
                    <div
                      className="flex-1 border-t"
                      style={{ borderColor: 'rgba(255, 140, 66, 0.08)' }}
                    />
                  </div>
                );
              })}

              {/* Half-hour guides */}
              {hours.map((hour) => {
                const y = (hour - DAY_START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2;
                return (
                  <div
                    key={`half-${hour}`}
                    className="absolute right-0 border-t"
                    style={{
                      top: y,
                      left: '3rem',
                      borderColor: 'rgba(255, 140, 66, 0.04)',
                      borderStyle: 'dashed',
                    }}
                  />
                );
              })}

              {/* Current time indicator */}
              {isToday && currentTimeY > 0 && currentTimeY < TOTAL_HOURS * HOUR_HEIGHT && (
                <div
                  className="absolute left-10 md:left-12 right-0 flex items-center pointer-events-none"
                  style={{ top: currentTimeY, zIndex: 20 }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full -ml-1.5 flex-shrink-0"
                    style={{ background: '#ef4444' }}
                  />
                  <div className="flex-1 h-[2px]" style={{ background: '#ef4444' }} />
                </div>
              )}

              {/* Drop preview */}
              {dropPreview && (
                <motion.div
                  className="absolute rounded-xl pointer-events-none"
                  style={{
                    top: timeToY(dropPreview.time),
                    left: '3.5rem',
                    right: '0.5rem',
                    height: (dropPreview.duration / 60) * HOUR_HEIGHT,
                    background: 'rgba(255, 140, 66, 0.12)',
                    border: '2px dashed var(--energizing-orange)',
                    zIndex: 15,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className="px-2 py-1 text-xs font-semibold"
                    style={{ color: 'var(--energizing-orange)' }}
                  >
                    {formatTimeRange(dropPreview.time, dropPreview.duration)}
                  </div>
                </motion.div>
              )}

              {/* Task blocks */}
              <AnimatePresence>
                {scheduledTasks.map((task) => {
                  const { y, height } = getTaskPosition(task);
                  const isDragging = dragState?.taskId === task.id;
                  const color = getCategoryColor(task.category);
                  const duration = task.estimatedDurationMinutes || DEFAULT_DURATION;
                  const isSmall = height < 40;

                  return (
                    <motion.div
                      key={task.id}
                      data-task-block
                      className="absolute rounded-xl overflow-hidden group"
                      style={{
                        top: y,
                        left: '3.5rem',
                        right: '0.5rem',
                        height: Math.max(height, 20),
                        background: `linear-gradient(135deg, ${color}30 0%, ${color}18 100%)`,
                        borderLeft: `3px solid ${color}`,
                        border: `1px solid ${color}40`,
                        borderLeftWidth: '3px',
                        borderLeftColor: color,
                        zIndex: isDragging ? 30 : 10,
                        cursor: isDragging ? 'grabbing' : 'pointer',
                        boxShadow: isDragging ? `0 8px 24px ${color}40` : `0 1px 6px ${color}18`,
                        touchAction: 'none',
                        userSelect: 'none',
                      }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: isDragging ? 1.02 : 1,
                      }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      onClick={(e) => {
                        if (!dragState) {
                          e.stopPropagation();
                          onTaskClick(task);
                        }
                      }}
                    >
                      {/* Drag handle (move) */}
                      <div
                        className="absolute inset-0"
                        onPointerDown={(e) => handlePointerDown(e, task, 'move')}
                      />

                      {/* Content */}
                      <div
                        className={`px-2 ${isSmall ? 'py-0.5' : 'py-1.5'} h-full flex flex-col justify-between pointer-events-none`}
                      >
                        <div className="flex items-start gap-1">
                          <GripVertical
                            size={12}
                            className="flex-shrink-0 mt-0.5 opacity-40 group-hover:opacity-70 transition-opacity"
                            style={{ color }}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`font-semibold truncate leading-tight ${isSmall ? 'text-[11px]' : 'text-xs'}`}
                              style={{ color: 'var(--deep-charcoal)' }}
                            >
                              {task.title}
                            </p>
                            {!isSmall && (
                              <p
                                className="text-[10px] mt-0.5 truncate"
                                style={{ color: 'var(--warm-gray)' }}
                              >
                                {formatTimeRange(task.scheduledTime!, duration)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Duration indicator for taller blocks */}
                        {!isSmall && duration > 30 && (
                          <div className="flex items-center gap-1 mt-auto">
                            <Clock size={10} style={{ color: 'var(--warm-gray)', opacity: 0.6 }} />
                            <span
                              className="text-[10px]"
                              style={{ color: 'var(--warm-gray)', opacity: 0.6 }}
                            >
                              {duration >= 60
                                ? `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ''}`
                                : `${duration}m`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Resize handle */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                        style={{ background: `linear-gradient(to top, ${color}20, transparent)` }}
                        onPointerDown={(e) => handlePointerDown(e, task, 'resize')}
                      >
                        <div
                          className="w-8 h-1 rounded-full"
                          style={{ background: `${color}50` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </SquircleCard>
      </div>

      {/* Side Panel - Untimed Tasks (Desktop) / Mobile Floating Button */}
      {totalUntimedTasks > 0 && (
        <>
          {/* Desktop Side Panel */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <SquircleCard className="h-full overflow-hidden flex flex-col">
              <div
                className="p-3 border-b flex items-center justify-between flex-shrink-0"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <span
                  className="text-xs font-bold font-display"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Untimed Tasks
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(255, 140, 66, 0.15)',
                    color: 'var(--energizing-orange)',
                  }}
                >
                  {totalUntimedTasks}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* All Day Tasks */}
                {noTimeTasks.length > 0 && (
                  <div>
                    <p
                      className="text-[10px] font-bold mb-2 uppercase tracking-wider"
                      style={{ color: 'var(--warm-gray)' }}
                    >
                      All Day
                    </p>
                    <div className="space-y-1.5">
                      {noTimeTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => onTaskClick(task)}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium hover:scale-[1.02] transition-all"
                          style={{
                            background: `${getCategoryColor(task.category)}12`,
                            border: `1px solid ${getCategoryColor(task.category)}30`,
                            color: 'var(--deep-charcoal)',
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: getCategoryColor(task.category) }}
                            />
                            <span className="truncate">{task.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unscheduled Tasks */}
                {unscheduledTasks.length > 0 && (
                  <div>
                    <p
                      className="text-[10px] font-bold mb-2 uppercase tracking-wider"
                      style={{ color: 'var(--warm-gray)' }}
                    >
                      Unscheduled
                    </p>
                    <DraggableTaskStrip
                      tasks={unscheduledTasks}
                      dropTargetAttributes={['data-timeline-area']}
                      onDrop={handleStripDrop}
                      onDragOverTarget={handleStripDragOver}
                      onTaskClick={onTaskClick}
                      showLabel={false}
                    />
                  </div>
                )}
              </div>
            </SquircleCard>
          </div>
        </>
      )}
    </div>
  );
};
