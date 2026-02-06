import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { taskApi } from '../api';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Button } from '../components/ui/button';
import { CalendarDialog } from '../components/ui/calendar-dialog';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Goal, Task, TaskCategory, TaskPriority } from '../types';

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

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || '');
      setCategory(task.category || '');
      setScheduledDate(task.scheduledDate ? task.scheduledDate.split('T')[0] : '');
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
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[24px] h-[90vh] max-h-[90vh] overflow-hidden"
          style={{ background: 'var(--card-bg)' }}
          aria-describedby="task-edit-description"
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
                className="text-2xl font-bold font-display"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                {isEditMode ? 'Edit Task' : 'New Task'}
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
            id="task-edit-description"
            className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
            style={{ clip: 'rect(0, 0, 0, 0)' }}
          >
            {isEditMode
              ? 'Edit task details including title, description, priority, category, schedule, and goals.'
              : 'Create a new task with title, description, priority, category, schedule, and goals.'}
          </Drawer.Description>

          {/* Form Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="space-y-4 pb-6">
              {/* Title */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Title <span style={{ color: 'var(--energizing-orange)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="w-full px-4 py-3 rounded-xl border text-base"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--deep-charcoal)',
                    background: 'white',
                  }}
                  required
                />
              </div>

              {/* Scheduled Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                {/* Scheduled Date */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    Scheduled Date
                  </label>
                  <CalendarDialog
                    value={scheduledDate}
                    onChange={setScheduledDate}
                    placeholder="Pick a date"
                    fromYear={2020}
                    toYear={2030}
                  />
                </div>

                {/* Scheduled Time */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-base"
                    style={{
                      borderColor: 'var(--card-border)',
                      color: 'var(--deep-charcoal)',
                      background: 'white',
                    }}
                  />
                </div>
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    Priority
                  </label>
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as TaskPriority)}
                  >
                    <SelectTrigger
                      className="w-full h-12 px-4 rounded-xl border text-base"
                      style={{ borderColor: 'var(--card-border)', color: 'var(--deep-charcoal)' }}
                    >
                      <SelectValue placeholder="No priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">🔴 High</SelectItem>
                      <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                      <SelectItem value="LOW">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    Category
                  </label>
                  <Select
                    value={category}
                    onValueChange={(value) => setCategory(value as TaskCategory)}
                  >
                    <SelectTrigger
                      className="w-full h-12 px-4 rounded-xl border text-base"
                      style={{ borderColor: 'var(--card-border)', color: 'var(--deep-charcoal)' }}
                    >
                      <SelectValue placeholder="No category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WORK">💼 Work</SelectItem>
                      <SelectItem value="PERSONAL">👤 Personal</SelectItem>
                      <SelectItem value="HEALTH">🏃 Health</SelectItem>
                      <SelectItem value="LEARNING">📚 Learning</SelectItem>
                      <SelectItem value="FINANCE">💰 Finance</SelectItem>
                      <SelectItem value="SOCIAL">👥 Social</SelectItem>
                      <SelectItem value="HOUSEHOLD">🏠 Household</SelectItem>
                      <SelectItem value="OTHER">📌 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estimated Duration */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Estimated Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                    placeholder="e.g., 2"
                    min="1"
                    className="flex-1 px-4 py-3 rounded-xl border text-base"
                    style={{
                      borderColor: 'var(--card-border)',
                      color: 'var(--deep-charcoal)',
                      background: 'white',
                    }}
                  />
                  <Select
                    value={durationUnit}
                    onValueChange={(value) =>
                      setDurationUnit(value as 'minutes' | 'hours' | 'days')
                    }
                  >
                    <SelectTrigger
                      className="w-[120px] h-auto px-4 py-3 rounded-xl border text-base"
                      style={{ borderColor: 'var(--card-border)', color: 'var(--deep-charcoal)' }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estimated Completion Date */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Estimated Completion Date
                </label>
                <CalendarDialog
                  value={estimatedCompletionDate}
                  onChange={setEstimatedCompletionDate}
                  placeholder="Pick a date"
                  fromYear={2020}
                  toYear={2030}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about this task"
                  rows={3}
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
                      Link to Goals {selectedGoalIds.length > 0 && `(${selectedGoalIds.length})`}
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
            </div>
          </form>

          {/* Footer Actions */}
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
            <Button type="button" onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
