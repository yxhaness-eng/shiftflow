import React from 'react';
import { Calendar, Sparkles, Settings, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AppHeaderProps {
  onInstallClick?: () => void;
  canInstall?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onInstallClick, canInstall }) => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <header className="app-header">
      <div className="brand-badge" onClick={() => setActiveTab('calendar')} style={{ cursor: 'pointer' }}>
        <img
          src="./icons/wax-seal.svg"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = './icons/icon-192x192.png';
          }}
          alt="ShiftFlow Vintage Wax Seal Badge"
          className="brand-icon brand-wax-seal"
        />
        <div>
          <h1 className="brand-title">
            <span>ShiftFlow</span>
            <span className="brand-gem" aria-hidden="true">✦</span>
          </h1>
          <div className="brand-subtitle">календарь смен & жизни</div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="desktop-nav">
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

      {/* PWA Install Button if available */}
      {canInstall && onInstallClick && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={onInstallClick}
          title="Установить как приложение"
        >
          <Download size={14} />
          <span>Установить</span>
        </button>
      )}
    </header>
  );
};

