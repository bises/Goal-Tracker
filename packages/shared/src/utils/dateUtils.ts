/**
 * Shared date utility functions for Goal Tracker
 *
 * All date utilities use UTC internally for consistency across frontend and backend.
 * This prevents timezone-related bugs when storing and retrieving date-only values.
 */

/**
 * Parse a date-only string (YYYY-MM-DD) into a Date object
 * representing midnight UTC (for storage in DATE fields)
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object at midnight UTC
 * @throws Error if the date string is invalid or malformed
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
 * Format a Date object as YYYY-MM-DD string (UTC-based)
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string as a local date (not UTC)
 * Handles both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm:ss.sssZ' formats
 *
 * This is useful for display purposes where you want to show dates
 * in the user's local timezone without conversion.
 *
 * @param dateStr - The date string to parse
 * @returns A Date object representing the local date
 */
export function parseLocalDate(dateStr: string): Date {
  const dateOnly = dateStr.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Convert Date to YYYY-MM-DD string in local time (no timezone conversion)
 *
 * This is the inverse of parseLocalDate - useful for form inputs
 * where you want to show the local date.
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format (local timezone)
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD string (local timezone)
 *
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return formatLocalDate(new Date());
}

/**
 * Check if a date string represents today
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayString();
}

/**
 * Check if a date is in the past (compared to today)
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date is before today
 */
export function isPastDate(dateStr: string): boolean {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Add days to a date string
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative)
 * @returns New date string in YYYY-MM-DD format
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDateOnly(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

/**
 * Format a date field (which may include time) as a localized date string
 * Handles both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm:ss' formats
 * This is specifically for scheduledDate fields that may come from the API
 *
 * @param dateStr - Date string (may include time component)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string in user's locale
 */
export function formatScheduledDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string {
  const dateOnly = dateStr.split('T')[0];
  const date = parseLocalDate(dateOnly);
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a timestamp (like completedAt) as a localized date string
 * This properly handles UTC timestamps and converts to local timezone
 *
 * @param timestamp - ISO 8601 timestamp string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string in user's locale
 */
export function formatTimestamp(
  timestamp: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string {
  return new Date(timestamp).toLocaleDateString('en-US', options);
}

/**
 * Extract just the date part from a date field (removes time if present)
 * Useful for form inputs that expect YYYY-MM-DD format
 *
 * @param dateStr - Date string that may include time component
 * @returns Date string in YYYY-MM-DD format
 */
export function extractDateOnly(dateStr: string): string {
  return dateStr.split('T')[0];
}
