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
export declare function parseDateOnly(dateStr: string): Date;
/**
 * Format a Date object as YYYY-MM-DD string (UTC-based)
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export declare function formatDateOnly(date: Date): string;
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
export declare function parseLocalDate(dateStr: string): Date;
/**
 * Convert Date to YYYY-MM-DD string in local time (no timezone conversion)
 *
 * This is the inverse of parseLocalDate - useful for form inputs
 * where you want to show the local date.
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format (local timezone)
 */
export declare function formatLocalDate(date: Date): string;
/**
 * Get today's date as YYYY-MM-DD string (local timezone)
 *
 * @returns Today's date in YYYY-MM-DD format
 */
export declare function getTodayString(): string;
/**
 * Check if a date string represents today
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date is today
 */
export declare function isToday(dateStr: string): boolean;
/**
 * Check if a date is in the past (compared to today)
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date is before today
 */
export declare function isPastDate(dateStr: string): boolean;
/**
 * Add days to a date string
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative)
 * @returns New date string in YYYY-MM-DD format
 */
export declare function addDays(dateStr: string, days: number): string;
//# sourceMappingURL=dateUtils.d.ts.map