import { describe, it, expect } from 'vitest';
import {
  resolveCyclePointId,
  getScheduledPointForDate,
  resolveDayInfo,
  calculateMonthStatistics
} from './scheduleEngine';
import {
  getDaysBetween,
  addDaysToDate,
  getDayOfWeek,
  getDaysInMonth,
  isLeapYear,
  getMonthCalendarGrid
} from '../utils/dateUtils';
import { ScheduleConfig, WorkPoint, DayOverride } from '../types';

describe('dateUtils', () => {
  it('correctly calculates days between dates across month and year boundaries', () => {
    expect(getDaysBetween('2026-11-01', '2026-11-01')).toBe(0);
    expect(getDaysBetween('2026-11-01', '2026-11-03')).toBe(2);
    expect(getDaysBetween('2026-11-01', '2026-10-31')).toBe(-1);
    expect(getDaysBetween('2026-11-01', '2026-12-01')).toBe(30); // November has 30 days
    expect(getDaysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('correctly handles leap years and days in months', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);

    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(getDaysInMonth(2028, 2)).toBe(29);
    expect(getDaysInMonth(2026, 11)).toBe(30);
    expect(getDaysInMonth(2026, 12)).toBe(31);
  });

  it('adds days correctly across year boundaries and leap days', () => {
    expect(addDaysToDate('2026-11-01', 5)).toBe('2026-11-06');
    expect(addDaysToDate('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysToDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToDate('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysToDate('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('returns Monday = 1 .. Sunday = 7 correctly', () => {
    // 2026-11-01 is Sunday
    expect(getDayOfWeek('2026-11-01')).toBe(7);
    // 2026-11-02 is Monday
    expect(getDayOfWeek('2026-11-02')).toBe(1);
    // 2026-11-07 is Saturday
    expect(getDayOfWeek('2026-11-07')).toBe(6);
  });

  it('builds month calendar grid starting from Monday', () => {
    const grid = getMonthCalendarGrid(2026, 11);
    expect(grid.length % 7).toBe(0);
    expect(grid[0].dayOfWeek).toBe(1); // First cell is Monday
    const nov1Cell = grid.find((c) => c.date === '2026-11-01');
    expect(nov1Cell).toBeDefined();
    expect(nov1Cell?.isCurrentMonth).toBe(true);
  });
});

describe('scheduleEngine', () => {
  const mockPoints: Record<string, WorkPoint> = {
    point_a: {
      id: 'point_a',
      name: 'Точка А',
      color: '#D9CDEB',
      isActive: true,
      order: 1
    },
    point_b: {
      id: 'point_b',
      name: 'Точка Б',
      color: '#D4DFCC',
      isActive: true,
      order: 2
    },
    point_c: {
      id: 'point_c',
      name: 'Точка В',
      color: '#EBCDD0',
      isActive: true,
      order: 3
    }
  };

  const default2x2Config: ScheduleConfig = {
    baseStartDate: '2026-11-01',
    baseCycle: [
      { pointId: 'point_a', durationDays: 2 },
      { pointId: 'point_b', durationDays: 2 }
    ],
    epochs: []
  };

  it('resolves cycle point id directly for any date and cycle', () => {
    const cycle = [
      { pointId: 'point_a', durationDays: 2 },
      { pointId: 'point_b', durationDays: 2 }
    ];
    expect(resolveCyclePointId('2026-11-01', '2026-11-01', cycle)).toBe('point_a');
    expect(resolveCyclePointId('2026-11-03', '2026-11-01', cycle)).toBe('point_b');
  });

  it('calculates 2 days Point A, 2 days Point B starting from 2026-11-01', () => {
    expect(getScheduledPointForDate('2026-11-01', default2x2Config, mockPoints)?.id).toBe('point_a');
    expect(getScheduledPointForDate('2026-11-02', default2x2Config, mockPoints)?.id).toBe('point_a');
    expect(getScheduledPointForDate('2026-11-03', default2x2Config, mockPoints)?.id).toBe('point_b');
    expect(getScheduledPointForDate('2026-11-04', default2x2Config, mockPoints)?.id).toBe('point_b');
    expect(getScheduledPointForDate('2026-11-05', default2x2Config, mockPoints)?.id).toBe('point_a');
    expect(getScheduledPointForDate('2026-11-06', default2x2Config, mockPoints)?.id).toBe('point_a');
  });

  it('cycles continuously across month boundaries', () => {
    // 2026-11 has 30 days.
    // 30 days from 01.11 is 01.12 (dayDiff = 30).
    // 30 % 4 = 2.
    // offset 0: point_a (days 0, 1)
    // offset 2: point_b (days 2, 3)
    // So 2026-11-30 is day 29 -> 29 % 4 = 1 -> point_a
    // 2026-12-01 is day 30 -> 30 % 4 = 2 -> point_b
    expect(getScheduledPointForDate('2026-11-30', default2x2Config, mockPoints)?.id).toBe('point_a');
    expect(getScheduledPointForDate('2026-12-01', default2x2Config, mockPoints)?.id).toBe('point_b');
    expect(getScheduledPointForDate('2026-12-02', default2x2Config, mockPoints)?.id).toBe('point_b');
    expect(getScheduledPointForDate('2026-12-03', default2x2Config, mockPoints)?.id).toBe('point_a');
  });

  it('supports arbitrary multi-point cycles (e.g. A 2d, B 2d, C 1d = 5 day cycle)', () => {
    const cycle3: ScheduleConfig = {
      baseStartDate: '2026-11-01',
      baseCycle: [
        { pointId: 'point_a', durationDays: 2 },
        { pointId: 'point_b', durationDays: 2 },
        { pointId: 'point_c', durationDays: 1 }
      ],
      epochs: []
    };

    expect(getScheduledPointForDate('2026-11-01', cycle3, mockPoints)?.id).toBe('point_a');
    expect(getScheduledPointForDate('2026-11-02', cycle3, mockPoints)?.id).toBe('point_a');
    expect(getScheduledPointForDate('2026-11-03', cycle3, mockPoints)?.id).toBe('point_b');
    expect(getScheduledPointForDate('2026-11-04', cycle3, mockPoints)?.id).toBe('point_b');
    expect(getScheduledPointForDate('2026-11-05', cycle3, mockPoints)?.id).toBe('point_c');
    expect(getScheduledPointForDate('2026-11-06', cycle3, mockPoints)?.id).toBe('point_a');
  });

  it('handles Option A (single day override) without affecting subsequent days', () => {
    const overrides: Record<string, DayOverride> = {
      '2026-11-02': {
        date: '2026-11-02',
        pointId: 'point_b',
        status: 'work',
        updatedAt: new Date().toISOString()
      }
    };

    // Day 01: untouched A
    const day1 = resolveDayInfo('2026-11-01', 11, default2x2Config, mockPoints, overrides, {});
    expect(day1.actualPoint?.id).toBe('point_a');

    // Day 02: overridden to B
    const day2 = resolveDayInfo('2026-11-02', 11, default2x2Config, mockPoints, overrides, {});
    expect(day2.actualPoint?.id).toBe('point_b');

    // Day 03: untouched B (as normal schedule)
    const day3 = resolveDayInfo('2026-11-03', 11, default2x2Config, mockPoints, overrides, {});
    expect(day3.actualPoint?.id).toBe('point_b');

    // Day 04: untouched B
    const day4 = resolveDayInfo('2026-11-04', 11, default2x2Config, mockPoints, overrides, {});
    expect(day4.actualPoint?.id).toBe('point_b');

    // Day 05: untouched A
    const day5 = resolveDayInfo('2026-11-05', 11, default2x2Config, mockPoints, overrides, {});
    expect(day5.actualPoint?.id).toBe('point_a');
  });

  it('handles Option B (timeline epoch change starting from a date)', () => {
    // User changes sequence starting on 2026-11-10 to start with Point B first:
    const configWithEpoch: ScheduleConfig = {
      baseStartDate: '2026-11-01',
      baseCycle: [
        { pointId: 'point_a', durationDays: 2 },
        { pointId: 'point_b', durationDays: 2 }
      ],
      epochs: [
        {
          id: 'epoch_1',
          startDate: '2026-11-10',
          cycle: [
            { pointId: 'point_b', durationDays: 2 },
            { pointId: 'point_a', durationDays: 2 }
          ],
          createdAt: new Date().toISOString()
        }
      ]
    };

    // Days before 10 Nov follow base cycle
    expect(getScheduledPointForDate('2026-11-01', configWithEpoch, mockPoints)?.id).toBe('point_a');
    expect(getScheduledPointForDate('2026-11-02', configWithEpoch, mockPoints)?.id).toBe('point_a');

    // Days on and after 10 Nov follow epoch: 10 Nov is Point B
    expect(getScheduledPointForDate('2026-11-10', configWithEpoch, mockPoints)?.id).toBe('point_b');
    expect(getScheduledPointForDate('2026-11-11', configWithEpoch, mockPoints)?.id).toBe('point_b');
    expect(getScheduledPointForDate('2026-11-12', configWithEpoch, mockPoints)?.id).toBe('point_a');
    expect(getScheduledPointForDate('2026-11-13', configWithEpoch, mockPoints)?.id).toBe('point_a');
  });

  it('handles Shift Swap (подмена) with original and actual points retained', () => {
    const overrides: Record<string, DayOverride> = {
      '2026-11-01': {
        date: '2026-11-01',
        pointId: 'point_b',
        status: 'work',
        isSwap: true,
        originalPointId: 'point_a',
        note: 'Подменил коллегу на Точке Б',
        updatedAt: new Date().toISOString()
      }
    };

    const res = resolveDayInfo('2026-11-01', 11, default2x2Config, mockPoints, overrides, {});
    expect(res.isSwap).toBe(true);
    expect(res.actualPoint?.id).toBe('point_b');
    expect(res.originalPoint?.id).toBe('point_a');
    expect(res.note).toBe('Подменил коллегу на Точке Б');
  });

  it('calculates monthly statistics accurately', () => {
    const overrides: Record<string, DayOverride> = {
      '2026-11-05': {
        date: '2026-11-05',
        status: 'day_off',
        updatedAt: new Date().toISOString()
      },
      '2026-11-08': {
        date: '2026-11-08',
        pointId: 'point_a',
        status: 'work',
        isSwap: true,
        originalPointId: 'point_b',
        updatedAt: new Date().toISOString()
      }
    };

    const stats = calculateMonthStatistics(2026, 11, default2x2Config, mockPoints, overrides, {});
    expect(stats.totalDays).toBe(30);
    expect(stats.workingDays).toBe(29);
    expect(stats.dayOffs).toBe(1);
    expect(stats.swapsCount).toBe(1);
    expect(stats.shiftsByPoint['point_a'].count + stats.shiftsByPoint['point_b'].count).toBe(29);
  });
});
