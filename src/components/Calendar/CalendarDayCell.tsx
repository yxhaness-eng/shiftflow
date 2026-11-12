import React, { useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { ResolvedDayInfo, NoteStickerStyle } from '../../types';
import { StickerElement } from '../Sticker/StickerElement';
import { ACTIVITY_MAP } from '../../data/lifeTrackerData';

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

  // Determine if a note / noteSticker / journalPage is present
  const hasNote = Boolean(
    (noteSticker && (noteSticker.text?.trim() || noteSticker.style)) ||
    (note && note.trim().length > 0) ||
    (dayInfo.journalPage && (dayInfo.journalPage.content?.trim() || dayInfo.journalPage.title?.trim() || dayInfo.journalPage.paperType))
  );

  const noteStyle: NoteStickerStyle =
    noteSticker?.style ||
    (dayInfo.journalPage?.paperType === 'kraft' || dayInfo.journalPage?.paperType === 'vintage'
      ? 'dark-craft'
      : 'paper-clip');

  const noteRotation =
    noteSticker?.rotation !== undefined
      ? noteSticker.rotation
      : dayNumber % 2 === 0
      ? 1.5
      : -1.8;

  const noteTooltip =
    noteSticker?.text?.trim() ||
    dayInfo.journalPage?.title?.trim() ||
    dayInfo.journalPage?.content?.trim() ||
    note?.trim() ||
    'Стикер-заметка';

  const hasEvent = Boolean(
    hasNote ||
    (activities && activities.length > 0)
  );

  return (
    <div
      className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''} ${hasEvent ? 'has-event' : ''}`}
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
      {/* Cell Header: Day Number */}
      <div className="cell-header">
        <span className={`day-number ${isToday ? 'today-badge' : ''}`}>
          {dayNumber}
        </span>
      </div>

      {/* Center Area: Mini Note Sticker, Activity Badges & Placed Stickers */}
      <div className="cell-stickers-container">
        {/* Authentic Mini Paper Sticker with Paper Clip / Washi Tape (Photo 4) - no raw text preview */}
        {hasNote && (
          <div
            className={`cell-mini-note-card style-${noteStyle}`}
            style={{
              '--mini-note-rot': `${noteRotation}deg`
            } as React.CSSProperties}
            title={noteTooltip}
            data-testid="cell-mini-note-sticker"
          >
            {/* Paper clip decor (Photo 4, cells 3, 24) */}
            {noteStyle === 'paper-clip' && (
              <div className="mini-note-clip-decor" aria-hidden="true">
                <svg viewBox="0 0 14 26" fill="none" className="mini-clip-svg">
                  <path
                    d="M3.5 2.5v16a4 4 0 0 0 8 0v-13a2.5 2.5 0 0 0-5 0v12.5"
                    stroke="#4E7C4B"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            {/* Washi tape decor (Photo 4, cell 14) */}
            {noteStyle === 'washi-tape' && (
              <>
                <div className="mini-note-washi washi-top-left" aria-hidden="true" />
                <div className="mini-note-washi washi-top-right" aria-hidden="true" />
              </>
            )}

            {/* Dark craft washi strip (Photo 4, cell 14) */}
            {noteStyle === 'dark-craft' && (
              <div className="mini-note-washi washi-craft-strip" aria-hidden="true" />
            )}

            {/* Spiral pad holes */}
            {noteStyle === 'spiral-pad' && (
              <div className="mini-note-spirals" aria-hidden="true">
                <span className="mini-spiral-hole" />
                <span className="mini-spiral-hole" />
                <span className="mini-spiral-hole" />
                <span className="mini-spiral-hole" />
              </div>
            )}

            {/* Ribbon card bow */}
            {noteStyle === 'ribbon-card' && (
              <div className="mini-note-ribbon" aria-hidden="true">
                🎀
              </div>
            )}

            {/* Tag hole */}
            {noteStyle === 'tag' && (
              <div className="mini-note-tag-hole" aria-hidden="true" />
            )}

            {/* Realistic ruled lines placeholder - note text is shown via title tooltip */}
            <div className="mini-note-ruled-lines" aria-hidden="true">
              <span className="mini-rule-line" />
              <span className="mini-rule-line" />
              <span className="mini-rule-line" />
            </div>
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
                    <img src={`./${act.iconImage}?v=cutout2`} alt={act?.label || actId} />
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
