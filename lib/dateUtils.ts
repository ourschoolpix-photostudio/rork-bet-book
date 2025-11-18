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
  
  // Find the UTC time that corresponds to midnight Eastern
  const utcDate = new Date(`${values.year}-${values.month}-${values.day}T00:00:00Z`);
  
  // Adjust to find midnight in Eastern time
  for (let offset = -14; offset <= 14; offset++) {
    const candidate = new Date(utcDate.getTime() + offset * 60 * 60 * 1000);
    const candidateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: EST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const candidateParts = candidateFormatter.formatToParts(candidate);
    const candidateValues: Record<string, string> = {};
    candidateParts.forEach(part => {
      if (part.type !== 'literal') {
        candidateValues[part.type] = part.value;
      }
    });
    
    if (candidateValues.year === values.year &&
        candidateValues.month === values.month &&
        candidateValues.day === values.day &&
        candidateValues.hour === '00' &&
        candidateValues.minute === '00') {
      return candidate;
    }
  }
  
  return utcDate;
}

/**
 * Get the end of day in Eastern Time
 */
export function getEasternEndOfDay(date?: Date): Date {
  const startOfDay = getEasternStartOfDay(date);
  // Add 24 hours minus 1 second to get end of day
  return new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1000);
}

/**
 * Calculate days difference between two dates in Eastern Time
 */
export function getDaysDifferenceEST(date1: Date, date2: Date): number {
  // Get start of day for both dates in Eastern time
  const start1 = getEasternStartOfDay(date1);
  const start2 = getEasternStartOfDay(date2);
  
  // Calculate difference in milliseconds and convert to days
  const diffTime = start2.getTime() - start1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Format game time with "Today"/"Tomorrow" labels in Eastern Time
 */
export function formatGameTimeEST(dateString: string): string {
  const gameDate = new Date(dateString);
  const now = new Date();
  
  const diffDays = getDaysDifferenceEST(now, gameDate);
  
  console.log('formatGameTimeEST:', {
    gameDate: gameDate.toISOString(),
    now: now.toISOString(),
    diffDays,
    gameStartEastern: getEasternStartOfDay(gameDate).toISOString(),
    nowStartEastern: getEasternStartOfDay(now).toISOString(),
  });
  
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
