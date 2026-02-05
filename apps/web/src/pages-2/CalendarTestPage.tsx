import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

export default function CalendarTestPage() {
  const [date, setDate] = useState<string>('');

  return (
    <div style={{ padding: '2rem', background: 'var(--bg-color)', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '2rem' }}>Calendar Test</h1>
      
      <div style={{ maxWidth: '400px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: 'var(--deep-charcoal)',
          }}
        >
          Test Calendar
        </label>
        
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid var(--card-border)',
                color: date ? 'var(--deep-charcoal)' : 'var(--warm-gray)',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span>{date ? format(new Date(date), 'PPP') : 'Pick a date'}</span>
              <CalendarIcon style={{ width: '16px', height: '16px', color: 'var(--warm-gray)' }} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-fit overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date ? new Date(date) : undefined}
              captionLayout="dropdown"
              defaultMonth={date ? new Date(date) : new Date()}
              fromYear={2020}
              toYear={2030}
              onSelect={(selectedDate) => {
                setDate(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
              }}
            />
          </PopoverContent>
        </Popover>
        
        {date && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '12px' }}>
            <strong>Selected:</strong> {date}
          </div>
        )}
      </div>
    </div>
  );
}
