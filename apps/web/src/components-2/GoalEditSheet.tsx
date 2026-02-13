import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { CalendarDialog } from '../components/ui/calendar-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Goal, GoalScope } from '../types';

interface GoalEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
  onSave?: () => void;
  parentGoal?: Goal | null;
}

const SCOPE_OPTIONS: { value: GoalScope; label: string; icon: string }[] = [
  { value: 'STANDALONE', label: 'Standalone', icon: '🎯' },
  { value: 'YEARLY', label: 'Yearly', icon: '📅' },
  { value: 'MONTHLY', label: 'Monthly', icon: '🗓️' },
  { value: 'WEEKLY', label: 'Weekly', icon: '📆' },
];

const SCOPE_HIERARCHY: GoalScope[] = ['YEARLY', 'MONTHLY', 'WEEKLY'];

export const GoalEditSheet = ({
  isOpen,
  onClose,
  goal,
  onSave,
  parentGoal,
}: GoalEditSheetProps) => {
  const isEditMode = !!goal;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'TOTAL_TARGET' | 'FREQUENCY'>('TOTAL_TARGET');
  const [targetValue, setTargetValue] = useState('');
  const [scope, setScope] = useState<GoalScope>('STANDALONE');
  const [endDate, setEndDate] = useState('');
  const [customDataLabel, setCustomDataLabel] = useState('');
  const [parentId, setParentId] = useState('');
  const [allowDecimals, setAllowDecimals] = useState(false);
  const [availableParents, setAvailableParents] = useState<Goal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when goal changes
  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setType(goal.type || 'TOTAL_TARGET');
      setTargetValue(goal.targetValue?.toString() || '');
      setScope(goal.scope || 'STANDALONE');
      setEndDate(goal.endDate ? goal.endDate.split('T')[0] : '');
      setCustomDataLabel(goal.customDataLabel || '');
      setParentId(goal.parentId || '');
      setAllowDecimals(goal.stepSize !== undefined && goal.stepSize < 1);
    } else {
      resetForm();
      if (parentGoal) {
        setParentId(parentGoal.id);
        // Auto-set scope one level below parent
        const parentIndex = SCOPE_HIERARCHY.indexOf(parentGoal.scope);
        if (parentIndex >= 0 && parentIndex < SCOPE_HIERARCHY.length - 1) {
          setScope(SCOPE_HIERARCHY[parentIndex + 1]);
        }
      }
    }
  }, [goal, parentGoal]);

  // Load available parent goals when scope changes
  useEffect(() => {
    const loadParents = async () => {
      if (scope !== 'STANDALONE') {
        try {
          const goals = await api.fetchGoals();
          const currentIndex = SCOPE_HIERARCHY.indexOf(scope);
          const parentScope = currentIndex > 0 ? SCOPE_HIERARCHY[currentIndex - 1] : null;
          if (parentScope) {
            setAvailableParents(goals.filter((g) => g.scope === parentScope));
          } else {
            setAvailableParents([]);
          }
        } catch (err) {
          console.error('Failed to load parent goals:', err);
        }
      } else {
        setAvailableParents([]);
      }
    };
    if (isOpen) {
      loadParents();
    }
  }, [scope, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('TOTAL_TARGET');
    setTargetValue('');
    setScope('STANDALONE');
    setEndDate('');
    setCustomDataLabel('');
    setParentId('');
    setAllowDecimals(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const goalData: Partial<Goal> = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        scope,
        endDate: endDate ? new Date(endDate + 'T00:00:00').toISOString() : undefined,
        customDataLabel: customDataLabel.trim() || undefined,
        stepSize: allowDecimals ? 0.1 : 1,
      };

      if (isEditMode && goal) {
        await api.updateGoal(goal.id, goalData);
      } else {
        goalData.currentValue = 0;
        goalData.parentId = parentId || undefined;
        await api.createGoal(goalData);
      }

      onSave?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save goal:', error);
      alert('Failed to save goal. Please try again.');
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
          aria-describedby="goal-edit-description"
        >
          {/* Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-4 mb-4" />

          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'var(--card-border)' }}
          >
            <Drawer.Title asChild>
              <div
                className="text-2xl font-bold font-display"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                {isEditMode ? 'Edit Goal' : 'New Goal'}
              </div>
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
            id="goal-edit-description"
            className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
            style={{ clip: 'rect(0, 0, 0, 0)' }}
          >
            {isEditMode
              ? 'Edit goal details including title, description, scope, and target.'
              : 'Create a new goal with title, description, scope, and target.'}
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
                  Goal Title <span style={{ color: 'var(--energizing-orange)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 12 Books"
                  className="w-full px-4 py-3 rounded-xl border text-base"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--deep-charcoal)',
                    background: 'white',
                  }}
                  required
                />
              </div>

              {/* Scope */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Scope
                </label>
                <Select value={scope} onValueChange={(value) => setScope(value as GoalScope)}>
                  <SelectTrigger
                    className="w-full h-12 px-4 rounded-xl border text-base"
                    style={{ borderColor: 'var(--card-border)', color: 'var(--deep-charcoal)' }}
                  >
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Value */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Target Value
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. 12"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border text-base"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--deep-charcoal)',
                    background: 'white',
                  }}
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--warm-gray)' }}>
                  Leave blank for open-ended tracking
                </p>
              </div>

              {/* Parent Goal (for non-standalone, non-yearly scopes) */}
              {!isEditMode &&
                scope !== 'STANDALONE' &&
                scope !== 'YEARLY' &&
                availableParents.length > 0 && (
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: 'var(--deep-charcoal)' }}
                    >
                      Parent Goal
                    </label>
                    <Select value={parentId} onValueChange={setParentId}>
                      <SelectTrigger
                        className="w-full h-12 px-4 rounded-xl border text-base"
                        style={{
                          borderColor: 'var(--card-border)',
                          color: 'var(--deep-charcoal)',
                        }}
                      >
                        <SelectValue placeholder="No parent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No parent</SelectItem>
                        {availableParents.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

              {/* End Date */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  End Date
                </label>
                <CalendarDialog
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Pick end date (optional)"
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
                  placeholder="Add more details about this goal..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border text-base resize-none"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--deep-charcoal)',
                    background: 'white',
                  }}
                />
              </div>

              {/* Custom Log Label */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Custom Log Label
                </label>
                <input
                  type="text"
                  value={customDataLabel}
                  onChange={(e) => setCustomDataLabel(e.target.value)}
                  placeholder="e.g. Book Name, Location"
                  className="w-full px-4 py-3 rounded-xl border text-base"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--deep-charcoal)',
                    background: 'white',
                  }}
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--warm-gray)' }}>
                  Label for extra data when logging progress
                </p>
              </div>

              {/* Allow Decimals */}
              {/* <div
                className="flex items-center gap-3 p-4 rounded-xl border"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <input
                  type="checkbox"
                  id="allowDecimals"
                  checked={allowDecimals}
                  onChange={(e) => setAllowDecimals(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-orange-500"
                />
                <label
                  htmlFor="allowDecimals"
                  className="text-sm font-medium cursor-pointer"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Allow decimal values when logging progress
                </label>
              </div> */}
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
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
