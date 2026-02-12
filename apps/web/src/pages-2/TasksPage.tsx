import { format } from 'date-fns';
import { CalendarIcon, RefreshCw, ServerOff, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, PaginatedTasksResponse, taskApi } from '../api';
import { SquircleCard } from '../components-2/SquircleCard';
import { TaskCard } from '../components-2/TaskCard';
import { TaskEditSheet } from '../components-2/TaskEditSheet';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { CustomCalendar } from '../components/ui/custom-calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination';
import { Spinner } from '../components/ui/spinner';
import { Goal, Task } from '../types';

type TaskStatus = 'pending' | 'completed';

export const TasksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TaskStatus | null;
  const dateParam = searchParams.get('date');
  const [activeTab, setActiveTab] = useState<TaskStatus>(
    tabParam === 'completed' ? 'completed' : 'pending'
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(dateParam || null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    await fetchTasks();
    await fetchGoals();
    setIsRetrying(false);
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TaskStatus | null;
    const dateParam = searchParams.get('date');
    if (tabParam && (tabParam === 'pending' || tabParam === 'completed')) {
      setActiveTab(tabParam);
    }
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTasks();
  }, [activeTab, page, selectedDate]);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const goalsData = await api.fetchGoals();
      setGoals(goalsData);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to server';
      setError(message);
      console.error('Error fetching goals:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params: any = {
        status: activeTab,
        page,
        limit: 10,
      };

      if (selectedDate) {
        params.date = selectedDate;
      }

      const data = await taskApi.fetchTasks(params);

      // Type assertion since we're passing pagination params
      const paginatedData = data as PaginatedTasksResponse;
      setTasks(paginatedData.tasks);
      setTotalPages(paginatedData.pagination.totalPages);
      setTotal(paginatedData.pagination.total);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to server';
      setError(message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TaskStatus) => {
    setActiveTab(tab);
    setPage(1); // Reset to first page when changing tabs
    const params: any = { tab };
    if (selectedDate) {
      params.date = selectedDate;
    }
    setSearchParams(params);
  };

  const handleDateChange = (date: string | null) => {
    setSelectedDate(date);
    setPage(1); // Reset to first page when changing date filter
    const params: any = { tab: activeTab };
    if (date) {
      params.date = date;
    }
    setSearchParams(params);
    setIsDatePickerOpen(false);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      handleDateChange(dateStr);
    }
  };

  const handleToggle = async (taskId: string) => {
    try {
      await taskApi.toggleComplete(taskId);
      // Refresh tasks after toggle
      fetchTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleReschedule = (taskId: string) => {
    setRescheduleTaskId(taskId);
  };

  const handleRescheduleDate = async (date: Date | undefined) => {
    if (!date || !rescheduleTaskId) return;
    try {
      setIsRescheduling(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      await taskApi.scheduleTask(rescheduleTaskId, dateStr);
      setRescheduleTaskId(null);
      fetchTasks();
    } catch (error) {
      console.error('Failed to reschedule task:', error);
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setIsEditSheetOpen(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6">
      {/* Error Alert */}
      {error && (
        <div className="px-4">
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

      {/* Header */}
      <div className="px-4">
        <div
          className="text-3xl font-bold font-display mb-2"
          style={{ color: 'var(--deep-charcoal)' }}
        >
          Tasks
        </div>
        <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
          Manage and organize all your tasks
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div
          className="flex w-full rounded-2xl p-1"
          style={{ background: 'rgba(255, 140, 66, 0.1)' }}
        >
          <button
            onClick={() => handleTabChange('pending')}
            className="flex-1 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: activeTab === 'pending' ? 'var(--energizing-orange)' : 'transparent',
              color: activeTab === 'pending' ? 'white' : 'var(--deep-charcoal)',
            }}
          >
            Pending {activeTab === 'pending' && `(${total})`}
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className="flex-1 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: activeTab === 'completed' ? '#22C55E' : 'transparent',
              color: activeTab === 'completed' ? 'white' : 'var(--deep-charcoal)',
            }}
          >
            Completed {activeTab === 'completed' && `(${total})`}
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDatePickerOpen(true)}
            className="flex-1 flex items-center gap-3 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{
              borderColor: selectedDate ? 'var(--energizing-orange)' : '#E5E7EB',
              color: selectedDate ? 'var(--deep-charcoal)' : 'var(--warm-gray)',
            }}
          >
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <span className="text-left flex-1">
              {selectedDate
                ? format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')
                : 'Filter by date'}
            </span>
          </button>
          {selectedDate && (
            <button
              onClick={() => handleDateChange(null)}
              className="px-4 py-2 rounded-xl border-2 flex items-center gap-2 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{
                borderColor: '#E5E7EB',
                color: 'var(--warm-gray)',
              }}
            >
              <XCircle className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
        {selectedDate && (
          <p className="mt-2 text-xs" style={{ color: 'var(--warm-gray)' }}>
            Showing tasks for {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <SquircleCard className="p-8 text-center">
          <Spinner
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--energizing-orange)' }}
          />
          <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
            Loading tasks...
          </p>
        </SquircleCard>
      )}

      {/* Task List */}
      {!loading && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onReschedule={handleReschedule}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && tasks.length === 0 && (
        <SquircleCard className="p-8 text-center">
          <div className="text-5xl mb-4">{activeTab === 'pending' ? '📝' : '✅'}</div>
          <div className="text-lg font-semibold mb-2" style={{ color: 'var(--deep-charcoal)' }}>
            No {activeTab} tasks{selectedDate ? ' for this date' : ''}
          </div>
          <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
            {selectedDate
              ? `No ${activeTab} tasks scheduled for ${format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}`
              : activeTab === 'pending'
                ? 'Create some tasks to get started!'
                : "You haven't completed any tasks yet."}
          </p>
        </SquircleCard>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="pb-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={
                    page === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer hover:bg-orange-50'
                  }
                />
              </PaginationItem>

              {(() => {
                const pages: (number | 'ellipsis')[] = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push('ellipsis');
                  const start = Math.max(2, page - 1);
                  const end = Math.min(totalPages - 1, page + 1);
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (page < totalPages - 2) pages.push('ellipsis');
                  pages.push(totalPages);
                }
                return pages.map((pageNum, idx) =>
                  pageNum === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={page === pageNum}
                        onClick={() => setPage(pageNum)}
                        className="cursor-pointer"
                        style={
                          page === pageNum
                            ? {
                                background: 'var(--energizing-orange)',
                                color: 'white',
                                borderColor: 'var(--energizing-orange)',
                              }
                            : {}
                        }
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                );
              })()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={
                    page === totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer hover:bg-orange-50'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Reschedule Calendar Modal */}
      <Dialog
        open={!!rescheduleTaskId}
        onOpenChange={(open) => {
          if (!open) setRescheduleTaskId(null);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-0 bg-white border-gray-200">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle
              className="text-lg font-bold font-display"
              style={{ color: 'var(--deep-charcoal)' }}
            >
              Reschedule Task
            </DialogTitle>
            <p className="text-sm mt-1" style={{ color: 'var(--warm-gray)' }}>
              Pick a new date for this task
            </p>
          </DialogHeader>
          <CustomCalendar
            selected={undefined}
            defaultMonth={new Date()}
            fromYear={2024}
            toYear={2030}
            onSelect={handleRescheduleDate}
          />
          {isRescheduling && (
            <div className="text-center text-sm pb-4" style={{ color: 'var(--warm-gray)' }}>
              Rescheduling...
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Date Filter Calendar Modal */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-0 bg-white border-gray-200">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle
              className="text-lg font-bold font-display"
              style={{ color: 'var(--deep-charcoal)' }}
            >
              Filter by Date
            </DialogTitle>
            <p className="text-sm mt-1" style={{ color: 'var(--warm-gray)' }}>
              Select a date to filter tasks
            </p>
          </DialogHeader>
          <CustomCalendar
            selected={selectedDate ? new Date(selectedDate + 'T00:00:00') : undefined}
            defaultMonth={selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()}
            fromYear={2024}
            toYear={2030}
            onSelect={handleCalendarSelect}
          />
        </DialogContent>
      </Dialog>

      {/* Task Edit Sheet */}
      <TaskEditSheet
        isOpen={isEditSheetOpen}
        onClose={() => {
          setIsEditSheetOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSave={fetchTasks}
        availableGoals={goals}
      />
    </div>
  );
};
