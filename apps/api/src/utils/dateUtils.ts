/**
 * Utility functions for handling date-only fields
 */

/**
 * Parse a date-only string (YYYY-MM-DD) into a Date object
 * representing midnight UTC (for storage in DATE fields)
 */
export function parseDateOnly(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
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
