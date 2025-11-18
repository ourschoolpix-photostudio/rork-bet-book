/**
 * Date utilities for handling timezone conversions to Eastern Standard Time (EST/EDT)
 */

const EST_TIMEZONE = 'America/New_York';

/**
 * Convert a date string or Date object to Eastern Time
 */
export function toEasternTime(date: string | Date): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Create a date formatter for Eastern time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(d);
  const values: Record<string, string> = {};
  
  parts.forEach(part => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });
  
  // Create a new Date object in Eastern time
  return new Date(
    `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`
  );
}

/**
 * Format a date as a localized date string in Eastern Time
 */
export function formatDateEST(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    timeZone: EST_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format a date and time as a localized string in Eastern Time
 */
export function formatDateTimeEST(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    timeZone: EST_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  });
}

/**
 * Format time only in Eastern Time
 */
export function formatTimeEST(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    timeZone: EST_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  });
}

/**
 * Get the start of day in Eastern Time
 */
export function getEasternStartOfDay(date?: Date): Date {
  const d = date || new Date();
  
  // Get the date parts in Eastern time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(d);
  const values: Record<string, string> = {};
  
  parts.forEach(part => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });
  
  // Create midnight in Eastern time
  return new Date(`${values.year}-${values.month}-${values.day}T00:00:00-05:00`);
}

/**
 * Get the end of day in Eastern Time
 */
export function getEasternEndOfDay(date?: Date): Date {
  const d = date || new Date();
  
  // Get the date parts in Eastern time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(d);
  const values: Record<string, string> = {};
  
  parts.forEach(part => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });
  
  // Create 23:59:59 in Eastern time
  return new Date(`${values.year}-${values.month}-${values.day}T23:59:59-05:00`);
}

/**
 * Calculate days difference between two dates in Eastern Time
 */
export function getDaysDifferenceEST(date1: Date, date2: Date): number {
  const eastern1 = toEasternTime(date1);
  const eastern2 = toEasternTime(date2);
  
  // Get date parts only (ignore time)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const getParts = (d: Date) => {
    const parts = formatter.formatToParts(d);
    const values: Record<string, string> = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    });
    return values;
  };
  
  const parts1 = getParts(eastern1);
  const parts2 = getParts(eastern2);
  
  const day1 = new Date(`${parts1.year}-${parts1.month}-${parts1.day}`);
  const day2 = new Date(`${parts2.year}-${parts2.month}-${parts2.day}`);
  
  const diffTime = day2.getTime() - day1.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Format game time with "Today"/"Tomorrow" labels in Eastern Time
 */
export function formatGameTimeEST(dateString: string): string {
  const gameDate = new Date(dateString);
  const now = new Date();
  
  const diffDays = getDaysDifferenceEST(now, gameDate);
  
  if (diffDays === 0) {
    return `Today ${formatTimeEST(dateString)}`;
  } else if (diffDays === 1) {
    return `Tomorrow ${formatTimeEST(dateString)}`;
  } else {
    return formatDateTimeEST(dateString, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
