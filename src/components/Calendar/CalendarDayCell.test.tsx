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

  it('renders authentic mini paper sticker with paper clip for note', () => {
    const dayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      note: 'Бубубуб'
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfo} onClick={vi.fn()} />
    );

    // Mini note card rendered
    const card = container.querySelector('.cell-mini-note-card');
    expect(card).toBeDefined();
    expect(card?.classList.contains('style-paper-clip')).toBe(true);

    // Paperclip svg decor rendered
    const clip = container.querySelector('.mini-note-clip-decor');
    expect(clip).toBeDefined();

    // Note preview text rendered
    expect(screen.getByText('Бубубуб')).toBeDefined();
  });

  it('renders washi tape decor when noteSticker has washi-tape style', () => {
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
    expect(screen.getByText('План на день')).toBeDefined();
  });

  it('renders dark-craft note sticker with tape strip for journal page', () => {
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
    expect(screen.getByText('Заголовок крафт')).toBeDefined();
  });

  it('does NOT render any intimate / "секас" badge in the cell header even if intimate data is present in legacy store', () => {
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
    expect(screen.queryByText(/секас/i)).toBeNull();
  });

  it('renders enriched activity icons properly', () => {
    const dayInfo: ResolvedDayInfo = {
      ...baseDayInfo,
      activities: ['date', 'energy', 'cozy_evening']
    };

    const { container } = render(
      <CalendarDayCell dayInfo={dayInfo} onClick={vi.fn()} />
    );

    const activitiesRow = container.querySelector('.cell-activities-row');
    expect(activitiesRow).toBeDefined();
    expect(screen.getByText('🔥')).toBeDefined();
    expect(screen.getByText('🧸')).toBeDefined();
  });
});
