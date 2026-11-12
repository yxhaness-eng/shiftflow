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
    date,
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

  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const hasEvent = Boolean(
    hasNote ||
    (activities && activities.length > 0)
  );

  return (
    <div
      className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isWeekend ? 'is-weekend' : ''} ${isToday ? 'is-today' : ''} ${hasEvent ? 'has-event' : ''}`}
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
        <span className={`day-number ${isWeekend ? 'weekend-day' : ''} ${isToday ? 'today-badge' : ''}`}>
          {dayNumber}
        </span>
      </div>

      {/* Center Area: Mini Note Sticker, Activity Badges & Placed Stickers */}
      <div className="cell-stickers-container">
        {/* Authentic Mini Paper Sticker with Paper Clip / Washi Tape (Photo 4) */}
        {hasNote && (() => {
          const hasAnyCustomPos = Boolean(
            dayInfo.markerPositions?.['note'] ||
            activities?.some((actId) => Boolean(dayInfo.markerPositions?.[actId]))
          );
          const notePos = dayInfo.markerPositions?.['note'] || (noteSticker?.x !== undefined ? { x: noteSticker.x, y: noteSticker.y || 0 } : (hasAnyCustomPos ? { x: -20, y: -8 } : null));
          const rawScale = dayInfo.markerPositions?.['note']?.scale ?? 1.0;
          const noteScale = Math.min(1.2, Math.max(0.45, rawScale));
          const customStyle = notePos
            ? ({
                '--mini-note-rot': `${noteRotation}deg`,
                position: 'absolute',
                left: `calc(50% + ${notePos.x}%)`,
                top: `calc(50% + ${notePos.y}%)`,
                transform: `translate(-50%, -50%) rotate(${noteRotation}deg) scale(${noteScale})`,
                zIndex: 4
              } as React.CSSProperties)
            : ({
                '--mini-note-rot': `${noteRotation}deg`,
                transform: `rotate(${noteRotation}deg) scale(${noteScale})`
              } as React.CSSProperties);

          return (
            <div
              className={`cell-mini-note-card style-${noteStyle} ${activities && activities.length > 0 && !notePos ? 'with-activities' : ''}`}
              style={customStyle}
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
          );
        })()}

        {/* Activity Badges: custom positioned or in non-overlapping flow row */}
        {activities && activities.length > 0 && (() => {
          const hasAnyCustomPos = Boolean(
            dayInfo.markerPositions?.['note'] ||
            activities.some((actId) => Boolean(dayInfo.markerPositions?.[actId]))
          );

          if (hasAnyCustomPos) {
            return (
              <>
                {activities.map((actId, idx) => {
                  const act = ACTIVITY_MAP[actId];
                  // Non-overlapping fallback coordinates in quadrants
                  const defaultPos: { x: number; y: number; scale?: number } = hasNote
                    ? [
                        { x: 20, y: -8, scale: 1.0 },
                        { x: 20, y: 14, scale: 1.0 },
                        { x: -20, y: 14, scale: 1.0 }
                      ][idx % 3]
                    : [
                        { x: -20, y: 0, scale: 1.0 },
                        { x: 0, y: 0, scale: 1.0 },
                        { x: 20, y: 0, scale: 1.0 }
                      ][idx % 3];

                  const pos = dayInfo.markerPositions?.[actId] || defaultPos;
                  const scale = Math.min(1.25, Math.max(0.4, pos.scale ?? 1.0));
                  return (
                    <div
                      key={actId}
                      className="cell-activity-mini-icon custom-placed"
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${pos.x}%)`,
                        top: `calc(50% + ${pos.y}%)`,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                        zIndex: 5
                      }}
                      title={act?.label || actId}
                    >
                      {act?.iconImage ? (
                        <img src={`./${act.iconImage}?v=circle`} alt={act?.label || actId} />
                      ) : (
                        <span>{act?.emoji || '🏷️'}</span>
                      )}
                    </div>
                  );
                })}
              </>
            );
          }

          // Flow layout: if note is present, show max 2 compact badges so they never crowd or clump
          const maxVisible = hasNote ? 2 : 3;
          const visibleActivities = activities.slice(0, maxVisible);
          const hiddenCount = activities.length - maxVisible;

          return (
            <div className={`cell-activities-row ${hasNote ? 'compact' : ''}`}>
              {visibleActivities.map((actId) => {
                const act = ACTIVITY_MAP[actId];
                return (
                  <div key={actId} className="cell-activity-mini-icon" title={act?.label || actId}>
                    {act?.iconImage ? (
                      <img src={`./${act.iconImage}?v=circle`} alt={act?.label || actId} />
                    ) : (
                      <span>{act?.emoji || '🏷️'}</span>
                    )}
                  </div>
                );
              })}
              {hiddenCount > 0 && (
                <span className="cell-more-activities">+{hiddenCount}</span>
              )}
            </div>
          );
        })()}

        {/* Placed Stickers Preview: clean max 1-2 bounded preview */}
        {stickers.slice(0, 1).map((stk) => (
          <StickerElement key={stk.id} sticker={stk} />
        ))}
        {stickers.length > 1 && (
          <span className="more-stickers-badge">+{stickers.length - 1}</span>
        )}
      </div>

      {/* Cell Footer: Shift or Status Badge */}
      <div className="cell-footer">
        {status === 'work' && actualPoint && (
          <div
            className={`shift-pill ${isSwap ? 'is-swap' : ''}`}
            style={{
              backgroundColor: actualPoint.color,
              color: actualPoint.textColor || 'var(--cal-cell-text, #2D241E)'
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
