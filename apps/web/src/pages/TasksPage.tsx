import { format } from 'date-fns';
import { CalendarIcon, RefreshCw, ServerOff, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PaginatedTasksResponse, taskApi } from '../api';
import { SquircleCard } from '../components/SquircleCard';
import { TaskCard } from '../components/TaskCard';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { CustomCalendar } from '../components/ui/custom-calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { PaginationBar } from '../components/ui/PaginationBar';
import { Spinner } from '../components/ui/spinner';
import { useGoalContext } from '../contexts/GoalContext';
import { Task } from '../types';

type TaskStatus = 'pending' | 'completed';

const TASKS_PER_PAGE = 10;

const isValidTab = (value: string | null): value is TaskStatus =>
  value === 'pending' || value === 'completed';

const formatDateDisplay = (date: string) => format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy');

export const TasksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { goals, fetchGoals } = useGoalContext();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TaskStatus>(
    isValidTab(initialTab) ? initialTab : 'pending'
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(searchParams.get('date') || null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => setFetchTrigger((c) => c + 1), []);

  // Fetch tasks whenever filters or fetchTrigger change
  useEffect(() => {
    let cancelled = false;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await taskApi.fetchTasks({
          status: activeTab,
          page,
          limit: TASKS_PER_PAGE,
          ...(selectedDate && { date: selectedDate }),
        });

        if (cancelled) return;
        const paginatedData = data as PaginatedTasksResponse;
        setTasks(paginatedData.tasks);
        setTotalPages(paginatedData.pagination.totalPages);
        setTotal(paginatedData.pagination.total);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to connect to server');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTasks();
    return () => {
      cancelled = true;
    };
  }, [activeTab, page, selectedDate, fetchTrigger]);

  // Sync search params → state for browser back/forward and in-app navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    const date = searchParams.get('date');
    if (isValidTab(tab) && tab !== activeTab) setActiveTab(tab);
    if ((date ?? null) !== selectedDate) setSelectedDate(date);
  }, [searchParams]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleTabChange = (tab: TaskStatus) => {
    setActiveTab(tab);
    setPage(1);
    setSearchParams({
      tab,
      ...(selectedDate && { date: selectedDate }),
    });
  };

  const handleDateChange = (date: string | null) => {
    setSelectedDate(date);
    setPage(1);
    setSearchParams({
      tab: activeTab,
      ...(date && { date }),
    });
    setIsDatePickerOpen(false);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) handleDateChange(format(date, 'yyyy-MM-dd'));
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
                onClick={() => {
                  setError(null);
                  refetch();
                }}
                disabled={loading}
                size="sm"
                className="mt-2"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Retrying...' : 'Retry Connection'}
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
              {selectedDate ? formatDateDisplay(selectedDate) : 'Filter by date'}
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
            Showing tasks for {formatDateDisplay(selectedDate)}
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
            <TaskCard key={task.id} task={task} availableGoals={goals} onTaskUpdated={refetch} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tasks.length === 0 && (
        <SquircleCard className="p-8 text-center">
          <div className="text-5xl mb-4">{activeTab === 'pending' ? '📝' : '✅'}</div>
          <div className="text-lg font-semibold mb-2" style={{ color: 'var(--deep-charcoal)' }}>
            No {activeTab} tasks{selectedDate ? ' for this date' : ''}
          </div>
          <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
            {selectedDate
              ? `No ${activeTab} tasks scheduled for ${formatDateDisplay(selectedDate!)}`
              : activeTab === 'pending'
                ? 'Create some tasks to get started!'
                : "You haven't completed any tasks yet."}
          </p>
        </SquircleCard>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="pb-4">
          <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

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
    </div>
  );
};
