import { extractDateOnly } from '@goal-tracker/shared';
import { ChevronDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { taskApi } from '../api';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { Goal, Task, TaskCategory, TaskPriority } from '../types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { CalendarDialog } from './ui/calendar-dialog';
import { Checkbox } from './ui/checkbox';

// ─── Segmented Control ──────────────────────────────────────────────────────
interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  size = 'default',
}: {
  options: SegmentOption<T>[];
  value: T | '';
  onChange: (value: T | '') => void;
  size?: 'default' | 'sm';
}) => {
  const isSmall = size === 'sm';
  return (
    <div
      className="flex rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--card-border)' }}
    >
      {options.map((opt, idx) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(isActive ? '' : opt.value)}
            className={`flex-1 text-center font-medium transition-colors ${isSmall ? 'py-2 text-xs' : 'py-2.5 text-sm'}`}
            style={{
              background: isActive ? 'var(--energizing-orange)' : 'white',
              color: isActive ? 'white' : 'var(--deep-charcoal)',
              borderRight: idx < options.length - 1 ? '1px solid var(--card-border)' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

// ─── Category Pill Group ────────────────────────────────────────────────────
const CATEGORY_OPTIONS: { value: TaskCategory; emoji: string; label: string }[] = [
  { value: 'WORK', emoji: '💼', label: 'Work' },
  { value: 'PERSONAL', emoji: '👤', label: 'Personal' },
  { value: 'HEALTH', emoji: '🏃', label: 'Health' },
  { value: 'LEARNING', emoji: '📚', label: 'Learning' },
  { value: 'FINANCE', emoji: '💰', label: 'Finance' },
  { value: 'SOCIAL', emoji: '👥', label: 'Social' },
  { value: 'HOUSEHOLD', emoji: '🏠', label: 'Home' },
  { value: 'OTHER', emoji: '📌', label: 'Other' },
];

const CategoryPills = ({
  value,
  onChange,
}: {
  value: TaskCategory | '';
  onChange: (v: TaskCategory | '') => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {CATEGORY_OPTIONS.map((cat) => {
      const isActive = value === cat.value;
      return (
        <button
          key={cat.value}
          type="button"
          onClick={() => onChange(isActive ? '' : cat.value)}
          className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
          style={{
            background: isActive ? 'var(--energizing-orange)' : 'white',
            color: isActive ? 'white' : 'var(--deep-charcoal)',
            borderColor: isActive ? 'var(--energizing-orange)' : 'var(--card-border)',
          }}
        >
          {cat.emoji} {cat.label}
        </button>
      );
    })}
  </div>
);

// ─── Constants ──────────────────────────────────────────────────────────────
const PRIORITY_OPTIONS: SegmentOption<TaskPriority>[] = [
  { value: 'HIGH', label: '🔴 High' },
  { value: 'MEDIUM', label: '🟡 Med' },
  { value: 'LOW', label: '🟢 Low' },
];

const DURATION_UNIT_OPTIONS: SegmentOption<'minutes' | 'hours' | 'days'>[] = [
  { value: 'minutes', label: 'Min' },
  { value: 'hours', label: 'Hr' },
  { value: 'days', label: 'Day' },
];

// ─── Props ──────────────────────────────────────────────────────────────────
interface TaskEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSave?: () => void;
  availableGoals?: Goal[];
}

export const TaskEditSheet = ({
  isOpen,
  onClose,
  task,
  onSave,
  availableGoals = [],
}: TaskEditSheetProps) => {
  const isEditMode = !!task;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [category, setCategory] = useState<TaskCategory | ''>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [durationValue, setDurationValue] = useState('');
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const { isKeyboardOpen, drawerStyle } = useKeyboardHeight();

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || '');
      setCategory(task.category || '');
      setScheduledDate(task.scheduledDate ? extractDateOnly(task.scheduledDate) : '');
      setScheduledTime(task.scheduledTime || '');

      // Convert minutes to appropriate unit
      if (task.estimatedDurationMinutes) {
        const minutes = task.estimatedDurationMinutes;
        if (minutes >= 1440 && minutes % 1440 === 0) {
          // Days
          setDurationValue(String(minutes / 1440));
          setDurationUnit('days');
        } else if (minutes >= 60 && minutes % 60 === 0) {
          // Hours
          setDurationValue(String(minutes / 60));
          setDurationUnit('hours');
        } else {
          // Minutes
          setDurationValue(String(minutes));
          setDurationUnit('minutes');
        }
      } else {
        setDurationValue('');
        setDurationUnit('minutes');
      }

      setEstimatedCompletionDate(
        task.estimatedCompletionDate ? task.estimatedCompletionDate.split('T')[0] : ''
      );
      setSelectedGoalIds(task.goalTasks?.map((gt) => gt.goalId) || []);
      // Edit mode always shows full form
      setShowMoreOptions(true);
    } else {
      // Reset for create mode
      resetForm();
    }
  }, [task]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('');
    setCategory('');
    setScheduledDate('');
    setScheduledTime('');
    setDurationValue('');
    setDurationUnit('minutes');
    setEstimatedCompletionDate('');
    setSelectedGoalIds([]);
    setShowMoreOptions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert duration to minutes based on unit
      let durationInMinutes: number | undefined;
      if (durationValue) {
        const value = Number(durationValue);
        if (durationUnit === 'days') {
          durationInMinutes = value * 1440;
        } else if (durationUnit === 'hours') {
          durationInMinutes = value * 60;
        } else {
          durationInMinutes = value;
        }
      }

      const taskData: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority || undefined,
        category: category || undefined,
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
        estimatedDurationMinutes: durationInMinutes,
        estimatedCompletionDate: estimatedCompletionDate || undefined,
        size: 1, // Default size
      };

      if (isEditMode && task) {
        // Update existing task
        await taskApi.updateTask(task.id, taskData);

        // Handle goal linking changes
        const currentGoalIds = task.goalTasks?.map((gt) => gt.goalId) || [];
        const goalsToAdd = selectedGoalIds.filter((id) => !currentGoalIds.includes(id));
        const goalsToRemove = currentGoalIds.filter((id) => !selectedGoalIds.includes(id));

        for (const goalId of goalsToAdd) {
          await taskApi.linkGoal(task.id, goalId);
        }
        for (const goalId of goalsToRemove) {
          await taskApi.unlinkGoal(task.id, goalId);
        }
      } else {
        // Create new task
        taskData.goalIds = selectedGoalIds;
        await taskApi.createTask(taskData);
      }

      onSave?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    if (!isEditMode) {
      resetForm();
    }
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (open) (document.activeElement as HTMLElement)?.blur();
        if (!open) handleClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60" style={{ zIndex: 1300 }} />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[24px] overflow-hidden"
          style={{
            background: 'var(--peach-cream)',
            zIndex: 1400,
            ...drawerStyle(isEditMode || showMoreOptions ? '90dvh' : 'auto'),
          }}
          aria-describedby="task-edit-description"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Drag Handle */}
          {!isKeyboardOpen && (
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-4 mb-2" />
          )}

          {/* Header */}
          <div
            className={`flex items-center border-b flex-shrink-0 ${isKeyboardOpen ? 'justify-end px-3 py-1' : 'justify-between px-6 py-3'}`}
            style={{ borderColor: 'var(--card-border)' }}
          >
            {!isKeyboardOpen && (
              <Drawer.Title asChild>
                <h2
                  className="text-xl font-bold font-display"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  {isEditMode ? 'Edit Task' : 'New Task'}
                </h2>
              </Drawer.Title>
            )}
            {isKeyboardOpen && (
              <Drawer.Title className="sr-only">
                {isEditMode ? 'Edit Task' : 'New Task'}
              </Drawer.Title>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={handleClose}
              className={`rounded-xl flex-shrink-0 ${isKeyboardOpen ? 'w-8 h-8' : 'w-10 h-10'}`}
            >
              <X size={isKeyboardOpen ? 18 : 24} />
            </Button>
          </div>

          {/* Accessibility description */}
          <Drawer.Description
            id="task-edit-description"
            className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
            style={{ clip: 'rect(0, 0, 0, 0)' }}
          >
            {isEditMode
              ? 'Edit task details including title, description, priority, category, schedule, and goals.'
              : 'Quickly create a new task. Tap "More options" to add priority, category, and other details.'}
          </Drawer.Description>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="space-y-4 pb-4">
              {/* ═══ ESSENTIAL: Title ═══ */}
              <div>
                <label
                  htmlFor="task-title"
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  What do you need to do?
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Review quarterly report"
                  className="w-full px-4 py-3 rounded-xl border text-base"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--deep-charcoal)',
                    background: 'white',
                  }}
                  autoComplete="off"
                  required
                />
              </div>

              {/* ═══ ESSENTIAL: Scheduled Date ═══ */}
              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  When?
                </label>
                <CalendarDialog
                  value={scheduledDate}
                  onChange={setScheduledDate}
                  placeholder="Today"
                  fromYear={2020}
                  toYear={2030}
                />
              </div>

              {/* ═══ MORE OPTIONS toggle (create mode only) ═══ */}
              {!showMoreOptions && !isEditMode && (
                <button
                  type="button"
                  onClick={() => setShowMoreOptions(true)}
                  className="flex items-center gap-1.5 text-sm font-medium py-2"
                  style={{ color: 'var(--energizing-orange)' }}
                >
                  <ChevronDown size={16} />
                  More options
                </button>
              )}

              {/* ═══ EXPANDED OPTIONS ═══ */}
              {(showMoreOptions || isEditMode) && (
                <>
                  {/* Scheduled Time */}
                  <div>
                    <label
                      htmlFor="task-time"
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--deep-charcoal)' }}
                    >
                      Time
                    </label>
                    <input
                      id="task-time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border text-base"
                      style={{
                        borderColor: 'var(--card-border)',
                        color: scheduledTime ? 'var(--deep-charcoal)' : 'var(--warm-gray)',
                        background: 'white',
                      }}
                    />
                  </div>

                  {/* Priority — Segmented Control (replaces dropdown) */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--deep-charcoal)' }}
                    >
                      Priority
                    </label>
                    <SegmentedControl
                      options={PRIORITY_OPTIONS}
                      value={priority}
                      onChange={(v) => setPriority(v as TaskPriority | '')}
                    />
                  </div>

                  {/* Category — Pill buttons (replaces dropdown) */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--deep-charcoal)' }}
                    >
                      Category
                    </label>
                    <CategoryPills value={category} onChange={setCategory} />
                  </div>

                  {/* Duration — number input + segmented unit (replaces dropdown) */}
                  <div>
                    <label
                      htmlFor="task-duration"
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--deep-charcoal)' }}
                    >
                      Duration
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="task-duration"
                        type="number"
                        inputMode="numeric"
                        value={durationValue}
                        onChange={(e) => setDurationValue(e.target.value)}
                        placeholder="e.g., 30"
                        min="1"
                        className="flex-1 px-4 py-2.5 rounded-xl border text-base"
                        style={{
                          borderColor: 'var(--card-border)',
                          color: 'var(--deep-charcoal)',
                          background: 'white',
                        }}
                      />
                      <div className="w-[140px]">
                        <SegmentedControl
                          options={DURATION_UNIT_OPTIONS}
                          value={durationUnit}
                          onChange={(v) => {
                            if (v) setDurationUnit(v);
                          }}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Completion Date */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--deep-charcoal)' }}
                    >
                      Due Date
                    </label>
                    <CalendarDialog
                      value={estimatedCompletionDate}
                      onChange={setEstimatedCompletionDate}
                      placeholder="No due date"
                      fromYear={2020}
                      toYear={2030}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="task-description"
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--deep-charcoal)' }}
                    >
                      Notes
                    </label>
                    <textarea
                      id="task-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add details..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border text-base resize-none"
                      style={{
                        borderColor: 'var(--card-border)',
                        color: 'var(--deep-charcoal)',
                        background: 'white',
                      }}
                    />
                  </div>

                  {/* Link to Goals */}
                  {availableGoals.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem
                        value="goals"
                        className="border rounded-xl"
                        style={{ borderColor: 'var(--card-border)' }}
                      >
                        <AccordionTrigger
                          className="px-4 py-3 text-sm font-semibold hover:no-underline"
                          style={{ color: 'var(--deep-charcoal)' }}
                        >
                          Link to Goals{' '}
                          {selectedGoalIds.length > 0 && `(${selectedGoalIds.length})`}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-2">
                            {availableGoals.map((goal) => (
                              <div
                                key={goal.id}
                                className="flex items-center gap-3 p-3 rounded-lg border"
                                style={{ borderColor: 'var(--card-border)' }}
                              >
                                <Checkbox
                                  id={`goal-${goal.id}`}
                                  checked={selectedGoalIds.includes(goal.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedGoalIds([...selectedGoalIds, goal.id]);
                                    } else {
                                      setSelectedGoalIds(
                                        selectedGoalIds.filter((id) => id !== goal.id)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`goal-${goal.id}`}
                                  className="text-sm font-medium cursor-pointer flex-1"
                                  style={{ color: 'var(--deep-charcoal)' }}
                                >
                                  {goal.title}
                                </label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </>
              )}
            </div>
          </form>

          {/* Footer */}
          <div
            className={`px-6 border-t flex gap-3 flex-shrink-0 ${isKeyboardOpen ? 'py-2' : 'py-4 pb-8'}`}
            style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className={`flex-1 rounded-xl ${isKeyboardOpen ? 'h-9 text-sm' : ''}`}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className={`flex-1 rounded-xl ${isKeyboardOpen ? 'h-9 text-sm' : ''}`}
              disabled={isSubmitting || !title.trim()}
              style={{
                background: title.trim() ? 'var(--energizing-orange)' : undefined,
                color: title.trim() ? 'white' : undefined,
              }}
            >
              {isSubmitting
                ? 'Saving...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Task'}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
