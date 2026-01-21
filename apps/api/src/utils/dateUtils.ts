/**
 * Utility functions for handling date-only fields
 */

/**
 * Parse a date-only string (YYYY-MM-DD) into a Date object
 * representing midnight UTC (for storage in DATE fields)
 */
export function parseDateOnly(dateStr: string): Date {
  // Ensure the string is in strict YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date format: expected 'YYYY-MM-DD', got '${dateStr}'`);
  }

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  // Basic numeric and range validation
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error(`Invalid date components in '${dateStr}'`);
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  // Ensure the constructed date matches the input components (catches impossible dates)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date '${dateStr}'`);
  }

  return date;
}

/**
 * Format a Date object as YYYY-MM-DD (for date-only fields)
 */
export function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
