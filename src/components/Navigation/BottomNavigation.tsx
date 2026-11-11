import React from 'react';
import { Calendar, Sparkles, BarChart2, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-tab ${activeTab === 'calendar' ? 'active' : ''}`}
        onClick={() => setActiveTab('calendar')}
      >
        <div className="tab-icon-wrap">
          <Calendar size={18} />
        </div>
        <span>Календарь</span>
      </button>

      <button
        className={`bottom-tab ${activeTab === 'stickers' ? 'active' : ''}`}
        onClick={() => setActiveTab('stickers')}
      >
        <div className="tab-icon-wrap">
          <Sparkles size={18} />
        </div>
        <span>Стикеры</span>
      </button>

      <button
        className={`bottom-tab ${activeTab === 'stats' ? 'active' : ''}`}
        onClick={() => setActiveTab('stats')}
      >
        <div className="tab-icon-wrap">
          <BarChart2 size={18} />
        </div>
        <span>Статистика</span>
      </button>

      <button
        className={`bottom-tab ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        <div className="tab-icon-wrap">
          <Settings size={18} />
        </div>
        <span>Настройки</span>
      </button>
    </nav>
  );
};

