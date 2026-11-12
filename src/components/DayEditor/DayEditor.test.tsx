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

    // Requirement 1: "Отметки дня (дела и настроение)" and NO mentions of intimate tracking words
    expect(screen.getByText('Отметки дня (дела и настроение)')).toBeDefined();
    expect(screen.queryByText(/intimate/i)).toBeNull();

    // Requirement 2: Unified shortcut card "Заметка и страничка ежедневника"
    expect(screen.getByText('Заметка и страничка ежедневника')).toBeDefined();
    expect(
      screen.getByText(/Оформить мысли, выбрать стикер со скрепкой или скотчем, добавить сухоцветы/i)
    ).toBeDefined();

    // Redundant separate NoteSticker shortcut should NOT exist
    expect(screen.queryByText('Стикер-заметка этого дня')).toBeNull();

    // Clicking unified card opens unified JournalPageModal
    const journalCard = screen.getByText('Заметка и страничка ежедневника').closest('.scrapbook-shortcut-card')!;
    fireEvent.click(journalCard);

    await waitFor(() => {
      // Unified format options are shown
      expect(screen.getByText('Со скрепкой')).toBeDefined();
      expect(screen.getByText('Со скотчем')).toBeDefined();
      expect(screen.getByText('Спиральный блокнот')).toBeDefined();
      expect(screen.getByText('Облачко')).toBeDefined();
      expect(screen.getByText('С бантиком')).toBeDefined();
      expect(screen.getByText('Винтажный свиток')).toBeDefined();
      expect(screen.getByText('Лаванда')).toBeDefined();
      expect(screen.getByText('Шалфей')).toBeDefined();
      expect(screen.getByText(/Приклеить в календарь/i)).toBeDefined();
    });
  });
});
