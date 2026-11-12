import {
  ScheduleConfig,
  WorkPoint,
  DayOverride,
  PlacedSticker,
  ResolvedDayInfo,
  CycleStep,
  DayStatus
} from '../types';
import {
  getDaysBetween,
  parseISODate,
  getDayOfWeek,
  getDaysInMonth,
  formatISODate,
  getTodayString
} from '../utils/dateUtils';

/**
 * Calculates the total length of a cycle in days
 */
export function getCycleTotalDays(cycle: CycleStep[]): number {
  if (!cycle || cycle.length === 0) return 0;
  return cycle.reduce((sum, step) => sum + Math.max(1, step.durationDays), 0);
}

/**
 * Resolves which pointId is scheduled for a given date based on cycle and anchor start date.
 * Fully timezone-safe via calendar day difference.
 */
export function resolveCyclePointId(
  targetDate: string,
  startDate: string,
  cycle: CycleStep[]
): string | null {
  const totalDays = getCycleTotalDays(cycle);
  if (totalDays === 0) return null;

  const dayDiff = getDaysBetween(startDate, targetDate);

  // Modulo arithmetic that correctly handles negative differences (dates prior to start date)
  let offset = dayDiff % totalDays;
  if (offset < 0) {
    offset = (offset + totalDays) % totalDays;
  }

  let accumulated = 0;
  for (const step of cycle) {
    const duration = Math.max(1, step.durationDays);
    if (offset >= accumulated && offset < accumulated + duration) {
      return step.pointId;
    }
    accumulated += duration;
  }

  return cycle[0]?.pointId || null;
}

/**
 * Finds the active epoch for a date or falls back to baseCycle and baseStartDate.
 */
export function getActiveTimeline(
  targetDate: string,
  config: ScheduleConfig
): { startDate: string; cycle: CycleStep[] } {
  // Check if there are epochs that start on or before targetDate
  if (config.epochs && config.epochs.length > 0) {
    // Sort epochs descending by startDate
    const sorted = [...config.epochs].sort((a, b) => b.startDate.localeCompare(a.startDate));
    for (const epoch of sorted) {
      if (targetDate >= epoch.startDate) {
        return {
          startDate: epoch.startDate,
          cycle: epoch.cycle
        };
      }
    }
  }

  return {
    startDate: config.baseStartDate,
    cycle: config.baseCycle
  };
}

/**
 * Calculates the scheduled point for any target date before overrides.
 */
export function getScheduledPointForDate(
  targetDate: string,
  config: ScheduleConfig,
  pointsMap: Record<string, WorkPoint>
): WorkPoint | null {
  const timeline = getActiveTimeline(targetDate, config);
  const pointId = resolveCyclePointId(targetDate, timeline.startDate, timeline.cycle);
  if (!pointId) return null;
  return pointsMap[pointId] || null;
}

/**
 * Fully resolves a calendar date, applying overrides, swaps, notes, and placed stickers.
 */
export function resolveDayInfo(
  dateStr: string,
  displayMonth: number,
  config: ScheduleConfig,
  pointsMap: Record<string, WorkPoint>,
  overrides: Record<string, DayOverride>,
  stickersByDate: Record<string, PlacedSticker[]>
): ResolvedDayInfo {
  const { month, day } = parseISODate(dateStr);
  const isCurrentMonth = month === displayMonth;
  const isToday = dateStr === getTodayString();
  const dayOfWeek = getDayOfWeek(dateStr);

  const scheduledPoint = getScheduledPointForDate(dateStr, config, pointsMap);
  const override = overrides[dateStr];
  const stickers = stickersByDate[dateStr] || [];

  let status: DayStatus = 'work';
  let actualPoint: WorkPoint | null = scheduledPoint;
  let isSwap = false;
  let originalPoint: WorkPoint | null = null;
  let note: string | undefined = undefined;
  let tags: string[] | undefined = undefined;
  let intimate = override?.intimate;
  let activities = override?.activities;
  let noteSticker = override?.noteSticker;

  if (override) {
    status = override.status;
    note = override.note;
    tags = override.tags;
    intimate = override.intimate;
    activities = override.activities;
    noteSticker = override.noteSticker;

    if (override.status === 'day_off' || override.status === 'vacation' || override.status === 'sick') {
      actualPoint = null;
    } else if (override.status === 'work') {
      if (override.isSwap) {
        isSwap = true;
        originalPoint = override.originalPointId ? (pointsMap[override.originalPointId] || scheduledPoint) : scheduledPoint;
        actualPoint = override.pointId ? (pointsMap[override.pointId] || null) : null;
      } else if (override.pointId) {
        actualPoint = pointsMap[override.pointId] || scheduledPoint;
      }
    }
  }

  return {
    date: dateStr,
    isCurrentMonth,
    isToday,
    dayNumber: day,
    dayOfWeek,
    scheduledPoint,
    actualPoint,
    status,
    isSwap,
    originalPoint,
    override,
    stickers,
    note,
    tags,
    intimate,
    activities,
    noteSticker,
    journalPage: override?.journalPage
  };
}

