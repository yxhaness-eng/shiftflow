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

    expect(screen.getByText(/Страничка ежедневника/i)).toBeDefined();
    expect(screen.getByText('Линейка')).toBeDefined();
    expect(screen.getByText('Клетка')).toBeDefined();
    expect(screen.getByText('Крафт')).toBeDefined();
    expect(screen.getByText('Лаванда')).toBeDefined();
    expect(screen.getByText('Шалфей')).toBeDefined();

    expect(screen.getByPlaceholderText(/Заголовок странички или настроение/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Напиши сюда мысли, воспоминания, планы или секретики/i)).toBeDefined();
    expect(screen.getByText(/Сохранить страничку/i)).toBeDefined();
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

    const contentInput = screen.getByPlaceholderText(/Напиши сюда мысли, воспоминания, планы или секретики/i);
    fireEvent.change(contentInput, { target: { value: 'Сегодня пила латте и гуляла по парку.' } });

    const kraftBtn = screen.getByText('Крафт');
    fireEvent.click(kraftBtn);

    const saveBtn = screen.getByText(/Сохранить страничку/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
