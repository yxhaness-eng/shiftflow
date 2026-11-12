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
  it('renders modal with date header, intimate card and activity chips', async () => {
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

    // Check "Отметка «Секас был»"
    expect(screen.getByText(/Отметка «Секас был»/i)).toBeDefined();

    // Check intimate types
    expect(screen.getByText('Страстный')).toBeDefined();
    expect(screen.getByText('Нежный')).toBeDefined();
    expect(screen.getByText('Быстрый')).toBeDefined();

    // Check activities
    expect(screen.getByText('Свидание')).toBeDefined();
    expect(screen.getByText('Вкусняшки')).toBeDefined();
    expect(screen.getByText('Супер день')).toBeDefined();

    // Check bottom actions
    expect(screen.getByText(/Изменить стикер-заметку этого дня/i)).toBeDefined();
  });

  it('toggles intimate state and selects a type', async () => {
    render(
      <AppProvider>
        <LifeTrackerModal
          date="2026-11-16"
          onClose={vi.fn()}
          onOpenNoteSticker={vi.fn()}
          onOpenZoomCanvas={vi.fn()}
        />
      </AppProvider>
    );

    // Click "Отметка «Секас был»" card
    const sexCard = screen.getByText(/Отметка «Секас был»/i);
    fireEvent.click(sexCard);

    await waitFor(() => {
      expect(screen.getByText(/Был 💕/i)).toBeDefined();
    });

    // Now selecting "Романтич..."
    const romanticBtn = screen.getByText('Романтич...');
    fireEvent.click(romanticBtn);

    await waitFor(() => {
      expect(romanticBtn.closest('button')?.classList.contains('active')).toBe(true);
    });
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
});