/**
 * Statistics calculation for a given month and year
 */
export interface MonthStatistics {
  year: number;
  month: number;
  totalDays: number;
  workingDays: number;
  dayOffs: number;
  swapsCount: number;
  shiftsByPoint: Record<string, { point: WorkPoint; count: number; hours: number }>;
  activeOverridesCount: number;
  notesCount: number;
  stickersCount: number;
}

export function calculateMonthStatistics(
  year: number,
  month: number,
  config: ScheduleConfig,
  pointsMap: Record<string, WorkPoint>,
  overrides: Record<string, DayOverride>,
  stickersByDate: Record<string, PlacedSticker[]>
): MonthStatistics {
  const daysInMonth = getDaysInMonth(year, month);
  let workingDays = 0;
  let dayOffs = 0;
  let swapsCount = 0;
  let activeOverridesCount = 0;
  let notesCount = 0;
  let stickersCount = 0;

  const shiftsByPoint: Record<string, { point: WorkPoint; count: number; hours: number }> = {};

  // Initialize all known points
  for (const p of Object.values(pointsMap)) {
    if (p.isActive) {
      shiftsByPoint[p.id] = { point: p, count: 0, hours: 0 };
    }
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatISODate(year, month, d);
    const dayInfo = resolveDayInfo(dateStr, month, config, pointsMap, overrides, stickersByDate);

    if (dayInfo.stickers.length > 0) {
      stickersCount += dayInfo.stickers.length;
    }
    if (dayInfo.note && dayInfo.note.trim().length > 0) {
      notesCount++;
    }
    if (dayInfo.override) {
      activeOverridesCount++;
    }

    if (dayInfo.status === 'work' && dayInfo.actualPoint) {
      workingDays++;
      const pId = dayInfo.actualPoint.id;
      if (!shiftsByPoint[pId]) {
        shiftsByPoint[pId] = { point: dayInfo.actualPoint, count: 0, hours: 0 };
      }
      shiftsByPoint[pId].count++;

      // Hours calculation if start and end times exist
      let shiftHours = 0;
      if (dayInfo.actualPoint.startTime && dayInfo.actualPoint.endTime) {
        const [sh, sm] = dayInfo.actualPoint.startTime.split(':').map(Number);
        const [eh, em] = dayInfo.actualPoint.endTime.split(':').map(Number);
        if (!isNaN(sh) && !isNaN(eh)) {
          let mins = (eh * 60 + em) - (sh * 60 + sm);
          if (mins < 0) mins += 24 * 60; // overnight
          shiftHours = Math.round((mins / 60) * 10) / 10;
        }
      }
      shiftsByPoint[pId].hours += shiftHours;

      if (dayInfo.isSwap) {
        swapsCount++;
      }
    } else {
      dayOffs++;
    }
  }

  return {
    year,
    month,
    totalDays: daysInMonth,
    workingDays,
    dayOffs,
    swapsCount,
    shiftsByPoint,
    activeOverridesCount,
    notesCount,
    stickersCount
  };
}

