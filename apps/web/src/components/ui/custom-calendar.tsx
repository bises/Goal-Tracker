import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface CustomCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  fromYear?: number;
  toYear?: number;
  defaultMonth?: Date;
}

export function CustomCalendar({
  selected,
  onSelect,
  fromYear = 2020,
  toYear = 2030,
  defaultMonth,
}: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(
    defaultMonth?.getMonth() ?? new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    defaultMonth?.getFullYear() ?? new Date().getFullYear()
  );

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);

  // Generate calendar days
  const days: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const handleDayClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    onSelect?.(date);
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth &&
      selected.getFullYear() === currentYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg w-full" style={{ maxWidth: '100%' }}>
      {/* Month and Year Selectors */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <Select
          value={currentMonth.toString()}
          onValueChange={(value) => setCurrentMonth(Number(value))}
        >
          <SelectTrigger
            className="w-[140px] h-10 border"
            style={{ borderColor: 'var(--card-border)', color: 'var(--deep-charcoal)' }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthNames.map((month, index) => (
              <SelectItem key={month} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentYear.toString()}
          onValueChange={(value) => setCurrentYear(Number(value))}
        >
          <SelectTrigger
            className="w-[100px] h-10 border"
            style={{ borderColor: 'var(--card-border)', color: 'var(--deep-charcoal)' }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center py-2 text-sm font-semibold"
            style={{ color: 'var(--warm-gray)' }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            type="button"
            disabled={day === null}
            onClick={() => day && handleDayClick(day)}
            className="aspect-square flex items-center justify-center rounded-lg text-lg font-semibold transition-colors disabled:invisible"
            style={{
              minHeight: '56px',
              color: isSelected(day!)
                ? 'white'
                : isToday(day!)
                  ? 'var(--deep-charcoal)'
                  : 'var(--deep-charcoal)',
              background: isSelected(day!)
                ? 'var(--deep-charcoal)'
                : isToday(day!)
                  ? 'rgba(0,0,0,0.05)'
                  : 'transparent',
              border:
                isToday(day!) && !isSelected(day!)
                  ? '2px solid var(--card-border)'
                  : '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (day && !isSelected(day)) {
                e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (day && !isSelected(day)) {
                e.currentTarget.style.background = isToday(day)
                  ? 'rgba(0,0,0,0.05)'
                  : 'transparent';
              }
            }}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
