/**
 * Semi-month period utilities.
 *
 * Period 1 (P1) = day 1–15
 * Period 2 (P2) = day 16–last day of month
 *
 * Last day adapts by month/year:
 *   Feb non-leap = 28, Feb leap = 29, 30-day months = 30, 31-day months = 31
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Period = 'P1' | 'P2';
export type ViewMode = 'monthly' | 'P1' | 'P2';

export interface PeriodInfo {
  year: number;
  month: number;
  period: Period;
}

export interface PeriodBoundaries {
  startDay: number;
  endDay: number;
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/** Returns the last calendar day of a given month/year. */
export function getLastDayOfMonth(year: number, month: number): number {
  // new Date(year, month, 0) gives last day of `month`
  return new Date(year, month, 0).getDate();
}

/** Returns whether `year` is a leap year. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Clamp a nominal due-date (1-31) to the last valid day of the target month. */
export function clampDueDate(dueDate: number, year: number, month: number): number {
  const lastDay = getLastDayOfMonth(year, month);
  return Math.min(dueDate, lastDay);
}

// ---------------------------------------------------------------------------
// Period boundaries
// ---------------------------------------------------------------------------

/** Get start/end day numbers for a period inside a specific month. */
export function getPeriodBoundaries(
  year: number,
  month: number,
  period: Period,
): PeriodBoundaries {
  if (period === 'P1') {
    return { startDay: 1, endDay: 15 };
  }
  return { startDay: 16, endDay: getLastDayOfMonth(year, month) };
}

/** Get JS Date range [start, end] for a period (both inclusive, end at 23:59:59.999). */
export function getPeriodDateRange(
  year: number,
  month: number,
  period: Period,
): { start: Date; end: Date } {
  const { startDay, endDay } = getPeriodBoundaries(year, month, period);
  const start = new Date(year, month - 1, startDay, 0, 0, 0, 0);
  const end = new Date(year, month - 1, endDay, 23, 59, 59, 999);
  return { start, end };
}

// ---------------------------------------------------------------------------
// Current period detection
// ---------------------------------------------------------------------------

/** Determine the current period based on today's date. */
export function getCurrentPeriod(): PeriodInfo {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const period: Period = day <= 15 ? 'P1' : 'P2';
  return { year, month, period };
}

/** Determine which period a given day falls into. */
export function getPeriodForDay(day: number): Period {
  return day <= 15 ? 'P1' : 'P2';
}

// ---------------------------------------------------------------------------
// Period ID encoding  (e.g. "2026-02" for monthly, "2026-02-P1" for period)
// ---------------------------------------------------------------------------

/** Build a human-readable period key. */
export function buildPeriodKey(year: number, month: number, period?: Period): string {
  const m = String(month).padStart(2, '0');
  if (!period) return `${year}-${m}`;
  return `${year}-${m}-${period}`;
}

/** Parse a period key back to components. */
export function parsePeriodKey(key: string): { year: number; month: number; period?: Period } {
  const parts = key.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const period = parts[2] as Period | undefined;
  return { year, month, period };
}

// ---------------------------------------------------------------------------
// Period navigation
// ---------------------------------------------------------------------------

/** Get the next period after the given one. */
export function getNextPeriod(info: PeriodInfo): PeriodInfo {
  if (info.period === 'P1') {
    return { year: info.year, month: info.month, period: 'P2' };
  }
  // P2 → next month P1
  let nextMonth = info.month + 1;
  let nextYear = info.year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  return { year: nextYear, month: nextMonth, period: 'P1' };
}

/** Get the previous period before the given one. */
export function getPreviousPeriod(info: PeriodInfo): PeriodInfo {
  if (info.period === 'P2') {
    return { year: info.year, month: info.month, period: 'P1' };
  }
  // P1 → previous month P2
  let prevMonth = info.month - 1;
  let prevYear = info.year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  return { year: prevYear, month: prevMonth, period: 'P2' };
}

// ---------------------------------------------------------------------------
// Filtering helpers
// ---------------------------------------------------------------------------

/** Check if a due date (day of month) falls within a given period. */
export function isDueDateInPeriod(dueDate: number, year: number, month: number, period: Period): boolean {
  const clamped = clampDueDate(dueDate, year, month);
  const { startDay, endDay } = getPeriodBoundaries(year, month, period);
  return clamped >= startDay && clamped <= endDay;
}

/** Check if a due date falls within view mode boundaries. Monthly = all days. */
export function isDueDateInViewMode(
  dueDate: number,
  year: number,
  month: number,
  viewMode: ViewMode,
): boolean {
  if (viewMode === 'monthly') return true;
  return isDueDateInPeriod(dueDate, year, month, viewMode as Period);
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function getPeriodLabel(period: Period): string {
  return period === 'P1' ? 'Period 1 (1st–15th)' : 'Period 2 (16th–End)';
}

export function getViewModeLabel(viewMode: ViewMode): string {
  if (viewMode === 'monthly') return 'Full Month';
  return getPeriodLabel(viewMode as Period);
}

export function getShortPeriodLabel(period: Period): string {
  return period === 'P1' ? 'P1' : 'P2';
}

export function getViewModeShortLabel(viewMode: ViewMode): string {
  if (viewMode === 'monthly') return 'Monthly';
  return getShortPeriodLabel(viewMode as Period);
}
