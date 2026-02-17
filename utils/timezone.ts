/**
 * Timezone utilities for Brazilian time (America/Sao_Paulo)
 * This file is shared between API functions and frontend code
 */

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Get current date/time in Brazilian timezone
 */
export function getBrazilianDate(): Date {
  // Create a date in Brazilian timezone
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
  return brazilTime;
}

/**
 * Get Brazilian date as ISO string (for database storage)
 */
export function getBrazilianISOString(): string {
  return getBrazilianDate().toISOString();
}

/**
 * Add hours to current Brazilian time
 */
export function addHoursFromNow(hours: number): Date {
  const now = getBrazilianDate();
  now.setHours(now.getHours() + hours);
  return now;
}

/**
 * Format date in Brazilian format (DD/MM/YYYY HH:mm)
 */
export function formatBrazilianDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date in Brazilian format (DD/MM/YYYY)
 */
export function formatBrazilianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Get time difference in hours between two dates
 */
export function getHoursDifference(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime();
  return Math.floor(diff / (1000 * 60 * 60));
}

/**
 * Check if date is expired (in Brazilian timezone)
 */
export function isExpired(expiryDate: Date | string): boolean {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = getBrazilianDate();
  return expiry.getTime() < now.getTime();
}
