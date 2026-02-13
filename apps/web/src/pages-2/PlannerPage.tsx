import { motion } from 'framer-motion';
import {
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  ServerOff,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { taskApi } from '../api';
import { DailyTimelineView } from '../components-2/DailyTimelineView';
import { DraggableTaskStrip, DropTargetHit } from '../components-2/DraggableTaskStrip';
import { SquircleCard } from '../components-2/SquircleCard';
import { TaskEditSheet } from '../components-2/TaskEditSheet';
import { TasksForDateSheet } from '../components-2/TasksForDateSheet';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { useGoalContext } from '../contexts/GoalContext';
import { useTaskContext } from '../contexts/TaskContext';
import { Task } from '../types';
import { parseLocalDate } from '../utils/dateUtils';

type PlannerView = 'month' | 'day';

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

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const PlannerPage = () => {
  const { tasks: allTasks, scheduleTask, error: taskError, fetchTasks } = useTaskContext();
  const { goals, error: goalError, fetchGoals } = useGoalContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<PlannerView>('month');
  const [dailyDate, setDailyDate] = useState(new Date());

  const error = taskError || goalError;

  const handleRetry = async () => {
    setIsRetrying(true);
    await Promise.all([fetchTasks(), fetchGoals()]);
    setIsRetrying(false);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Unscheduled tasks
  const unscheduledTasks = useMemo(() => {
    return allTasks.filter((t) => !t.scheduledDate && !t.isCompleted);
  }, [allTasks]);

  // Tasks organized by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    allTasks
      .filter((t) => t.scheduledDate && !t.isCompleted)
      .forEach((task) => {
        const dateKey = parseLocalDate(task.scheduledDate!).toDateString();
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      });
    return map;
  }, [allTasks]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Handler for DraggableTaskStrip drops on calendar day cells
  const handleStripDrop = useCallback(
    async (task: Task, hit: DropTargetHit) => {
      const dateStr = hit.element.getAttribute('data-date');
      if (!dateStr) return;
      const date = new Date(dateStr);
      try {
        await scheduleTask(task.id, date);
      } catch (error) {
        console.error('Failed to schedule task:', error);
      }
      setHoveredDate(null);
    },
    [scheduleTask]
  );

  // Hover highlight while dragging over a calendar day
  const handleStripDragOver = useCallback((_task: Task, hit: DropTargetHit | null) => {
    if (hit) {
      const dateStr = hit.element.getAttribute('data-date');
      if (dateStr) {
        setHoveredDate(new Date(dateStr).toDateString());
        return;
      }
    }
    setHoveredDate(null);
  }, []);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditSheetOpen(true);
  };

  const handleDayClick = (date: Date, taskCount: number) => {
    // Switch to daily view for this date
    setDailyDate(date);
    setViewMode('day');
  };

  const handleSwitchToDay = (date: Date) => {
    setDailyDate(date);
    setViewMode('day');
  };

  const handleCreateTaskForTime = (date: Date, time: string) => {
    setSelectedTask(null);
    setIsEditSheetOpen(true);
    // The TaskEditSheet will open in create mode
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      await taskApi.toggleComplete(taskId);
      await fetchTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleAddTaskForDate = () => {
    setIsDateModalOpen(false);
    setIsEditSheetOpen(true);
  };

  // Get tasks for selected date
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toDateString();
    return tasksByDate.get(dateKey) || [];
  }, [selectedDate, tasksByDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toDateString();

    const days: Array<{
      date: Date | null;
      isCurrentMonth: boolean;
      isToday: boolean;
      tasks: Task[];
    }> = [];

    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, isCurrentMonth: false, isToday: false, tasks: [] });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toDateString();
      const tasks = tasksByDate.get(dateKey) || [];
      days.push({
        date,
        isCurrentMonth: true,
        isToday: dateKey === today,
        tasks,
      });
    }

    return days;
  }, [currentDate, tasksByDate]);

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-4 pt-6 pb-4">
      {/* Error Alert */}
      {error && (
        <div className="w-full px-4">
          <Alert variant="destructive" className="rounded-2xl border-2">
            <ServerOff className="h-5 w-5" />
            <AlertTitle className="font-display">Cannot Connect to Database</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>The database is not running. Please start it using:</p>
              <code className="block p-2 rounded-lg bg-black/5 text-xs font-mono">
                docker-compose up -d postgres
              </code>
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                size="sm"
                className="mt-2"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry Connection'}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 flex-1">
        {/* Main Calendar Section */}
        <div className="flex-1 px-4 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1
                className="text-3xl font-bold font-display mb-1"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                Planner
              </h1>
              <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
                {viewMode === 'month' ? 'Schedule your tasks visually' : 'Plan your day'}
              </p>
            </div>

            {/* View Toggle */}
            <div
              className="flex rounded-xl p-0.5 gap-0.5"
              style={{
                background: 'rgba(255, 140, 66, 0.08)',
                border: '1px solid var(--card-border)',
              }}
            >
              <button
                onClick={() => setViewMode('month')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: viewMode === 'month' ? 'var(--gradient-primary)' : 'transparent',
                  color: viewMode === 'month' ? 'white' : 'var(--warm-gray)',
                  boxShadow: viewMode === 'month' ? '0 2px 8px rgba(255, 140, 66, 0.3)' : 'none',
                }}
              >
                <CalendarDays size={14} />
                Month
              </button>
              <button
                onClick={() => {
                  setViewMode('day');
                  setDailyDate(new Date());
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: viewMode === 'day' ? 'var(--gradient-primary)' : 'transparent',
                  color: viewMode === 'day' ? 'white' : 'var(--warm-gray)',
                  boxShadow: viewMode === 'day' ? '0 2px 8px rgba(255, 140, 66, 0.3)' : 'none',
                }}
              >
                <Clock size={14} />
                Day
              </button>
            </div>
          </div>

          {/* Daily View */}
          {viewMode === 'day' && (
            <div className="flex-1 min-h-0">
              <DailyTimelineView
                date={dailyDate}
                onDateChange={setDailyDate}
                onTaskClick={handleTaskClick}
                onCreateTask={handleCreateTaskForTime}
                unscheduledTasks={unscheduledTasks}
              />
            </div>
          )}

          {/* Unscheduled Tasks Floating Bar - Mobile Only (Month view) */}
          {viewMode === 'month' && isMobile && unscheduledTasks.length > 0 && (
            <DraggableTaskStrip
              className="mb-4 -mx-4 px-4"
              tasks={unscheduledTasks}
              dropTargetAttributes={['data-calendar-day']}
              onDrop={handleStripDrop}
              onDragOverTarget={handleStripDragOver}
              onTaskClick={handleTaskClick}
            />
          )}

          {/* Month Navigation (Month view only) */}
          {viewMode === 'month' && (
            <SquircleCard className="mb-3">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                  style={{ color: 'var(--energizing-orange)' }}
                >
                  <ChevronLeft size={20} />
                </button>
                <h2
                  className="text-base font-bold font-display"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                  style={{ color: 'var(--energizing-orange)' }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </SquircleCard>
          )}

          {/* Calendar Grid (Month view only) */}
          {viewMode === 'month' && (
            <SquircleCard className="flex-shrink-0">
              <div className="p-1 md:p-2 h-full flex flex-col">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-1">
                  {DAYS_SHORT.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold py-1"
                      style={{ color: 'var(--warm-gray)' }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2 auto-rows-fr">
                  {calendarDays.map((day, idx) => (
                    <motion.div
                      key={idx}
                      data-calendar-day
                      data-date={day.date?.toISOString()}
                      className={`
                    relative rounded-xl p-1 md:p-2 flex flex-col items-center justify-center overflow-hidden
                    ${day.isCurrentMonth ? 'cursor-pointer' : 'opacity-30'}
                    ${day.isToday ? 'ring-2' : ''}
                  `}
                      style={
                        {
                          background: day.isCurrentMonth
                            ? hoveredDate === day.date?.toDateString()
                              ? 'rgba(255, 140, 66, 0.15)'
                              : 'rgba(255, 255, 255, 0.5)'
                            : 'transparent',
                          '--tw-ring-color': day.isToday ? 'var(--energizing-orange)' : undefined,
                          border: '2px solid var(--card-border)',
                          minHeight: '40px',
                        } as React.CSSProperties
                      }
                      onClick={() =>
                        day.date && day.isCurrentMonth && handleDayClick(day.date, day.tasks.length)
                      }
                      whileHover={day.isCurrentMonth ? { scale: 1.05 } : undefined}
                      whileTap={day.isCurrentMonth ? { scale: 0.98 } : undefined}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {day.date && (
                        <>
                          <div
                            className={`text-sm md:text-base font-bold mb-1 ${day.isToday ? 'font-extrabold' : ''}`}
                            style={{
                              color: day.isToday
                                ? 'var(--energizing-orange)'
                                : 'var(--deep-charcoal)',
                            }}
                          >
                            {day.date.getDate()}
                          </div>
                          {day.tasks.length > 0 && (
                            <motion.div
                              className="px-2 py-0.5 rounded-full font-bold text-xs"
                              style={{
                                background: 'var(--gradient-primary)',
                                color: 'white',
                                boxShadow: '0 2px 8px rgba(255, 140, 66, 0.3)',
                              }}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            >
                              {day.tasks.length}
                            </motion.div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </SquircleCard>
          )}
        </div>

        {/* Desktop Sidebar - Unscheduled Tasks */}
        {!isMobile && (
          <div className="w-80 px-4">
            <SquircleCard className="h-full">
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-lg font-bold font-display"
                      style={{ color: 'var(--deep-charcoal)' }}
                    >
                      Unscheduled
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--warm-gray)' }}>
                      Drag tasks to calendar
                    </p>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-full font-bold text-sm"
                    style={{
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      boxShadow: 'var(--glow-orange)',
                    }}
                  >
                    {unscheduledTasks.length}
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-2">
                    {unscheduledTasks.length === 0 ? (
                      <div className="text-center py-8" style={{ color: 'var(--warm-gray)' }}>
                        <CalendarIcon size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">All tasks scheduled!</p>
                      </div>
                    ) : (
                      unscheduledTasks.map((task) => (
                        <motion.div
                          key={task.id}
                          className="p-3 rounded-2xl cursor-move"
                          style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            boxShadow: '0 2px 8px rgba(255, 140, 66, 0.08)',
                          }}
                          draggable
                          onDragStart={(e) => {
                            (e as any).dataTransfer?.setData('text/taskId', task.id);
                          }}
                          whileHover={{
                            scale: 1.02,
                            boxShadow: '0 4px 16px rgba(255, 140, 66, 0.15)',
                          }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTaskClick(task)}
                        >
                          <h4
                            className="font-semibold text-sm mb-1 line-clamp-2"
                            style={{ color: 'var(--deep-charcoal)' }}
                          >
                            {task.title}
                          </h4>
                          {task.description && (
                            <p
                              className="text-xs mb-2 line-clamp-1"
                              style={{ color: 'var(--warm-gray)' }}
                            >
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {task.size && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: 'rgba(255, 140, 66, 0.1)',
                                  color: 'var(--energizing-orange)',
                                }}
                              >
                                {task.size}d
                              </span>
                            )}
                            {task.goalTasks && task.goalTasks.length > 0 && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: 'var(--gradient-subtle)',
                                  color: 'var(--electric-pink)',
                                }}
                              >
                                🎯 {task.goalTasks[0].goal?.title}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </SquircleCard>
          </div>
        )}

        {/* Tasks For Date Sheet */}
        <TasksForDateSheet
          isOpen={isDateModalOpen}
          onClose={() => setIsDateModalOpen(false)}
          date={selectedDate}
          tasks={tasksForSelectedDate}
          onTaskUpdated={fetchTasks}
          onAddTask={handleAddTaskForDate}
        />

        {/* Task Edit Sheet */}
        <TaskEditSheet
          isOpen={isEditSheetOpen}
          onClose={() => {
            setIsEditSheetOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onSave={async () => {
            await fetchTasks();
            setIsEditSheetOpen(false);
            setSelectedTask(null);
            setIsDateModalOpen(false);
          }}
          availableGoals={goals}
        />
      </div>
    </div>
  );
};
