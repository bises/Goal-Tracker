import { useEffect, useState } from 'react';
import { api, PaginatedTasksResponse, taskApi } from '../api';
import { SquircleCard } from '../components-2/SquircleCard';
import { TaskCard } from '../components-2/TaskCard';
import { TaskEditSheet } from '../components-2/TaskEditSheet';
import { Spinner } from '../components/ui/spinner';
import { Goal, Task } from '../types';

type TaskStatus = 'pending' | 'completed';

export const TasksPage = () => {
  const [activeTab, setActiveTab] = useState<TaskStatus>('pending');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    fetchTasks();
  }, [activeTab, page]);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const goalsData = await api.fetchGoals();
      setGoals(goalsData);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskApi.fetchTasks({
        status: activeTab,
        page,
        limit: 10,
      });

      // Type assertion since we're passing pagination params
      const paginatedData = data as PaginatedTasksResponse;
      setTasks(paginatedData.tasks);
      setTotalPages(paginatedData.pagination.totalPages);
      setTotal(paginatedData.pagination.total);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TaskStatus) => {
    setActiveTab(tab);
    setPage(1); // Reset to first page when changing tabs
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
    console.log('Reschedule task:', taskId);
    // TODO: Open date picker modal
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
      {/* Header */}
      <div className="px-4">
        <h1
          className="text-3xl font-bold font-display mb-2"
          style={{ color: 'var(--deep-charcoal)' }}
        >
          Tasks
        </h1>
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
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--deep-charcoal)' }}>
            No {activeTab} tasks
          </h3>
          <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
            {activeTab === 'pending'
              ? 'Create some tasks to get started!'
              : "You haven't completed any tasks yet."}
          </p>
        </SquircleCard>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pb-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: page === 1 ? 'transparent' : 'rgba(255, 140, 66, 0.1)',
              color: 'var(--deep-charcoal)',
            }}
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className="w-10 h-10 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background:
                      page === pageNum ? 'var(--energizing-orange)' : 'rgba(255, 140, 66, 0.1)',
                    color: page === pageNum ? 'white' : 'var(--deep-charcoal)',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span style={{ color: 'var(--warm-gray)' }}>...</span>
                <button
                  onClick={() => setPage(totalPages)}
                  className="w-10 h-10 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background:
                      page === totalPages ? 'var(--energizing-orange)' : 'rgba(255, 140, 66, 0.1)',
                    color: page === totalPages ? 'white' : 'var(--deep-charcoal)',
                  }}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: page === totalPages ? 'transparent' : 'rgba(255, 140, 66, 0.1)',
              color: 'var(--deep-charcoal)',
            }}
          >
            Next
          </button>
        </div>
      )}

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
