import { Eye, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Drawer } from 'vaul';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { Goal } from '../types';

interface BulkTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  parentGoal: Goal;
  onCreated: () => void;
}

export const BulkTaskSheet = ({ isOpen, onClose, parentGoal, onCreated }: BulkTaskSheetProps) => {
  const [pattern, setPattern] = useState('');
  const [count, setCount] = useState(10);
  const [preview, setPreview] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generatePreview = () => {
    const tasks: string[] = [];
    for (let i = 1; i <= count; i++) {
      const taskName = pattern.replace(/{n}/g, i.toString());
      tasks.push(taskName);
    }
    setPreview(tasks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskNames =
      preview.length > 0
        ? preview
        : Array.from({ length: count }, (_, i) => {
            return pattern.replace(/{n}/g, (i + 1).toString());
          });

    const tasks = taskNames.map((title) => ({ title }));

    setIsSubmitting(true);
    try {
      await api.bulkCreateTasks(parentGoal.id, tasks);
      onCreated();
      handleClose();
    } catch (error) {
      console.error('Failed to create tasks:', error);
      alert('Failed to create tasks. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setPattern('');
    setCount(10);
    setPreview([]);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60" style={{ zIndex: 1300 }} />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[24px] max-h-[85vh] overflow-hidden"
          style={{ background: 'var(--peach-cream)', zIndex: 1400 }}
          aria-describedby="bulk-task-description"
        >
          {/* Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-4 mb-4" />

          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'var(--card-border)' }}
          >
            <Drawer.Title asChild>
              <h2
                className="text-xl font-bold font-display"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                Create Tasks
              </h2>
            </Drawer.Title>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="w-10 h-10 rounded-xl"
            >
              <X size={24} />
            </Button>
          </div>

          {/* Hidden description for accessibility */}
          <Drawer.Description
            id="bulk-task-description"
            className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
            style={{ clip: 'rect(0, 0, 0, 0)' }}
          >
            Create multiple tasks for your goal using a naming pattern.
          </Drawer.Description>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="space-y-4 pb-6">
              {/* Goal Info */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(255, 140, 66, 0.08)',
                  border: '1px solid rgba(255, 140, 66, 0.15)',
                }}
              >
                <p
                  className="text-sm font-bold font-display"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  {parentGoal.title}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--warm-gray)' }}>
                  Use{' '}
                  <code className="px-1.5 py-0.5 rounded bg-white/60 text-xs font-mono">
                    {'{n}'}
                  </code>{' '}
                  as a placeholder for numbers
                </p>
              </div>

              {/* Pattern */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Task Name Pattern <span style={{ color: 'var(--energizing-orange)' }}>*</span>
                </label>
                <input
                  value={pattern}
                  onChange={(e) => {
                    setPattern(e.target.value);
                    setPreview([]);
                  }}
                  placeholder="e.g., Read chapter {n} of Atomic Habits"
                  required
                  className="w-full px-4 py-3 rounded-xl border text-base"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--deep-charcoal)',
                    background: 'white',
                  }}
                />
                {pattern && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--warm-gray)' }}>
                    Example: "{pattern.replace(/{n}/g, '1')}"
                  </p>
                )}
              </div>

              {/* Count */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Number of Tasks
                </label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => {
                    setCount(parseInt(e.target.value) || 1);
                    setPreview([]);
                  }}
                  min="1"
                  max="100"
                  required
                  className="w-full px-4 py-3 rounded-xl border text-base"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--deep-charcoal)',
                    background: 'white',
                  }}
                />
              </div>

              {/* Preview Button */}
              <button
                type="button"
                onClick={generatePreview}
                disabled={!pattern}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
                style={{
                  background: 'rgba(255, 140, 66, 0.1)',
                  color: 'var(--energizing-orange)',
                  border: '1px solid rgba(255, 140, 66, 0.2)',
                }}
              >
                <Eye size={16} />
                Preview Tasks
              </button>

              {/* Preview List */}
              {preview.length > 0 && (
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    Preview ({preview.length} tasks)
                  </label>
                  <div
                    className="max-h-48 overflow-y-auto rounded-xl border"
                    style={{ borderColor: 'var(--card-border)', background: 'white' }}
                  >
                    {preview.map((task, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm"
                        style={{
                          borderBottom:
                            idx < preview.length - 1 ? '1px solid var(--card-border)' : 'none',
                          color: 'var(--deep-charcoal)',
                        }}
                      >
                        <span
                          className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(255, 140, 66, 0.1)',
                            color: 'var(--energizing-orange)',
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div
            className="px-6 py-4 pb-20 border-t flex gap-3 flex-shrink-0"
            style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || preview.length === 0}
            >
              <Plus size={16} className="mr-1" />
              {isSubmitting
                ? 'Creating...'
                : `Create ${preview.length > 0 ? preview.length : count} Tasks`}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
