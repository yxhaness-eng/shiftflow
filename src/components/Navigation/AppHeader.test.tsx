// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { AppHeader } from './AppHeader';
import { AppProvider, useApp } from '../../context/AppContext';
import 'fake-indexeddb/auto';

afterEach(() => {
  cleanup();
});

const NavigationTestConsumer: React.FC = () => {
  const { activeTab, currentMonth, selectedDate } = useApp();
  return (
    <div data-testid="nav-state">
      <span data-testid="active-tab">{activeTab}</span>
      <span data-testid="current-month">{currentMonth.year}-{currentMonth.month}</span>
      <span data-testid="selected-date">{selectedDate || 'none'}</span>
    </div>
  );
};

describe('AppHeader Component', () => {
  it('renders brand wax seal icon, title ShiftFlow, and subtitle', async () => {
    render(
      <AppProvider>
        <AppHeader />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ShiftFlow')).toBeDefined();
    });

    expect(screen.getByText('календарь смен & жизни')).toBeDefined();
    const seal = screen.getByAltText(/ShiftFlow Vintage Wax Seal Badge/i);
    expect(seal).toBeDefined();
    expect(seal.getAttribute('src')).toBe('./icons/wax-seal.svg');
  });

  it('renders desktop navigation with Calendar, Stickers, and Settings buttons', async () => {
    render(
      <AppProvider>
        <AppHeader />
        <NavigationTestConsumer />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Календарь')).toBeDefined();
    });

    const stickersBtn = screen.getByRole('button', { name: /Стикеры/i });
    const settingsBtn = screen.getByRole('button', { name: /Настройки/i });
    const calendarBtn = screen.getByRole('button', { name: /Календарь/i });

    expect(stickersBtn).toBeDefined();
    expect(settingsBtn).toBeDefined();
    expect(calendarBtn).toBeDefined();

    // Click stickers button
    fireEvent.click(stickersBtn);
    expect(screen.getByTestId('active-tab').textContent).toBe('stickers');

    // Click settings button
    fireEvent.click(settingsBtn);
    expect(screen.getByTestId('active-tab').textContent).toBe('settings');

    // Click brand badge to return to calendar
    const brandBadge = screen.getByLabelText(/ShiftFlow — Главная/i);
    fireEvent.click(brandBadge);
    expect(screen.getByTestId('active-tab').textContent).toBe('calendar');
  });

  it('renders header actions with today button and handles click', async () => {
    render(
      <AppProvider>
        <AppHeader />
        <NavigationTestConsumer />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Перейти к сегодняшней дате')).toBeDefined();
    });

    const todayBtn = screen.getByTitle('Перейти к сегодняшней дате');
    fireEvent.click(todayBtn);

    expect(screen.getByTestId('active-tab').textContent).toBe('calendar');
    expect(screen.getByTestId('current-month').textContent).toContain('2026-11');
  });

  it('renders PWA install button when canInstall is true and handles install prompt', async () => {
    const onInstallMock = vi.fn();

    const { rerender } = render(
      <AppProvider>
        <AppHeader canInstall={false} onInstallClick={onInstallMock} />
      </AppProvider>
    );

    // Should not show install button when canInstall is false
    expect(screen.queryByTitle('Установить как приложение')).toBeNull();

    // Rerender with canInstall=true
    rerender(
      <AppProvider>
        <AppHeader canInstall={true} onInstallClick={onInstallMock} />
      </AppProvider>
    );

    const installBtn = screen.getByTitle('Установить как приложение');
    expect(installBtn).toBeDefined();
    fireEvent.click(installBtn);
    expect(onInstallMock).toHaveBeenCalledTimes(1);
  });
});
