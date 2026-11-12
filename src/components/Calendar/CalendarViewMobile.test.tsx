// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CalendarView } from './CalendarView';
import { AppProvider } from '../../context/AppContext';
import 'fake-indexeddb/auto';

describe('CalendarView 7-column layout on mobile', () => {
  it('renders exactly 7 weekday header columns and month grid without cutting off column 7', () => {
    const { container } = render(
      <AppProvider>
        <CalendarView />
      </AppProvider>
    );

    const weekdayGrid = container.querySelector('.weekday-header-grid');
    expect(weekdayGrid).not.toBeNull();

    const weekdayCells = container.querySelectorAll('.weekday-header-cell');
    expect(weekdayCells.length).toBe(7);

    // Verify all 7 columns from Пн to Вс are present
    const dayNames = Array.from(weekdayCells).map(c => c.textContent?.trim());
    expect(dayNames).toEqual(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);

    // Sunday (column 7) is present and has weekend class
    expect(weekdayCells[6].textContent?.trim()).toBe('Вс');
    expect(weekdayCells[6].classList.contains('weekend')).toBe(true);

    // Month grid has cells divisible by 7 (full weeks)
    const monthGrid = container.querySelector('.calendar-month-grid');
    expect(monthGrid).not.toBeNull();
    const cells = container.querySelectorAll('.calendar-cell');
    expect(cells.length % 7).toBe(0);
    expect(cells.length).toBeGreaterThanOrEqual(28);
  });
});
