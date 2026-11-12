// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { JournalPageModal } from './JournalPageModal';
import { AppProvider } from '../../context/AppContext';
import 'fake-indexeddb/auto';

afterEach(() => {
  cleanup();
});

describe('JournalPageModal component', () => {
  it('renders authentic scrapbook journal sheet, paper options, and textarea', () => {
    const handleClose = vi.fn();

    render(
      <AppProvider>
        <JournalPageModal date="2026-11-18" onClose={handleClose} />
      </AppProvider>
    );

    expect(screen.getByText(/Заметка и страничка ежедневника/i)).toBeDefined();
    expect(screen.getByText('Со скрепкой')).toBeDefined();
    expect(screen.getByText('Со скотчем')).toBeDefined();
    expect(screen.getByText('Спиральный блокнот')).toBeDefined();
    expect(screen.getByText('Облачко')).toBeDefined();
    expect(screen.getByText('С бантиком')).toBeDefined();
    expect(screen.getByText('Винтажный свиток')).toBeDefined();
    expect(screen.getByText('Лаванда')).toBeDefined();
    expect(screen.getByText('Шалфей')).toBeDefined();

    expect(screen.getByPlaceholderText(/Заголовок странички или настроение/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Напиши сюда заметку, мысль или секретик/i)).toBeDefined();
    expect(screen.getByText(/Приклеить в календарь/i)).toBeDefined();
  });

  it('allows writing title, notes, choosing paper and saving', async () => {
    const handleClose = vi.fn();

    render(
      <AppProvider>
        <JournalPageModal date="2026-11-19" onClose={handleClose} />
      </AppProvider>
    );

    const titleInput = screen.getByPlaceholderText(/Заголовок странички или настроение/i);
    fireEvent.change(titleInput, { target: { value: 'Мой тёплый ноябрь' } });

    const contentInput = screen.getByPlaceholderText(/Напиши сюда заметку, мысль или секретик/i);
    fireEvent.change(contentInput, { target: { value: 'Сегодня пила латте и гуляла по парку.' } });

    const tapeBtn = screen.getByText('Со скотчем');
    fireEvent.click(tapeBtn);

    const saveBtn = screen.getByText(/Приклеить в календарь/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('allows adding and dragging decor up to the top of the paper sheet', async () => {
    // Mock getBoundingClientRect for jsdom
    vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 400,
      top: 50,
      left: 50,
      right: 550,
      bottom: 450,
      x: 50,
      y: 50,
      toJSON: () => {}
    });

    // Mock setPointerCapture / releasePointerCapture
    window.HTMLElement.prototype.setPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();

    const handleClose = vi.fn();

    render(
      <AppProvider>
        <JournalPageModal date="2026-11-20" onClose={handleClose} />
      </AppProvider>
    );

    // Click on a sticker to add it to the sheet
    const addStickerBtn = screen.getByTitle(/Приклеить: Сушёная лаванда/i);
    fireEvent.click(addStickerBtn);

    // Wait for the placed decor to appear on the sheet
    await waitFor(() => {
      const placedDecors = document.querySelectorAll('.journal-page-placed-decor');
      expect(placedDecors.length).toBeGreaterThan(0);
    });

    const decorEl = document.querySelector('.journal-page-placed-decor') as HTMLElement;
    expect(decorEl).toBeDefined();

    // Start dragging decor upwards
    // initial position is roughly 50%, 45%
    fireEvent.pointerDown(decorEl, {
      clientX: 300,
      clientY: 230,
      pointerId: 1
    });

    // Drag pointer upwards towards the top of the sheet (deltaY = -160px on 400px height is -40%)
    fireEvent.pointerMove(decorEl, {
      clientX: 300,
      clientY: 70,
      pointerId: 1
    });

    // Release drag
    fireEvent.pointerUp(decorEl, {
      clientX: 300,
      clientY: 70,
      pointerId: 1
    });

    // Check that the style was updated with top closer to top of the paper (< 20%)
    await waitFor(() => {
      const updatedDecor = document.querySelector('.journal-page-placed-decor') as HTMLElement;
      const topStyle = updatedDecor.style.top;
      const topPercent = parseFloat(topStyle);
      expect(topPercent).toBeLessThan(25);
    });

    // Controls bar should appear for active decor
    expect(screen.getByText(/Наклейка на странице:/i)).toBeDefined();

    // Test rotate and scale
    const rotateRightBtn = screen.getByTitle('Повернуть вправо');
    fireEvent.click(rotateRightBtn);

    const zoomInBtn = screen.getByTitle('Увеличить');
    fireEvent.click(zoomInBtn);

    // Delete decor
    const deleteBtn = screen.getByTitle('Удалить со странички');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(document.querySelectorAll('.journal-page-placed-decor').length).toBe(0);
    });
  });
});
