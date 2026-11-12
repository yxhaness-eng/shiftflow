// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { ScrapbookCellZoom } from './ScrapbookCellZoom';
import { AppProvider } from '../../context/AppContext';
import 'fake-indexeddb/auto';

afterEach(() => {
  cleanup();
});

describe('ScrapbookCellZoom component', () => {
  it('renders enlarged canvas, header and quick toolbar', () => {
    const handleClose = vi.fn();
    const handleOpenLife = vi.fn();
    const handleOpenNote = vi.fn();

    render(
      <AppProvider>
        <ScrapbookCellZoom
          date="2026-11-15"
          onClose={handleClose}
          onOpenLifeTracker={handleOpenLife}
          onOpenNoteSticker={handleOpenNote}
        />
      </AppProvider>
    );

    expect(screen.getByText(/Оформление окошка/i)).toBeDefined();
    expect(screen.getByText(/15 ноября 2026/i)).toBeDefined();
    expect(screen.getByText(/Отметки дня/i)).toBeDefined();
    expect(screen.getByText(/Заметка/i)).toBeDefined();
    expect(screen.getByText(/Сбросить/i)).toBeDefined();
    expect(screen.getByText(/Перетаскивай кругляхи и стикер заметки/i)).toBeDefined();
  });
});
