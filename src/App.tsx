import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/Navigation/AppHeader';
import { BottomNavigation } from './components/Navigation/BottomNavigation';
import { CalendarPage } from './pages/CalendarPage/CalendarPage';
import { StickersPage } from './pages/StickersPage/StickersPage';
import { StatisticsPage } from './pages/StatisticsPage/StatisticsPage';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { InitialSetupModal } from './components/InitialSetup/InitialSetupModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';

const AppShell: React.FC = () => {
  const { activeTab, isLoading } = useApp();
  const { canInstall, promptInstall } = usePWAInstall();

  if (isLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <img
            src="./icons/icon-192x192.png"
            alt="ShiftFlow"
            style={{ width: '64px', height: '64px', borderRadius: '16px', marginBottom: '12px' }}
          />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>ShiftFlow</h2>
          <p style={{ fontSize: '0.85rem' }}>Загрузка календаря...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Initial Setup Wizard Modal if first launch */}
      <InitialSetupModal />

      {/* Top Header */}
      <AppHeader
        canInstall={canInstall}
        onInstallClick={promptInstall}
      />

      {/* Main Pages */}
      <main className="app-main">
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'stickers' && <StickersPage />}
        {activeTab === 'stats' && <StatisticsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Bottom Mobile Navigation */}
      <BottomNavigation />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;

