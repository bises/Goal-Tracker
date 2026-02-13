import { Minus, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Drawer } from 'vaul';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { Goal } from '../types';

interface AddProgressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
  onUpdated: () => void;
}

export const AddProgressSheet = ({ isOpen, onClose, goal, onUpdated }: AddProgressSheetProps) => {
  const stepSize = goal.stepSize || 1;
  const [value, setValue] = useState(stepSize.toString());
  const [customData, setCustomData] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || parseFloat(value) === 0) return;

    setIsSubmitting(true);
    try {
      await api.updateProgress(goal.id, parseFloat(value), note, customData || undefined);
      onUpdated();
      onClose();
      // Reset
      setValue(stepSize.toString());
      setCustomData('');
      setNote('');
    } catch (error) {
      console.error('Failed to log progress:', error);
      alert('Failed to log progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const increment = () => {
    setValue((prev) => (parseFloat(prev || '0') + stepSize).toString());
  };

  const decrement = () => {
    setValue((prev) => {
      const next = parseFloat(prev || '0') - stepSize;
      return next > 0 ? next.toString() : stepSize.toString();
    });
  };

  const percent = goal.targetValue
    ? Math.min(((goal.currentValue + parseFloat(value || '0')) / goal.targetValue) * 100, 100)
    : 0;

  const handleClose = () => {
    onClose();
    setValue(stepSize.toString());
    setCustomData('');
    setNote('');
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60" style={{ zIndex: 1300 }} />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[24px] max-h-[80vh] overflow-hidden"
          style={{ background: 'var(--peach-cream)', zIndex: 1400 }}
          aria-describedby="progress-sheet-description"
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
                Log Progress
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
            id="progress-sheet-description"
            className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
            style={{ clip: 'rect(0, 0, 0, 0)' }}
          >
            Log progress toward your goal.
          </Drawer.Description>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="space-y-5 pb-6">
              {/* Goal Info */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(255, 140, 66, 0.08)',
                  border: '1px solid rgba(255, 140, 66, 0.15)',
                }}
              >
                <p
                  className="text-sm font-bold font-display mb-1"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  {goal.title}
                </p>
                <p className="text-xs" style={{ color: 'var(--warm-gray)' }}>
                  Current: {goal.currentValue}
                  {goal.targetValue ? ` / ${goal.targetValue}` : ''}
                </p>
              </div>

              {/* Amount with +/- buttons */}
              <div>
                <label
                  className="block text-sm font-semibold mb-3"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Amount
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={decrement}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                    style={{
                      background: 'white',
                      border: '1px solid var(--card-border)',
                      color: 'var(--deep-charcoal)',
                    }}
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    step={stepSize}
                    className="w-24 text-center text-2xl font-bold px-4 py-3 rounded-xl border"
                    style={{
                      borderColor: 'var(--card-border)',
                      color: 'var(--deep-charcoal)',
                      background: 'white',
                    }}
                  />
                  <button
                    type="button"
                    onClick={increment}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                    style={{
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3)',
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Progress preview */}
              {goal.targetValue && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--warm-gray)' }}>
                      After logging
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    className="w-full h-3 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255, 140, 66, 0.1)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percent}%`,
                        background: 'var(--gradient-primary)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Custom Data */}
              {goal.customDataLabel && (
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    {goal.customDataLabel}{' '}
                    <span style={{ color: 'var(--energizing-orange)' }}>*</span>
                  </label>
                  <input
                    value={customData}
                    onChange={(e) => setCustomData(e.target.value)}
                    placeholder={`Enter ${goal.customDataLabel}...`}
                    required
                    className="w-full px-4 py-3 rounded-xl border text-base"
                    style={{
                      borderColor: 'var(--card-border)',
                      color: 'var(--deep-charcoal)',
                      background: 'white',
                    }}
                  />
                </div>
              )}

              {/* Note */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Note{' '}
                  <span className="font-normal" style={{ color: 'var(--warm-gray)' }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What did you accomplish?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border text-base resize-none"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--deep-charcoal)',
                    background: 'white',
                  }}
                />
              </div>
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
            <Button type="button" onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Log Progress'}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
