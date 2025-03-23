import { format, parseISO, isValid } from 'date-fns';

/**
 * Standard date formats used across the application
 */
export const DATE_FORMATS = {
  /** Format for displaying dates in forms (YYYY-MM-DD) */
  API_DATE: 'yyyy-MM-dd',
  /** Format for displaying dates with time in the API (ISO 8601) */
  API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  /** Format for displaying dates in headers (Month DD, YYYY) */
  DISPLAY_DATE: 'MMM dd, yyyy',
  /** Format for displaying dates with time (Month DD, YYYY h:mm AM/PM) */
  DISPLAY_DATETIME: 'MMM dd, yyyy h:mm a',
  /** Format for compact date display in cards (Month DD) */
  COMPACT_DATE: 'MMM d',
  /** Format for displaying times (HH:MM AM/PM) */
  DISPLAY_TIME: 'h:mm a',
};

/**
 * Safely parse a date string in any format
 * @param dateString The date string to parse
 * @returns A valid Date object or null if the date is invalid
 */
export const parseDate = (dateString: string | Date | null | undefined): Date | null => {
  if (!dateString) return null;
  
  // If already a Date object, return it
  if (dateString instanceof Date) {
    return isValid(dateString) ? dateString : null;
  }
  
  try {
    // Try to parse as ISO string first
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    // If parseISO fails, try the Date constructor
    const fallbackDate = new Date(dateString);
    return isValid(fallbackDate) ? fallbackDate : null;
  }
};

/**
 * Format a date string or Date object according to the specified format
 * @param date The date string or Date object to format
 * @param formatString The format string to use
 * @returns A formatted date string or empty string if the date is invalid
 */
export const formatDate = (
  date: string | Date | null | undefined,
  formatString: string = DATE_FORMATS.DISPLAY_DATE
): string => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  return format(parsedDate, formatString);
};

/**
 * Convert a date to ISO string format for API requests
 * @param date The date to convert
 * @returns An ISO string or empty string if the date is invalid
 */
export const toISOString = (date: string | Date | null | undefined): string => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  return parsedDate.toISOString();
};

/**
 * Validate if a date is valid for a due date (not in the past)
 * @param date The date to validate
 * @returns True if the date is valid for a due date
 */
export const isValidDueDate = (date: string | Date | null | undefined): boolean => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return false;
  
  // Due dates should be today or in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  return parsedDate >= today;
}; 