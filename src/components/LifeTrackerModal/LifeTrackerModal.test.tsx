// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { LifeTrackerModal } from './LifeTrackerModal';
import { AppProvider } from '../../context/AppContext';
import 'fake-indexeddb/auto';

afterEach(() => {
  cleanup();
});

// Mock matchMedia and scrollTo
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

describe('LifeTrackerModal component', () => {
  it('renders modal with date header, activity chips and does not contain intimate sections', async () => {
    const handleClose = vi.fn();
    const handleOpenNote = vi.fn();
    const handleOpenZoom = vi.fn();

    render(
      <AppProvider>
        <LifeTrackerModal
          date="2026-11-15"
          onClose={handleClose}
          onOpenNoteSticker={handleOpenNote}
          onOpenZoomCanvas={handleOpenZoom}
        />
      </AppProvider>
    );

    // Date header
    expect(screen.getByText(/15 ноября 2026/i)).toBeDefined();
    expect(screen.getByText(/Настрой отметки этого окошка/i)).toBeDefined();

    // Verify intimate tracking is completely removed
    expect(screen.queryByText(/КАКОЙ БЫЛ/i)).toBeNull();
    expect(screen.queryByText(/intimate/i)).toBeNull();

    // Check enriched activities matching Photo 4
    expect(screen.getByText(/Свидание \/ Вино/i)).toBeDefined();
    expect(screen.getByText(/Эти дни/i)).toBeDefined();
    expect(screen.getByText(/Нежность \/ Любовь/i)).toBeDefined();
    expect(screen.getByText(/Тренировка/i)).toBeDefined();
    expect(screen.getByText(/Супер день/i)).toBeDefined();
    expect(screen.getByText(/Вкусняшки/i)).toBeDefined();
    expect(screen.getByText(/Кино \/ Сериал/i)).toBeDefined();

    // Check bottom actions
    expect(screen.getByText(/Оформить стикер-заметку этого дня/i)).toBeDefined();
  });

  it('allows multi-selecting multiple activities', async () => {
    render(
      <AppProvider>
        <LifeTrackerModal
          date="2026-11-17"
          onClose={vi.fn()}
          onOpenNoteSticker={vi.fn()}
          onOpenZoomCanvas={vi.fn()}
        />
      </AppProvider>
    );

    const treatsBtn = screen.getByText('Вкусняшки').closest('button')!;
    const movieBtn = screen.getByText('Кино / Сериал').closest('button')!;

    fireEvent.click(treatsBtn);
    await waitFor(() => {
      expect(treatsBtn.classList.contains('active')).toBe(true);
    });

    fireEvent.click(movieBtn);
    await waitFor(() => {
      expect(movieBtn.classList.contains('active')).toBe(true);
    });
  });

  it('allows adding a custom activity tag', async () => {
    render(
      <AppProvider>
        <LifeTrackerModal
          date="2026-11-18"
          onClose={vi.fn()}
          onOpenNoteSticker={vi.fn()}
          onOpenZoomCanvas={vi.fn()}
        />
      </AppProvider>
    );

    const addCustomBtn = screen.getByText('+ Своя метка');
    fireEvent.click(addCustomBtn);

    const input = screen.getByPlaceholderText(/Например: Поездка к маме/i);
    fireEvent.change(input, { target: { value: 'Концерт рок-группы' } });

    const saveBtn = screen.getByText('Добавить');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Например: Поездка к маме/i)).toBeNull();
      expect(screen.getByText('Концерт рок-группы')).toBeDefined();
    });
  });
});
