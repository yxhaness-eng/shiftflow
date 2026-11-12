// @vitest-environment jsdom
import React, { useEffect } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { DayEditor } from './DayEditor';
import { AppProvider, useApp } from '../../context/AppContext';
import { resolveDayInfo } from '../../services/scheduleEngine';
import { DEFAULT_POINTS, DEFAULT_SCHEDULE_CONFIG } from '../../services/database';
import 'fake-indexeddb/auto';

afterEach(() => {
  cleanup();
});

const DayEditorTestWrapper: React.FC<{ targetDate?: string }> = ({ targetDate = '2026-11-05' }) => {
  const { setSelectedDate } = useApp();
  useEffect(() => {
    setSelectedDate(targetDate);
  }, [setSelectedDate, targetDate]);

  return <DayEditor />;
};

describe('Day Resolution and DayEditor Render', () => {
  it('resolves day info for 2026-11-05', () => {
    const pointsMap = DEFAULT_POINTS.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    const dayInfo = resolveDayInfo('2026-11-05', 11, DEFAULT_SCHEDULE_CONFIG, pointsMap, {}, {});
    expect(dayInfo).toBeDefined();
    expect(dayInfo.dayNumber).toBe(5);
    expect(dayInfo.scheduledPoint?.id).toBe('point_a');
  });

  it('renders DayEditor without any mentions of intimate words and with unified journal card', async () => {
    render(
      <AppProvider>
        <DayEditorTestWrapper targetDate="2026-11-15" />
      </AppProvider>
    );

    // Wait for DayEditor sheet to appear
    await waitFor(() => {
      expect(screen.getByText('15 ноября 2026, воскресенье')).toBeDefined();
    });

    // Requirement 1: "Отметки дня" and NO mentions of intimate tracking words
    expect(screen.getAllByText(/Отметки дня/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/секас/i)).toBeNull();
    expect(screen.queryByText(/intimate/i)).toBeNull();

    // Requirement 2: Unified shortcut card "Заметка и страничка ежедневника"
    expect(screen.getByText('Заметка и страничка ежедневника')).toBeDefined();
    expect(
      screen.getByText(/Оформить мысли, выбрать стикер со скрепкой или скотчем/i)
    ).toBeDefined();

    // Clicking unified card opens JournalPageModal
    const journalCard = screen.getByText('Заметка и страничка ежедневника').closest('.scrapbook-shortcut-card')!;
    fireEvent.click(journalCard);

    await waitFor(() => {
      expect(screen.getByText('Со скрепкой')).toBeDefined();
      expect(screen.getByText('Со скотчем')).toBeDefined();
      expect(screen.getByText('Блокнот')).toBeDefined();
      expect(screen.getByText('Облачко')).toBeDefined();
      expect(screen.getByText('С бантиком')).toBeDefined();
      expect(screen.getByText('Ярлычок')).toBeDefined();
      expect(screen.getByText('Тёмный крафт')).toBeDefined();
      expect(screen.getByText(/Приклеить в окошко/i)).toBeDefined();
    });
  });
});
