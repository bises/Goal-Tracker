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
export function parseDateOnly(dateStr) {
    // Ensure the string is in strict YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        throw new Error(`Invalid date format: expected 'YYYY-MM-DD', got '${dateStr}'`);
    }
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    // Basic numeric and range validation
    if (!Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31) {
        throw new Error(`Invalid date components in '${dateStr}'`);
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    // Ensure the constructed date matches the input components (catches impossible dates)
    if (date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day) {
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
export function formatDateOnly(date) {
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
export function parseLocalDate(dateStr) {
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
export function formatLocalDate(date) {
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
export function getTodayString() {
    return formatLocalDate(new Date());
}
/**
 * Check if a date string represents today
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date is today
 */
export function isToday(dateStr) {
    return dateStr === getTodayString();
}
/**
 * Check if a date is in the past (compared to today)
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date is before today
 */
export function isPastDate(dateStr) {
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
export function addDays(dateStr, days) {
    const date = parseDateOnly(dateStr);
    date.setUTCDate(date.getUTCDate() + days);
    return formatDateOnly(date);
}
//# sourceMappingURL=dateUtils.js.map