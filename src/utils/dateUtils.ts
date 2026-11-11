// Timezone-safe date utilities for ShiftFlow

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
}

/**
 * Parses YYYY-MM-DD string into numeric year, month, day
 */
export function parseISODate(dateStr: string): DateParts {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    throw new Error(`Invalid ISO date string: ${dateStr}`);
  }
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2]
  };
}

/**
 * Formats year, month (1-12), day into YYYY-MM-DD
 */
export function formatISODate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Returns whether a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Returns number of days in a given year and month (1-12)
 */
export function getDaysInMonth(year: number, month: number): number {
  switch (month) {
    case 1: case 3: case 5: case 7: case 8: case 10: case 12:
      return 31;
    case 4: case 6: case 9: case 11:
      return 30;
    case 2:
      return isLeapYear(year) ? 29 : 28;
    default:
      throw new Error(`Invalid month: ${month}`);
  }
}

/**
 * Converts a YYYY-MM-DD into a UTC timestamp at midnight.
 * Completely immune to local timezone and daylight saving time variations!
 */
export function dateStringToUTCMidnight(dateStr: string): number {
  const { year, month, day } = parseISODate(dateStr);
  return Date.UTC(year, month - 1, day);
}

/**
 * Calculates exact integer calendar days between two YYYY-MM-DD dates (b - a).
 * If b > a, returns positive integer. If b < a, returns negative integer.
 */
export function getDaysBetween(dateStrA: string, dateStrB: string): number {
  const utcA = dateStringToUTCMidnight(dateStrA);
  const utcB = dateStringToUTCMidnight(dateStrB);
  const MS_PER_DAY = 86400000;
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

/**
 * Adds or subtracts n days from a YYYY-MM-DD string
 */
export function addDaysToDate(dateStr: string, n: number): string {
  const { year, month, day } = parseISODate(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day + n));
  return formatISODate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Returns day of week: 1 for Monday, 7 for Sunday (ISO standard)
 */
export function getDayOfWeek(dateStr: string): number {
  const { year, month, day } = parseISODate(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = d.getUTCDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  return dow === 0 ? 7 : dow;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return formatISODate(year, month, day);
}

export interface CalendarCell {
  date: string;          // YYYY-MM-DD
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;     // 1 = Monday .. 7 = Sunday
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Builds month grid starting from Monday
 */
export function getMonthCalendarGrid(year: number, month: number): CalendarCell[] {
  const todayStr = getTodayString();
  const daysInCurrent = getDaysInMonth(year, month);
  const firstDayOfWeek = getDayOfWeek(formatISODate(year, month, 1)); // 1 (Mon) .. 7 (Sun)
  
  const cells: CalendarCell[] = [];

  // Days before the 1st (padding from previous month)
  const prevMonthDaysNeeded = firstDayOfWeek - 1;
  if (prevMonthDaysNeeded > 0) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrev = getDaysInMonth(prevYear, prevMonth);

    for (let i = prevMonthDaysNeeded - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const dateStr = formatISODate(prevYear, prevMonth, d);
      cells.push({
        date: dateStr,
        year: prevYear,
        month: prevMonth,
        day: d,
        dayOfWeek: getDayOfWeek(dateStr),
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }
  }

  // Current month days
  for (let d = 1; d <= daysInCurrent; d++) {
    const dateStr = formatISODate(year, month, d);
    cells.push({
      date: dateStr,
      year,
      month,
      day: d,
      dayOfWeek: getDayOfWeek(dateStr),
      isCurrentMonth: true,
      isToday: dateStr === todayStr
    });
  }

  // Days after month end to complete weekly rows (multiple of 7)
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const nextMonthDaysNeeded = 7 - remainder;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    for (let d = 1; d <= nextMonthDaysNeeded; d++) {
      const dateStr = formatISODate(nextYear, nextMonth, d);
      cells.push({
        date: dateStr,
        year: nextYear,
        month: nextMonth,
        day: d,
        dayOfWeek: getDayOfWeek(dateStr),
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }
  }

  return cells;
}

const MONTH_NAMES_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const MONTH_NAMES_GENITIVE_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const WEEKDAY_NAMES_RU = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'
];

export const WEEKDAY_SHORT_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function getMonthNameRU(month: number): string {
  return MONTH_NAMES_RU[month - 1] || '';
}

export function getMonthNameGenitiveRU(month: number): string {
  return MONTH_NAMES_GENITIVE_RU[month - 1] || '';
}

export function getWeekdayNameRU(dayOfWeek: number): string {
  return WEEKDAY_NAMES_RU[dayOfWeek - 1] || '';
}

export function getWeekdayShortRU(dayOfWeek: number): string {
  return WEEKDAY_SHORT_RU[dayOfWeek - 1] || '';
}

/**
 * Formats date into readable Russian, e.g. "11 ноября 2026, среда"
 */
export function formatFullDateRU(dateStr: string): string {
  const { year, month, day } = parseISODate(dateStr);
  const dow = getDayOfWeek(dateStr);
  const monthGen = getMonthNameGenitiveRU(month);
  const weekday = getWeekdayNameRU(dow).toLowerCase();
  return `${day} ${monthGen} ${year}, ${weekday}`;
}
