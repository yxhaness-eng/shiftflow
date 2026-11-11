import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { DayEditor } from './DayEditor';
import { AppProvider } from '../../context/AppContext';

// Let's inspect what getDayInfo returns for '2026-11-05'
import { resolveDayInfo } from '../../services/scheduleEngine';
import { DEFAULT_POINTS, DEFAULT_SCHEDULE_CONFIG } from '../../services/database';

describe('Day Resolution and DayEditor Render', () => {
  it('resolves day info for 2026-11-05', () => {
    const pointsMap = DEFAULT_POINTS.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    const dayInfo = resolveDayInfo('2026-11-05', 11, DEFAULT_SCHEDULE_CONFIG, pointsMap, {}, {});
    console.log('dayInfo:', dayInfo);
    expect(dayInfo).toBeDefined();
    expect(dayInfo.dayNumber).toBe(5);
    expect(dayInfo.scheduledPoint?.id).toBe('point_a');
  });
});
