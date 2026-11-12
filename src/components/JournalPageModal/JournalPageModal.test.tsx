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
});
