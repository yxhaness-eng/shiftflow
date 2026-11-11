import { describe, it, expect } from 'vitest';
import { validateBackupData, DEFAULT_POINTS, DEFAULT_SCHEDULE_CONFIG, DEFAULT_SETTINGS } from './database';
import { BackupData } from '../types';

describe('database & backup validation', () => {
  it('validates a correct backup data payload', () => {
    const validBackup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: DEFAULT_SETTINGS,
      points: DEFAULT_POINTS,
      scheduleConfig: DEFAULT_SCHEDULE_CONFIG,
      overrides: {
        '2026-11-02': {
          date: '2026-11-02',
          pointId: 'point_b',
          status: 'work',
          updatedAt: new Date().toISOString()
        }
      },
      stickers: [
        {
          id: 'stk_1',
          date: '2026-11-02',
          stickerId: 'cat_art_01',
          x: 0,
          y: 0,
          scale: 1,
          rotation: 5,
          createdAt: new Date().toISOString()
        }
      ],
      history: []
    };

    expect(validateBackupData(validBackup)).toBe(true);
  });

  it('rejects invalid backup structures', () => {
    expect(validateBackupData(null)).toBe(false);
    expect(validateBackupData({})).toBe(false);
    expect(validateBackupData({ version: 'wrong' })).toBe(false);
    expect(validateBackupData({ version: 1, points: 'not-an-array' })).toBe(false);
    expect(validateBackupData({ version: 1, points: [], settings: null })).toBe(false);
  });

  it('provides complete default point structures', () => {
    expect(DEFAULT_POINTS.length).toBe(2);
    expect(DEFAULT_POINTS[0].id).toBe('point_a');
    expect(DEFAULT_POINTS[1].id).toBe('point_b');
    expect(DEFAULT_POINTS[0].color).toBe('#D9CDEB');
    expect(DEFAULT_POINTS[1].color).toBe('#D4DFCC');
  });

  it('configures default 2-day alternating cycle starting from 2026-11-01', () => {
    expect(DEFAULT_SCHEDULE_CONFIG.baseStartDate).toBe('2026-11-01');
    expect(DEFAULT_SCHEDULE_CONFIG.baseCycle).toEqual([
      { pointId: 'point_a', durationDays: 2 },
      { pointId: 'point_b', durationDays: 2 }
    ]);
  });
});

