import { format } from 'date-fns';
import { CalendarDays, Clock, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Drawer } from 'vaul';
import { Task } from '../types';
import { Button } from './ui/button';
import { CustomCalendar } from './ui/custom-calendar';

interface RescheduleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  /** Called with the selected date + optional time */
  onSchedule: (taskId: string, date: Date, time?: string) => Promise<void>;
  /** When true, shows a time picker below the calendar */
  showTimePicker?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const formatHour = (hour: number): string => {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:00 ${ampm}`;
};

const formatHalfHour = (hour: number): string => {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:30 ${ampm}`;
};

export const RescheduleSheet = ({
  isOpen,
  onClose,
  task,
  onSchedule,
  showTimePicker = false,
}: RescheduleSheetProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when sheet opens with a new task
  const taskId = task?.id;
  const initialDate = useMemo(() => {
    if (!task?.scheduledDate) return undefined;
    // Parse YYYY-MM-DD without timezone shift
    const [y, m, d] = task.scheduledDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [task?.scheduledDate]);

  // Set defaults when task changes
  useMemo(() => {
    setSelectedDate(initialDate);
    setSelectedTime(task?.scheduledTime || undefined);
  }, [taskId]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleSave = async () => {
    if (!task || !selectedDate) return;
    setIsSaving(true);
    try {
      await onSchedule(task.id, selectedDate, showTimePicker ? selectedTime : undefined);
      onClose();
    } catch (err) {
      console.error('Failed to reschedule:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSchedule = async () => {
    if (!task) return;
    setIsSaving(true);
    try {
      // Pass a "null" date by using epoch — parent handles unscheduling
      await onSchedule(task.id, new Date(0));
      onClose();
    } catch (err) {
      console.error('Failed to unschedule:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (open) (document.activeElement as HTMLElement)?.blur();
        if (!open) onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" style={{ zIndex: 1300 }} />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 rounded-t-[24px] outline-none"
          style={{
            zIndex: 1400,
            background: 'var(--peach-cream)',
            maxHeight: '90vh',
          }}
        >
          <Drawer.Title className="sr-only">Schedule Task</Drawer.Title>

          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--card-border)' }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} style={{ color: 'var(--energizing-orange)' }} />
              <h2
                className="text-lg font-bold font-display"
                style={{ color: 'var(--deep-charcoal)' }}
                aria-hidden="true"
              >
                Schedule Task
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-black/5 transition-colors"
            >
              <X size={20} style={{ color: 'var(--warm-gray)' }} />
            </button>
          </div>

          {/* Task title */}
          {task && (
            <div className="px-5 pb-3">
              <p
                className="text-sm font-semibold line-clamp-2"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                {task.title}
              </p>
              {task.scheduledDate && (
                <p className="text-xs mt-1" style={{ color: 'var(--warm-gray)' }}>
                  Currently:{' '}
                  {format(
                    new Date(
                      ...(task.scheduledDate.split('-').map((v, i) => (i === 1 ? +v - 1 : +v)) as [
                        number,
                        number,
                        number,
                      ])
                    ),
                    'EEE, MMM d'
                  )}
                  {task.scheduledTime && ` at ${formatTimeDisplay(task.scheduledTime)}`}
                </p>
              )}
            </div>
          )}

          {/* Calendar */}
          <div
            className="px-5 overflow-y-auto"
            style={{ maxHeight: showTimePicker ? 'calc(90vh - 300px)' : 'calc(90vh - 200px)' }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: '1px solid var(--card-border)',
                background: 'white',
              }}
            >
              <CustomCalendar
                selected={selectedDate}
                defaultMonth={selectedDate || new Date()}
                onSelect={handleDateSelect}
              />
            </div>

            {/* Time picker */}
            {showTimePicker && selectedDate && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} style={{ color: 'var(--energizing-orange)' }} />
                  <span
                    className="text-xs font-bold font-display"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    Time (optional)
                  </span>
                  {selectedTime && (
                    <button
                      onClick={() => setSelectedTime(undefined)}
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-auto"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div
                  className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto rounded-xl p-2"
                  style={{
                    background: 'white',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  {HOURS.map((hour) => {
                    const fullHour = `${String(hour).padStart(2, '0')}:00`;
                    const halfHour = `${String(hour).padStart(2, '0')}:30`;
                    return [
                      <button
                        key={fullHour}
                        onClick={() => setSelectedTime(fullHour)}
                        className="px-1 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                        style={{
                          background:
                            selectedTime === fullHour ? 'var(--gradient-primary)' : 'transparent',
                          color: selectedTime === fullHour ? 'white' : 'var(--deep-charcoal)',
                          boxShadow:
                            selectedTime === fullHour
                              ? '0 2px 8px rgba(255, 140, 66, 0.3)'
                              : 'none',
                        }}
                      >
                        {formatHour(hour)}
                      </button>,
                      <button
                        key={halfHour}
                        onClick={() => setSelectedTime(halfHour)}
                        className="px-1 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                        style={{
                          background:
                            selectedTime === halfHour ? 'var(--gradient-primary)' : 'transparent',
                          color: selectedTime === halfHour ? 'white' : 'var(--deep-charcoal)',
                          boxShadow:
                            selectedTime === halfHour
                              ? '0 2px 8px rgba(255, 140, 66, 0.3)'
                              : 'none',
                        }}
                      >
                        {formatHalfHour(hour)}
                      </button>,
                    ];
                  }).flat()}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-5 py-4 flex gap-3">
            {task?.scheduledDate && (
              <Button
                variant="outline"
                onClick={handleRemoveSchedule}
                disabled={isSaving}
                className="rounded-xl"
                style={{
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                }}
              >
                Unschedule
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!selectedDate || isSaving}
              className="flex-1 rounded-xl font-semibold"
              style={{
                background: selectedDate ? 'var(--gradient-primary)' : undefined,
                color: selectedDate ? 'white' : undefined,
              }}
            >
              {isSaving
                ? 'Saving...'
                : selectedDate
                  ? `Schedule for ${format(selectedDate, 'MMM d')}`
                  : 'Pick a date'}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}
