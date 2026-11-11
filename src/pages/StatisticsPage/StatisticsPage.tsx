import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Coffee,
  RefreshCw,
  Sparkles,
  Clock,
  History,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateMonthStatistics } from '../../services/scheduleEngine';
import { getMonthNameRU } from '../../utils/dateUtils';

export const StatisticsPage: React.FC = () => {
  const {
    currentMonth,
    scheduleConfig,
    pointsMap,
    overrides,
    stickersByDate,
    history
  } = useApp();

  const [statsMonth, setStatsMonth] = useState({
    year: currentMonth.year,
    month: currentMonth.month
  });

  const nextMonth = () => {
    setStatsMonth((prev) => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const prevMonth = () => {
    setStatsMonth((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const stats = useMemo(() => {
    return calculateMonthStatistics(
      statsMonth.year,
      statsMonth.month,
      scheduleConfig,
      pointsMap,
      overrides,
      stickersByDate
    );
  }, [statsMonth, scheduleConfig, pointsMap, overrides, stickersByDate]);

  const monthTitle = `${getMonthNameRU(statsMonth.month)} ${statsMonth.year}`;
  const totalShiftsCount = Object.values(stats.shiftsByPoint).reduce((s, p) => s + p.count, 0);

  return (
    <div className="statistics-page">
      {/* Month Navigator */}
      <div className="stats-month-nav">
        <button className="btn-icon" onClick={prevMonth} aria-label="Предыдущий месяц">
          <ChevronLeft size={18} />
        </button>
        <h2 className="stats-month-title">
          <Calendar size={18} />
          <span>{monthTitle}</span>
        </h2>
        <button className="btn-icon" onClick={nextMonth} aria-label="Следующий месяц">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-kpi-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ backgroundColor: 'var(--accent-lavender)' }}>
            <Briefcase size={20} color="var(--accent-lavender-dark)" />
          </div>
          <div className="stat-number">{stats.workingDays}</div>
          <div className="stat-label">Рабочих смен</div>
          <div className="stat-sub">из {stats.totalDays} дней месяца</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ backgroundColor: 'var(--accent-sage)' }}>
            <Coffee size={20} color="var(--accent-sage-dark)" />
          </div>
          <div className="stat-number">{stats.dayOffs}</div>
          <div className="stat-label">Выходных дней</div>
          <div className="stat-sub">отдых и отгулы</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ backgroundColor: 'var(--accent-cream)' }}>
            <RefreshCw size={20} color="var(--badge-swap-text)" />
          </div>
          <div className="stat-number">{stats.swapsCount}</div>
          <div className="stat-label">Подмен смен</div>
          <div className="stat-sub">зафиксировано в месяце</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ backgroundColor: 'var(--accent-rose)' }}>
            <Sparkles size={20} color="var(--accent-rose-dark)" />
          </div>
          <div className="stat-number">{stats.stickersCount}</div>
          <div className="stat-label">Стикеров наклеено</div>
          <div className="stat-sub">в этом месяце</div>
        </div>
      </div>

      {/* Shifts Breakdown by Point */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 className="card-title">
          <Briefcase size={18} color="var(--accent-lavender-dark)" />
          <span>Распределение смен по рабочим точкам</span>
        </h3>

        <div className="points-stats-list">
          {Object.values(stats.shiftsByPoint).map(({ point, count, hours }) => {
            const percentage = totalShiftsCount > 0 ? Math.round((count / totalShiftsCount) * 100) : 0;
            return (
              <div key={point.id} className="point-stat-row">
                <div className="point-stat-header">
                  <div className="point-stat-name">
                    <span className="legend-color-dot" style={{ backgroundColor: point.color }} />
                    <strong>{point.name}</strong>
                  </div>
                  <div className="point-stat-values">
                    <span className="point-stat-shifts">{count} смен</span>
                    <span className="point-stat-percent">({percentage}%)</span>
                    {hours > 0 && (
                      <span className="point-stat-hours" title="Отработано часов">
                        <Clock size={12} /> {hours} ч
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual bar */}
                <div className="point-stat-progress-track">
                  <div
                    className="point-stat-progress-bar"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: point.color
                    }}
                  />
                </div>
              </div>
            );
          })}

          {Object.keys(stats.shiftsByPoint).length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Нет данных по сменам в выбранном месяце
            </p>
          )}
        </div>
      </div>

      {/* History & Audit Log */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 className="card-title">
          <History size={18} color="var(--accent-lavender-dark)" />
          <span>История изменений и подмен</span>
        </h3>

        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            История изменений пуста
          </p>
        ) : (
          <div className="history-list">
            {history.slice(0, 20).map((event) => {
              const timeStr = new Date(event.timestamp).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={event.id} className="history-item">
                  <div className="history-dot" />
                  <div className="history-content">
                    <div className="history-top">
                      <span className="history-date-badge">{event.date}</span>
                      <span className="history-time">{timeStr}</span>
                    </div>
                    <div className="history-desc">{event.details}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

