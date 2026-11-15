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
  it('renders authentic scrapbook journal sheet, sticker options, and textarea', () => {
    const handleClose = vi.fn();

    render(
      <AppProvider>
        <JournalPageModal date="2026-11-18" onClose={handleClose} />
      </AppProvider>
    );

    expect(screen.getByText(/Заметка дня/i)).toBeDefined();
    expect(screen.getByText('Выбери вид стикера для окошка:')).toBeDefined();
    expect(screen.getByText('Со скрепкой')).toBeDefined();
    expect(screen.getByText('Со скотчем')).toBeDefined();
    expect(screen.getByText('Блокнот')).toBeDefined();
    expect(screen.getByText('Облачко')).toBeDefined();
    expect(screen.getByText('С бантиком')).toBeDefined();
    expect(screen.getByText('Ярлычок')).toBeDefined();
    expect(screen.getByText('Тёмный крафт')).toBeDefined();

    expect(screen.getByPlaceholderText(/Заголовок странички или мысли/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Напиши сюда заметку, мысль или секретик/i)).toBeDefined();
    expect(screen.getByText(/Приклеить в окошко/i)).toBeDefined();

    // Verify paperclip SVG has explicit width and height constraints
    const clipSvg = document.querySelector('.sheet-clip-svg');
    expect(clipSvg).not.toBeNull();
    expect(clipSvg?.getAttribute('width')).toBe('22');
    expect(clipSvg?.getAttribute('height')).toBe('44');
  });

  it('allows writing title, notes, choosing sticker style and saving', async () => {
    const handleClose = vi.fn();

    render(
      <AppProvider>
        <JournalPageModal date="2026-11-19" onClose={handleClose} />
      </AppProvider>
    );

    const titleInput = screen.getByPlaceholderText(/Заголовок странички или мысли/i);
    fireEvent.change(titleInput, { target: { value: 'Мой тёплый ноябрь' } });

    const contentInput = screen.getByPlaceholderText(/Напиши сюда заметку, мысль или секретик/i);
    fireEvent.change(contentInput, { target: { value: 'Сегодня пила латте и гуляла по парку.' } });

    const tapeBtn = screen.getByText('Со скотчем');
    fireEvent.click(tapeBtn);

    const saveBtn = screen.getByText(/Приклеить в окошко/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('renders illustrated mini-sticker preview icons and custom carved/scalloped border styling for all sticker types', () => {
    const handleClose = vi.fn();

    render(
      <AppProvider>
        <JournalPageModal date="2026-11-20" onClose={handleClose} />
      </AppProvider>
    );

    // 1. Selector buttons display illustrated mini-sticker preview icons
    expect(document.querySelector('.style-icon-paper-clip')).not.toBeNull();
    expect(document.querySelector('.style-icon-washi-tape')).not.toBeNull();
    expect(document.querySelector('.style-icon-spiral-pad')).not.toBeNull();
    expect(document.querySelector('.style-icon-cloud')).not.toBeNull();
    expect(document.querySelector('.style-icon-ribbon-card')).not.toBeNull();
    expect(document.querySelector('.style-icon-tag')).not.toBeNull();
    expect(document.querySelector('.style-icon-dark-craft')).not.toBeNull();

    // 2. Both action buttons are present at bottom
    expect(screen.getByText('Убрать стикер')).toBeDefined();
    expect(screen.getByText('Приклеить в окошко')).toBeDefined();

    // 3. Test 'cloud' scalloped edges
    fireEvent.click(screen.getByText('Облачко'));
    expect(document.querySelector('.journal-sheet-paper.style-cloud')).not.toBeNull();
    expect(document.querySelector('.sheet-cloud-scallops')).not.toBeNull();
    expect(document.querySelector('.scallop-top')).not.toBeNull();
    expect(document.querySelector('.scallop-bottom')).not.toBeNull();

    // 4. Test 'spiral-pad' rings & holes
    fireEvent.click(screen.getByText('Блокнот'));
    expect(document.querySelector('.journal-sheet-paper.style-spiral-pad')).not.toBeNull();
    expect(document.querySelector('.sheet-spiral-binder-decor')).not.toBeNull();
    expect(document.querySelector('.sheet-spiral-rings')).not.toBeNull();

    // 5. Test 'ribbon-card' bow decor
    fireEvent.click(screen.getByText('С бантиком'));
    expect(document.querySelector('.journal-sheet-paper.style-ribbon-card')).not.toBeNull();
    expect(document.querySelector('.sheet-ribbon-decor')).not.toBeNull();
    expect(document.querySelector('.sheet-ribbon-svg')).not.toBeNull();

    // 6. Test 'tag' angled corners & eyelet
    fireEvent.click(screen.getByText('Ярлычок'));
    expect(document.querySelector('.journal-sheet-paper.style-tag')).not.toBeNull();
    expect(document.querySelector('.sheet-tag-decor')).not.toBeNull();
    expect(document.querySelector('.tag-eyelet-reinforcer')).not.toBeNull();

    // 7. Test 'dark-craft'
    fireEvent.click(screen.getByText('Тёмный крафт'));
    expect(document.querySelector('.journal-sheet-paper.style-dark-craft')).not.toBeNull();
    expect(document.querySelector('.washi-craft')).not.toBeNull();

    // 8. Test close button inside sheet
    const closeBtn = document.querySelector('.note-sheet-close-btn');
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn!);
    expect(handleClose).toHaveBeenCalled();
  });
});
