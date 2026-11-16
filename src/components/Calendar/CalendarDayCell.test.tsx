// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CalendarDayCell } from './CalendarDayCell';
import { ResolvedDayInfo } from '../../types';

describe('CalendarDayCell component', () => {
  const baseDayInfo: ResolvedDayInfo = {
    date: '2026-11-11',
    isCurrentMonth: true,
    isToday: false,
    dayNumber: 11,
    dayOfWeek: 3,
    scheduledPoint: null,
    actualPoint: null,
    status: 'day_off',
    isSwap: false,
    originalPoint: null,
    stickers: []
  };

  it('renders authentic mini paper sticker with paper clip for note without raw text preview', () => {
    const dayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      note: 'Бубубуб'
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfo} onClick={vi.fn()} />
    );

    // Mini note sticker card rendered
    const card = container.querySelector('.cell-mini-note-card');
    expect(card).toBeDefined();
    expect(card?.classList.contains('style-paper-clip')).toBe(true);

    // Paperclip svg decor rendered
    const clip = container.querySelector('.mini-note-clip-decor');
    expect(clip).toBeDefined();

    // Raw note text is NOT displayed directly in cell surface
    expect(screen.queryByText('Бубубуб')).toBeNull();

    // Tooltip contains full note text
    expect(card?.getAttribute('title')).toBe('Бубубуб');

    // Realistic ruled lines decor is rendered
    expect(container.querySelector('.mini-note-ruled-lines')).toBeDefined();
  });

  it('renders washi tape decor when noteSticker has washi-tape style without raw text preview', () => {
    const dayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      noteSticker: {
        style: 'washi-tape',
        text: 'План на день',
        x: 0,
        y: 0,
        rotation: -2
      }
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfo} onClick={vi.fn()} />
    );

    const card = container.querySelector('.cell-mini-note-card.style-washi-tape');
    expect(card).toBeDefined();

    const washiLeft = container.querySelector('.mini-note-washi.washi-top-left');
    const washiRight = container.querySelector('.mini-note-washi.washi-top-right');
    expect(washiLeft).toBeDefined();
    expect(washiRight).toBeDefined();

    // Raw note text is NOT rendered in cell
    expect(screen.queryByText('План на день')).toBeNull();
    // Tooltip contains note text
    expect(card?.getAttribute('title')).toBe('План на день');
  });

  it('renders dark-craft note sticker with tape strip for journal page without raw text preview', () => {
    const dayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      journalPage: {
        paperType: 'kraft',
        title: 'Заголовок крафт',
        content: 'Дневниковая запись',
        decorations: []
      }
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfo} onClick={vi.fn()} />
    );

    const card = container.querySelector('.cell-mini-note-card.style-dark-craft');
    expect(card).toBeDefined();

    const washiStrip = container.querySelector('.mini-note-washi.washi-craft-strip');
    expect(washiStrip).toBeDefined();

    // Raw title text is NOT rendered in cell
    expect(screen.queryByText('Заголовок крафт')).toBeNull();
    // Tooltip contains title text
    expect(card?.getAttribute('title')).toBe('Заголовок крафт');
  });

  it('does NOT render any intimate badge in the cell header even if intimate data is present in legacy store', () => {
    const dayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      intimate: {
        hadSex: true,
        type: 'passionate'
      }
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfo} onClick={vi.fn()} />
    );

    // Intimate badge must NOT exist
    const intimateBadge = container.querySelector('.cell-intimate-mini-badge');
    expect(intimateBadge).toBeNull();
    expect(screen.queryByText(/интим/i)).toBeNull();
  });

  it('renders enriched activity icons properly', () => {
    const dayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      activities: ['date', 'workout', 'period']
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfo} onClick={vi.fn()} />
    );

    const activitiesRow = container.querySelector('.cell-activities-row');
    expect(activitiesRow).toBeDefined();
    const imgs = activitiesRow?.querySelectorAll('img');
    expect(imgs?.length).toBe(3);
  });

  it('renders shift pill with contrast text and day number in cell header', () => {
    const dayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      status: 'work',
      actualPoint: {
        id: 'point_a',
        name: 'Точка А',
        color: '#D9CDEB',
        textColor: '#4A3E59',
        isActive: true,
        order: 1
      }
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfo} onClick={vi.fn()} />
    );

    const cell = container.querySelector('.calendar-cell');
    expect(cell).toBeDefined();
    expect(container.querySelector('.day-number')?.textContent?.trim()).toBe('11');
    const pill = container.querySelector('.shift-pill');
    expect(pill).toBeDefined();
    expect(pill?.textContent).toContain('Точка А');
    expect((pill as HTMLElement)?.style.backgroundColor).toBe('rgb(217, 205, 235)');
    expect((pill as HTMLElement)?.style.color).toBe('rgb(74, 62, 89)');
  });

  it('marks today cell and other-month cell with appropriate classes', () => {
    const todayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      isToday: true,
      isCurrentMonth: false
    };

    const { container } = render(
      <CalendarDayCell dayInfo={todayInfo} onClick={vi.fn()} />
    );

    const cell = container.querySelector('.calendar-cell');
    expect(cell?.classList.contains('is-today')).toBe(true);
    expect(cell?.classList.contains('other-month')).toBe(true);
    expect(container.querySelector('.day-number.today-badge')).toBeDefined();
  });

  it('ignores markerPositions and strictly renders automatic flex row without custom-placed absolute styling', () => {
    const dayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      note: 'План на день',
      activities: ['date', 'workout'],
      markerPositions: {
        note: { x: -45, y: -20, scale: 1.5 },
        date: { x: 30, y: 15, scale: 0.8 },
        workout: { x: -10, y: 35, scale: 1.1 }
      }
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfo} onClick={vi.fn()} />
    );

    // Note card is rendered in normal flex flow with with-activities class
    const noteCard = container.querySelector('.cell-mini-note-card');
    expect(noteCard).toBeDefined();
    expect(noteCard?.classList.contains('with-activities')).toBe(true);
    expect((noteCard as HTMLElement)?.style.position).not.toBe('absolute');

    // Activities are rendered in cell-activities-row, NOT with custom-placed
    const activitiesRow = container.querySelector('.cell-activities-row');
    expect(activitiesRow).toBeDefined();
    expect(container.querySelector('.custom-placed')).toBeNull();
  });

  it('renders note sticker in cell-header next to day number, keeping center area clean', () => {
    const dayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      note: 'Секретик',
      activities: ['workout', 'date']
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfo} onClick={vi.fn()} />
    );

    const cellHeader = container.querySelector('.cell-header');
    expect(cellHeader).not.toBeNull();

    // Both day number and note sticker card are inside cell-header
    const dayNumberSpan = cellHeader?.querySelector('.day-number');
    const noteCard = cellHeader?.querySelector('.cell-mini-note-card');
    expect(dayNumberSpan).not.toBeNull();
    expect(noteCard).not.toBeNull();

    // Center area (cell-stickers-container) holds activities, not noteCard
    const centerArea = container.querySelector('.cell-stickers-container');
    expect(centerArea?.querySelector('.cell-mini-note-card')).toBeNull();
    expect(centerArea?.querySelector('.cell-activities-row')).not.toBeNull();
  });

  it('supports new note sticker styles: pushpin, washi-corner, torn-edge, clean-note', () => {
    const dayInfoPushpin: ResolvedDayInfo = {
      ...baseDayInfo,
      noteSticker: {
        style: 'pushpin',
        text: 'Пин',
        x: 0,
        y: 0
      }
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfoPushpin} onClick={vi.fn()} />
    );

    const card = container.querySelector('.cell-mini-note-card.style-pushpin');
    expect(card).not.toBeNull();
    expect(container.querySelector('.mini-note-pin-decor')).not.toBeNull();
  });
});
