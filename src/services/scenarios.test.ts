import { describe, it, expect } from 'vitest';
import {
  getScheduledPointForDate,
  resolveDayInfo,
  calculateMonthStatistics
} from './scheduleEngine';
import {
  ScheduleConfig,
  WorkPoint,
  DayOverride,
  PlacedSticker,
  BackupData
} from '../types';
import { validateBackupData, DEFAULT_SETTINGS } from './database';

describe('ShiftFlow Real-World User Scenarios', () => {
  const pointsMap: Record<string, WorkPoint> = {
    point_a: {
      id: 'point_a',
      name: 'Точка А',
      color: '#D9CDEB',
      textColor: '#4A3E59',
      isActive: true,
      order: 1,
      startTime: '10:00',
      endTime: '22:00'
    },
    point_b: {
      id: 'point_b',
      name: 'Точка Б',
      color: '#D4DFCC',
      textColor: '#3F4D38',
      isActive: true,
      order: 2,
      startTime: '10:00',
      endTime: '22:00'
    },
    point_c: {
      id: 'point_c',
      name: 'Точка В',
      color: '#EBCDD0',
      textColor: '#59393C',
      isActive: true,
      order: 3
    }
  };

  const initialScheduleConfig: ScheduleConfig = {
    baseStartDate: '2026-11-01',
    baseCycle: [
      { pointId: 'point_a', durationDays: 2 },
      { pointId: 'point_b', durationDays: 2 }
    ],
    epochs: []
  };

  it('Scenario 1: User starts with 2 days Point A, 2 days Point B daily 7/0', () => {
    // 1 Nov -> A, 2 Nov -> A
    expect(getScheduledPointForDate('2026-11-01', initialScheduleConfig, pointsMap)?.name).toBe('Точка А');
    expect(getScheduledPointForDate('2026-11-02', initialScheduleConfig, pointsMap)?.name).toBe('Точка А');

    // 3 Nov -> B, 4 Nov -> B
    expect(getScheduledPointForDate('2026-11-03', initialScheduleConfig, pointsMap)?.name).toBe('Точка Б');
    expect(getScheduledPointForDate('2026-11-04', initialScheduleConfig, pointsMap)?.name).toBe('Точка Б');

    // 5 Nov -> A, 6 Nov -> A
    expect(getScheduledPointForDate('2026-11-05', initialScheduleConfig, pointsMap)?.name).toBe('Точка А');
    expect(getScheduledPointForDate('2026-11-06', initialScheduleConfig, pointsMap)?.name).toBe('Точка А');
  });

  it('Scenario 2: Option A — Changing only single day does not shift subsequent days', () => {
    const overrides: Record<string, DayOverride> = {
      '2026-11-02': {
        date: '2026-11-02',
        pointId: 'point_b',
        status: 'work',
        note: 'Разово вышел на Точку Б вместо А',
        updatedAt: '2026-11-02T08:00:00Z'
      }
    };

    const day1 = resolveDayInfo('2026-11-01', 11, initialScheduleConfig, pointsMap, overrides, {});
    const day2 = resolveDayInfo('2026-11-02', 11, initialScheduleConfig, pointsMap, overrides, {});
    const day3 = resolveDayInfo('2026-11-03', 11, initialScheduleConfig, pointsMap, overrides, {});
    const day4 = resolveDayInfo('2026-11-04', 11, initialScheduleConfig, pointsMap, overrides, {});

    // Day 1 is still Point A
    expect(day1.actualPoint?.id).toBe('point_a');
    // Day 2 is changed to Point B
    expect(day2.actualPoint?.id).toBe('point_b');
    expect(day2.note).toBe('Разово вышел на Точку Б вместо А');
    // Day 3 and 4 remain normal schedule (Point B)
    expect(day3.actualPoint?.id).toBe('point_b');
    expect(day4.actualPoint?.id).toBe('point_b');
    // Day 5 returns to Point A
    const day5 = resolveDayInfo('2026-11-05', 11, initialScheduleConfig, pointsMap, overrides, {});
    expect(day5.actualPoint?.id).toBe('point_a');
  });

  it('Scenario 3: Option B — Changing this day and subsequent cycle branches timeline', () => {
    // Starting on 2026-11-10, user changes cycle so Point B goes first
    const updatedConfig: ScheduleConfig = {
      ...initialScheduleConfig,
      epochs: [
        {
          id: 'epoch_nov10',
          startDate: '2026-11-10',
          cycle: [
            { pointId: 'point_b', durationDays: 2 },
            { pointId: 'point_a', durationDays: 2 }
          ],
          createdAt: '2026-11-10T10:00:00Z'
        }
      ]
    };

    // Before Nov 10: base cycle applies
    // 01.11 -> A, 02.11 -> A, 03.11 -> B, 04.11 -> B, 05.11 -> A, 06.11 -> A, 07.11 -> B, 08.11 -> B, 09.11 -> A
    expect(getScheduledPointForDate('2026-11-09', updatedConfig, pointsMap)?.id).toBe('point_a');

    // On and after Nov 10: new epoch starts with Point B
    expect(getScheduledPointForDate('2026-11-10', updatedConfig, pointsMap)?.id).toBe('point_b');
    expect(getScheduledPointForDate('2026-11-11', updatedConfig, pointsMap)?.id).toBe('point_b');
    expect(getScheduledPointForDate('2026-11-12', updatedConfig, pointsMap)?.id).toBe('point_a');
    expect(getScheduledPointForDate('2026-11-13', updatedConfig, pointsMap)?.id).toBe('point_a');
    expect(getScheduledPointForDate('2026-11-14', updatedConfig, pointsMap)?.id).toBe('point_b');
  });

  it('Scenario 4: Shift swap (Подмена) preserves original & actual points and increments swap counter', () => {
    const overrides: Record<string, DayOverride> = {
      '2026-11-07': {
        date: '2026-11-07',
        pointId: 'point_a',
        status: 'work',
        isSwap: true,
        originalPointId: 'point_b',
        note: 'Подменил коллегу',
        updatedAt: '2026-11-07T09:00:00Z'
      }
    };

    const day7 = resolveDayInfo('2026-11-07', 11, initialScheduleConfig, pointsMap, overrides, {});
    expect(day7.isSwap).toBe(true);
    expect(day7.actualPoint?.id).toBe('point_a');
    expect(day7.originalPoint?.id).toBe('point_b');
    expect(day7.note).toBe('Подменил коллегу');

    // Stats
    const stats = calculateMonthStatistics(2026, 11, initialScheduleConfig, pointsMap, overrides, {});
    expect(stats.swapsCount).toBe(1);
  });

  it('Scenario 5: Marking day off correctly updates work count and hours', () => {
    const overrides: Record<string, DayOverride> = {
      '2026-11-15': {
        date: '2026-11-15',
        status: 'day_off',
        note: 'Отгул / отдых',
        tags: ['Отдых'],
        updatedAt: '2026-11-15T09:00:00Z'
      }
    };

    const day15 = resolveDayInfo('2026-11-15', 11, initialScheduleConfig, pointsMap, overrides, {});
    expect(day15.status).toBe('day_off');
    expect(day15.actualPoint).toBeNull();
    expect(day15.note).toBe('Отгул / отдых');
    expect(day15.tags).toContain('Отдых');

    const stats = calculateMonthStatistics(2026, 11, initialScheduleConfig, pointsMap, overrides, {});
    expect(stats.workingDays).toBe(29);
    expect(stats.dayOffs).toBe(1);
  });

  it('Scenario 6: Placing stickers with coordinates and rotation', () => {
    const sticker: PlacedSticker = {
      id: 'stk_1',
      date: '2026-11-20',
      stickerId: 'cat_daily_01',
      x: 10,
      y: -5,
      scale: 1.1,
      rotation: 6,
      createdAt: '2026-11-20T10:00:00Z'
    };

    const stickersByDate: Record<string, PlacedSticker[]> = {
      '2026-11-20': [sticker]
    };

    const day20 = resolveDayInfo('2026-11-20', 11, initialScheduleConfig, pointsMap, {}, stickersByDate);
    expect(day20.stickers.length).toBe(1);
    expect(day20.stickers[0].stickerId).toBe('cat_daily_01');
    expect(day20.stickers[0].rotation).toBe(6);
  });

  it('Scenario 7: Full backup serialization and structure integrity', () => {
    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: DEFAULT_SETTINGS,
      points: Object.values(pointsMap),
      scheduleConfig: initialScheduleConfig,
      overrides: {
        '2026-11-01': {
          date: '2026-11-01',
          pointId: 'point_a',
          status: 'work',
          updatedAt: new Date().toISOString()
        }
      },
      stickers: [
        {
          id: 'stk_test',
          date: '2026-11-01',
          stickerId: 'cat_art_01',
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          createdAt: new Date().toISOString()
        }
      ],
      history: [
        {
          id: 'hist_1',
          timestamp: new Date().toISOString(),
          date: '2026-11-01',
          type: 'point_change',
          details: 'Тестовая запись'
        }
      ]
    };

    // Serialize to JSON string and parse back
    const jsonStr = JSON.stringify(backup);
    const parsed = JSON.parse(jsonStr);

    expect(validateBackupData(parsed)).toBe(true);
    expect(parsed.points.length).toBe(3);
    expect(parsed.stickers.length).toBe(1);
    expect(parsed.history.length).toBe(1);
  });
});
