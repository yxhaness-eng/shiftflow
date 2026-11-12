import React from 'react';
import { Calendar, Sparkles, Settings, Download, CalendarCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AppHeaderProps {
  onInstallClick?: () => void;
  canInstall?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onInstallClick, canInstall }) => {
  const { activeTab, setActiveTab, goToToday } = useApp();

  const handleBrandClick = () => {
    setActiveTab('calendar');
  };

  const handleTodayClick = () => {
    setActiveTab('calendar');
    goToToday();
  };

  return (
    <header className="app-header">
      <div
        className="brand-badge"
        onClick={handleBrandClick}
        role="button"
        tabIndex={0}
        aria-label="ShiftFlow — Главная"
        style={{ cursor: 'pointer' }}
      >
        <img
          src="./icons/wax-seal.svg"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = './icons/icon-192x192.png';
          }}
          alt="ShiftFlow Vintage Wax Seal Badge"
          className="brand-icon brand-wax-seal"
        />
        <div className="brand-text">
          <h1 className="brand-title">
            <span>ShiftFlow</span>
            <span className="brand-gem" aria-hidden="true">✦</span>
          </h1>
          <div className="brand-subtitle">календарь смен & жизни</div>
        </div>
      </div>

      {/* Desktop Navigation - hidden on mobile screens (max-width: 768px) */}
      <nav className="desktop-nav" aria-label="Основная навигация">
        <button
          className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={16} />
          <span>Календарь</span>
        </button>

        <button
          className={`nav-link ${activeTab === 'stickers' ? 'active' : ''}`}
          onClick={() => setActiveTab('stickers')}
        >
          <Sparkles size={16} />
          <span>Стикеры</span>
        </button>

        <button
          className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          <span>Настройки</span>
        </button>
      </nav>

      {/* Header Actions: Today button and optional PWA Install */}
      <div className="header-actions">
        <button
          type="button"
          className="btn-icon header-today-btn"
          onClick={handleTodayClick}
          title="Перейти к сегодняшней дате"
          aria-label="Сегодня"
        >
          <CalendarCheck size={17} />
        </button>

        {canInstall && onInstallClick && (
          <button
            type="button"
            className="btn btn-secondary btn-sm header-install-btn"
            onClick={onInstallClick}
            title="Установить как приложение"
            aria-label="Установить приложение"
          >
            <Download size={14} />
            <span className="install-text">Установить</span>
          </button>
        )}
      </div>
    </header>
  );
};


