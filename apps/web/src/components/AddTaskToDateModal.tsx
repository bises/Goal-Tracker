import React, { useMemo, useState } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { Task } from '../types';
import { Modal } from './Modal';

interface AddTaskToDateModalProps {
  isOpen: boolean;
  date: Date | null;
  onClose: () => void;
  onCreateNew?: (date: Date) => void;
}

// Local helper to format YYYY-MM-DD without timezone shift
const dateToLocalString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const AddTaskToDateModal: React.FC<AddTaskToDateModalProps> = ({
  isOpen,
  date,
  onClose,
  onCreateNew,
}) => {
  const { tasks, scheduleTask, createTask } = useTaskContext();
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [size, setSize] = useState(1);
  const selectedDateStr = date
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const unscheduled = useMemo(() => {
    const base = tasks.filter((t) => !t.scheduledDate);
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, query]);

  const handleAddExisting = async (task: Task) => {
    await scheduleTask(task.id, date);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Task — ${selectedDateStr}`}
      maxWidth="500px"
      maxHeight="70vh"
    >
      <div className="flex flex-col" style={{ height: 'calc(70vh - 120px)', maxHeight: '500px' }}>
        {/* Search for unscheduled tasks - Fixed at top */}
        <div className="flex-shrink-0 mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search unscheduled tasks..."
            className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/12 text-white box-border"
          />
        </div>

        {/* Unscheduled tasks list - Scrollable section ONLY */}
        <div className="flex-1 overflow-y-auto min-h-0 mb-3 -mx-1 px-1">
          {unscheduled.length > 0 && (
            <div className="flex flex-col gap-2">
              {unscheduled.slice(0, 50).map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between items-center bg-white/[0.04] rounded-[10px] px-3 py-2.5 gap-2"
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold truncate" title={t.title}>
                      {t.title}
                    </span>
                    {t.description && (
                      <span className="text-xs text-slate-400 truncate">{t.description}</span>
                    )}
                  </div>
                  <button
                    className="primary-btn flex-shrink-0"
                    onClick={() => handleAddExisting(t)}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* No unscheduled tasks message */}
          {unscheduled.length === 0 && query.trim() && (
            <div className="text-center p-4 text-slate-400">No tasks matching "{query}"</div>
          )}

          {/* Show all unscheduled when no query */}
          {unscheduled.length === 0 && !query.trim() && (
            <div className="text-center p-4 text-slate-400">No unscheduled tasks available</div>
          )}
        </div>

        {/* Create new task button - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-white/8 pt-3">
          <button
            className="primary-btn w-full"
            onClick={() => {
              onCreateNew?.(date!);
              onClose();
            }}
          >
            Create New Task
          </button>
        </div>
      </div>
    </Modal>
  );
};
