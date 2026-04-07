import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './dialog';

interface TimePickerDialogProps {
  value?: string; // HH:mm format
  onChange: (time: string) => void;
  placeholder?: string;
}

export function TimePickerDialog({
  value,
  onChange,
  placeholder = 'Set time',
}: TimePickerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  // Sync picker state from value when dialog opens
  useEffect(() => {
    if (isOpen && value) {
      const [h, m] = value.split(':').map(Number);
      const isPM = h >= 12;
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      setHours(String(displayHour));
      setMinutes(String(m).padStart(2, '0'));
      setPeriod(isPM ? 'PM' : 'AM');
    } else if (isOpen && !value) {
      setHours('12');
      setMinutes('00');
      setPeriod('AM');
    }
  }, [isOpen, value]);

  // Scroll selected hour/minute into view when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        hoursRef.current
          ?.querySelector('[data-selected="true"]')
          ?.scrollIntoView({ block: 'center', behavior: 'instant' });
        minutesRef.current
          ?.querySelector('[data-selected="true"]')
          ?.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, 50);
    }
  }, [isOpen]);

  const handleSet = () => {
    let h = Number(hours);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const time24 = `${String(h).padStart(2, '0')}:${minutes}`;
    onChange(time24);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const formatDisplayTime = (val: string) => {
    if (!val) return null;
    const [h, m] = val.split(':').map(Number);
    const isPM = h >= 12;
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${String(m).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
  };

  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full px-4 py-3 rounded-xl border text-base text-left flex items-center justify-between"
          style={{
            borderColor: 'var(--card-border)',
            color: value ? 'var(--deep-charcoal)' : 'var(--warm-gray)',
            background: 'white',
          }}
        >
          <span className="truncate">
            {value ? formatDisplayTime(value) : placeholder}
          </span>
          <Clock
            className="h-4 w-4 ml-2 flex-shrink-0"
            style={{ color: 'var(--warm-gray)' }}
          />
        </button>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-[320px] p-0 !bg-white !border-[var(--card-border)]"
        style={{ background: 'white' }}
      >
        <DialogTitle className="sr-only">Select Time</DialogTitle>
        <div className="p-4">
          {/* Time display */}
          <div
            className="text-center text-3xl font-bold mb-4 py-2"
            style={{ color: 'var(--deep-charcoal)' }}
          >
            {hours}:{minutes} {period}
          </div>

          {/* Scroll pickers */}
          <div className="flex gap-2 mb-4" style={{ height: '180px' }}>
            {/* Hours column */}
            <div
              ref={hoursRef}
              className="flex-1 overflow-y-auto rounded-xl border scrollbar-thin"
              style={{ borderColor: 'var(--card-border)' }}
            >
              {hourOptions.map((h) => {
                const isActive = hours === String(h);
                return (
                  <button
                    key={h}
                    type="button"
                    data-selected={isActive}
                    onClick={() => setHours(String(h))}
                    className="w-full py-2.5 text-center text-base font-medium transition-colors"
                    style={{
                      background: isActive ? 'var(--energizing-orange)' : 'transparent',
                      color: isActive ? 'white' : 'var(--deep-charcoal)',
                    }}
                  >
                    {h}
                  </button>
                );
              })}
            </div>

            {/* Minutes column */}
            <div
              ref={minutesRef}
              className="flex-1 overflow-y-auto rounded-xl border scrollbar-thin"
              style={{ borderColor: 'var(--card-border)' }}
            >
              {minuteOptions.map((m) => {
                const mStr = String(m).padStart(2, '0');
                const isActive = minutes === mStr;
                return (
                  <button
                    key={m}
                    type="button"
                    data-selected={isActive}
                    onClick={() => setMinutes(mStr)}
                    className="w-full py-2.5 text-center text-base font-medium transition-colors"
                    style={{
                      background: isActive ? 'var(--energizing-orange)' : 'transparent',
                      color: isActive ? 'white' : 'var(--deep-charcoal)',
                    }}
                  >
                    {mStr}
                  </button>
                );
              })}
            </div>

            {/* AM/PM column */}
            <div
              className="w-16 flex flex-col rounded-xl border overflow-hidden"
              style={{ borderColor: 'var(--card-border)' }}
            >
              {(['AM', 'PM'] as const).map((p) => {
                const isActive = period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className="flex-1 text-center text-sm font-semibold transition-colors"
                    style={{
                      background: isActive ? 'var(--energizing-orange)' : 'white',
                      color: isActive ? 'white' : 'var(--deep-charcoal)',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors"
              style={{
                borderColor: 'var(--card-border)',
                color: 'var(--deep-charcoal)',
                background: 'white',
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSet}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: 'var(--energizing-orange)',
                color: 'white',
              }}
            >
              Set Time
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
