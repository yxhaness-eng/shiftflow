import React, { useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getMonthCalendarGrid,
  getMonthNameRU,
  WEEKDAY_SHORT_RU
} from '../../utils/dateUtils';
import { CalendarDayCell } from './CalendarDayCell';

export const CalendarView: React.FC = () => {
  const {
    currentMonth,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    getDayInfo,
    setSelectedDate,
    points
  } = useApp();

  const gridCells = useMemo(() => {
    return getMonthCalendarGrid(currentMonth.year, currentMonth.month);
  }, [currentMonth.year, currentMonth.month]);

  const monthTitle = `${getMonthNameRU(currentMonth.month)} ${currentMonth.year}`;

  // Touch Swipe Gestures for Month Navigation on Mobile
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    // Detect horizontal swipe with delta > 50px and predominantly horizontal
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        // Swiped left -> Next month
        goToNextMonth();
      } else {
        // Swiped right -> Previous month
        goToPrevMonth();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="calendar-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dedicated Print-only Title Header */}
      <div className="print-only-header">
        <div className="print-brand-title">🌸 ShiftFlow • Персональный график смен</div>
        <div className="print-brand-subtitle">{monthTitle}</div>
      </div>

      {/* Month Navigation Header */}
      <div className="calendar-toolbar">
        <div className="toolbar-left">
          <h2 className="month-title">{monthTitle}</h2>
        </div>

        <div className="toolbar-actions">
          <button
            className="btn btn-outline btn-sm print-calendar-btn"
            onClick={handlePrint}
            title="Распечатать календарь или сохранить в PDF"
          >
            <Printer size={14} />
            <span className="print-btn-label">Печать / PDF</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={goToToday}
            title="Перейти к сегодняшней дате"
          >
            <CalendarIcon size={14} />
            <span>Сегодня</span>
          </button>

          <div className="nav-arrows">
            <button
              className="btn-icon"
              onClick={goToPrevMonth}
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="btn-icon"
              onClick={goToNextMonth}
              aria-label="Следующий месяц"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Work points mini legend */}
      <div className="calendar-legend">
        {points.filter(p => p.isActive).map((point) => (
          <div key={point.id} className="legend-item">
            <span
              className="legend-color-dot"
              style={{ backgroundColor: point.color }}
            />
            <span className="legend-label">{point.name}</span>
          </div>
        ))}
        <div className="legend-item">
          <span className="legend-swap-dot" />
          <span className="legend-label">Подмена</span>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="weekday-header-grid">
        {WEEKDAY_SHORT_RU.map((dayName, idx) => (
          <div
            key={dayName}
            className={`weekday-header-cell ${idx >= 5 ? 'weekend' : ''}`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Month Grid */}
      <div className="calendar-month-grid">
        {gridCells.map((cell) => {
          const dayInfo = getDayInfo(cell.date);
          return (
            <CalendarDayCell
              key={cell.date}
              dayInfo={dayInfo}
              onClick={() => setSelectedDate(cell.date)}
            />
          );
        })}
      </div>

      {/* Dedicated Print Footer */}
      <div className="print-footer">
        <span>ShiftFlow • Распечатано из персонального планировщика</span>
      </div>
    </div>
  );
};

