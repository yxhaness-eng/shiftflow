// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { NoteStickerModal } from './NoteStickerModal';
import { AppProvider } from '../../context/AppContext';
import 'fake-indexeddb/auto';

afterEach(() => {
  cleanup();
});

describe('NoteStickerModal component', () => {
  it('renders unified paper and note sticker format selector and lined textarea', () => {
    const handleClose = vi.fn();

    render(
      <AppProvider>
        <NoteStickerModal date="2026-11-20" onClose={handleClose} />
      </AppProvider>
    );

    expect(screen.getByText('Формат:')).toBeDefined();
    expect(screen.getByText('Со скрепкой')).toBeDefined();
    expect(screen.getByPlaceholderText(/Напиши сюда заметку, мысль или секретик/i)).toBeDefined();
    expect(screen.getByText(/Приклеить в календарь/i)).toBeDefined();
    expect(screen.getByText(/Убрать стикер/i)).toBeDefined();
  });

  it('allows writing text and clicking glue button', async () => {
    const handleClose = vi.fn();

    render(
      <AppProvider>
        <NoteStickerModal date="2026-11-21" onClose={handleClose} />
      </AppProvider>
    );

    const textarea = screen.getByPlaceholderText(/Напиши сюда заметку, мысль или секретик/i);
    fireEvent.change(textarea, { target: { value: 'Мой уютный секретик!' } });

    const glueBtn = screen.getByText(/Приклеить в календарь/i);
    fireEvent.click(glueBtn);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
