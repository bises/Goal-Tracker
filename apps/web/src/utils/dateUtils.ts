/**
 * Parse a date string as a local date (not UTC)
 * Handles both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm:ss.sssZ' formats
 * @param dateStr - The date string to parse
 * @returns A Date object representing the local date
 */
export const parseLocalDate = (dateStr: string): Date => {
  const dateOnly = dateStr.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
};
