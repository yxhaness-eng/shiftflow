import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { ResolvedDayInfo } from '../../types';
import { StickerElement } from '../Sticker/StickerElement';

interface CalendarDayCellProps {
  dayInfo: ResolvedDayInfo;
  onClick: () => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({ dayInfo, onClick }) => {
  const {
    isCurrentMonth,
    isToday,
    dayNumber,
    actualPoint,
    status,
    isSwap,
    originalPoint,
    stickers,
    note
  } = dayInfo;

  return (
    <div
      className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Cell Header: Day Number and indicators */}
      <div className="cell-header">
        <span className={`day-number ${isToday ? 'today-badge' : ''}`}>
          {dayNumber}
        </span>

        {/* Note indicator icon */}
        {note && note.trim().length > 0 && (
          <span className="note-indicator" title="Есть личная заметка">
            <FileText size={12} />
          </span>
        )}
      </div>

      {/* Center Area: Stickers Preview */}
      <div className="cell-stickers-container">
        {stickers.slice(0, 2).map((stk) => (
          <div key={stk.id} className="cell-sticker-wrapper">
            <StickerElement sticker={stk} />
          </div>
        ))}
        {stickers.length > 2 && (
          <span className="more-stickers-badge">+{stickers.length - 2}</span>
        )}
      </div>

      {/* Cell Footer: Shift or Status Badge */}
      <div className="cell-footer">
        {status === 'work' && actualPoint && (
          <div
            className={`shift-pill ${isSwap ? 'is-swap' : ''}`}
            style={{
              backgroundColor: actualPoint.color,
              color: actualPoint.textColor || 'var(--text-primary)'
            }}
            title={
              isSwap
                ? `Подмена: по графику ${originalPoint?.name || '—'}, фактически ${actualPoint.name}`
                : actualPoint.name
            }
          >
            {isSwap && <RefreshCw size={10} className="swap-icon-spin" />}
            <span className="shift-pill-text">{actualPoint.name}</span>
          </div>
        )}

        {status === 'day_off' && (
          <div className="status-pill day-off-pill">
            <span>Выходной</span>
          </div>
        )}

        {status === 'vacation' && (
          <div className="status-pill vacation-pill">
            <span>Отпуск</span>
          </div>
        )}

        {status === 'sick' && (
          <div className="status-pill sick-pill">
            <span>Больничный</span>
          </div>
        )}
      </div>
    </div>
  );
};

