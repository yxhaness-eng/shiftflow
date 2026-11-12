import React, { useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { ResolvedDayInfo } from '../../types';
import { StickerElement } from '../Sticker/StickerElement';
import { ACTIVITY_MAP, INTIMATE_PRESETS } from '../../data/lifeTrackerData';

interface CalendarDayCellProps {
  dayInfo: ResolvedDayInfo;
  onClick: () => void;
  onLongPress?: () => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  dayInfo,
  onClick,
  onLongPress
}) => {
  const {
    isCurrentMonth,
    isToday,
    dayNumber,
    actualPoint,
    status,
    isSwap,
    originalPoint,
    stickers,
    note,
    intimate,
    activities,
    noteSticker
  } = dayInfo;

  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  const handlePointerDown = () => {
    isLongPressTriggeredRef.current = false;
    if (onLongPress) {
      longPressTimerRef.current = window.setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        onLongPress();
      }, 480);
    }
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = () => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    onClick();
  };

  // Find intimate preset emoji if active
  const intimatePreset = intimate?.hadSex
    ? INTIMATE_PRESETS.find((p) => p.id === intimate.type)
    : null;

  return (
    <div
      className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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

        {/* Indicators on top right: Intimate badge & note icon */}
        <div className="cell-header-badges">
          {intimate?.hadSex && (
            <span
              className="cell-intimate-mini-badge"
              title={`Секас был: ${intimate.customType || intimatePreset?.label || '💕'}`}
            >
              💕{intimate.customType ? '✨' : intimatePreset?.emoji || ''}
            </span>
          )}

          {dayInfo.journalPage?.content && (
            <span
              className="cell-note-mini-pin journal-pin"
              title={`Страничка ежедневника: ${dayInfo.journalPage.title || dayInfo.journalPage.content}`}
            >
              📖
            </span>
          )}

          {noteSticker?.text && (
            <span
              className={`cell-note-mini-pin pin-${noteSticker.style}`}
              title={`Стикер-заметка: ${noteSticker.text}`}
            >
              📝
            </span>
          )}

          {!noteSticker?.text && note && note.trim().length > 0 && (
            <span className="cell-note-mini-pin" title="Есть заметка">
              📄
            </span>
          )}
        </div>
      </div>

      {/* Center Area: Activity Badges & Mini Note & Stickers */}
      <div className="cell-stickers-container">
        {/* If note sticker exists, render miniature memo paper */}
        {noteSticker?.text && (
          <div
            className={`cell-mini-note-card style-${noteSticker.style}`}
            title={noteSticker.text}
          >
            <span className="mini-note-text">{noteSticker.text}</span>
          </div>
        )}

        {/* Activity Badges (up to 3) */}
        {activities && activities.length > 0 && (
          <div className="cell-activities-row">
            {activities.slice(0, 3).map((actId) => {
              const act = ACTIVITY_MAP[actId];
              return (
                <div key={actId} className="cell-activity-mini-icon" title={act?.label || actId}>
                  {act?.iconImage ? (
                    <img src={`./${act.iconImage}`} alt={act.label} />
                  ) : (
                    <span>{act?.emoji || '🏷️'}</span>
                  )}
                </div>
              );
            })}
            {activities.length > 3 && (
              <span className="cell-more-activities">+{activities.length - 3}</span>
            )}
          </div>
        )}

        {/* Placed Stickers Preview */}
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
