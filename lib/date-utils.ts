import { format, parseISO, isValid, formatDistanceToNow, isAfter, isBefore, isToday } from 'date-fns';

/**
 * Safely parse a date string to a Date object
 * Returns null if the date string is invalid or undefined
 */
export const safeParseDate = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null;
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Safely format a date string
 * Returns a fallback string if the date is invalid
 */
export const safeFormatDate = (
  dateString: string | undefined | null, 
  formatStr: string, 
  fallback: string = 'Date TBD'
): string => {
  const date = safeParseDate(dateString);
  if (!date) return fallback;
  try {
    return format(date, formatStr);
  } catch {
    return fallback;
  }
};

/**
 * Safely get the distance to now from a date string
 * Returns a fallback string if the date is invalid
 */
export const safeFormatDistanceToNow = (
  dateString: string | undefined | null,
  options?: { addSuffix?: boolean },
  fallback: string = 'Unknown time'
): string => {
  const date = safeParseDate(dateString);
  if (!date) return fallback;
  try {
    return formatDistanceToNow(date, options);
  } catch {
    return fallback;
  }
};

/**
 * Safely check if a date is after another date
 */
export const safeIsAfter = (
  dateString: string | undefined | null, 
  compareDate: Date
): boolean => {
  const date = safeParseDate(dateString);
  if (!date) return false;
  return isAfter(date, compareDate);
};

/**
 * Safely check if a date is before another date
 */
export const safeIsBefore = (
  dateString: string | undefined | null, 
  compareDate: Date
): boolean => {
  const date = safeParseDate(dateString);
  if (!date) return false;
  return isBefore(date, compareDate);
};

/**
 * Safely check if a date is today
 */
export const safeIsToday = (dateString: string | undefined | null): boolean => {
  const date = safeParseDate(dateString);
  if (!date) return false;
  return isToday(date);
};

/**
 * Get time difference in milliseconds between a date and now
 * Returns 0 if date is invalid
 */
export const safeGetTime = (dateString: string | undefined | null): number => {
  const date = safeParseDate(dateString);
  if (!date) return 0;
  return date.getTime();
};
