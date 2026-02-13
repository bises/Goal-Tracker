import { parseLocalDate } from '@goal-tracker/shared';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { CustomCalendar } from './custom-calendar';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './dialog';

interface CalendarDialogProps {
  value?: string; // Date string in YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
}

export function CalendarDialog({
  value,
  onChange,
  placeholder = 'Pick a date',
  fromYear = 2020,
  toYear = 2030,
}: CalendarDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      onChange('');
    }
    setIsOpen(false);
  };

  // Use parseLocalDate to avoid timezone issues
  const selectedDate = value ? parseLocalDate(value) : undefined;

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
            {value ? format(parseLocalDate(value), 'PPP') : placeholder}
          </span>
          <CalendarIcon
            className="h-4 w-4 ml-2 flex-shrink-0"
            style={{ color: 'var(--warm-gray)' }}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-0">
        <DialogTitle className="sr-only">Select Date</DialogTitle>
        <CustomCalendar
          selected={selectedDate}
          defaultMonth={selectedDate || new Date()}
          fromYear={fromYear}
          toYear={toYear}
          onSelect={handleSelect}
        />
      </DialogContent>
    </Dialog>
  );
}
