import React, { useState, useRef } from 'react';
import {
  X,
  Edit3,
  Tag,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatFullDateRU } from '../../utils/dateUtils';
import { ACTIVITY_MAP } from '../../data/lifeTrackerData';
import { playStickerPop, playBubbleTap, triggerHaptic } from '../../services/soundEffects';

interface ScrapbookCellZoomProps {
  date: string;
  onClose: () => void;
  onOpenLifeTracker: () => void;
  onOpenNoteSticker: () => void;
}

export const ScrapbookCellZoom: React.FC<ScrapbookCellZoomProps> = ({
  date,
  onClose,
  onOpenLifeTracker,
  onOpenNoteSticker
}) => {
  const {
    settings,
    getDayInfo,
    updateDayMarkerPosition,
    resetDayMarkerPositions
  } = useApp();

  const dayInfo = getDayInfo(date);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Local drag positions for instant smooth drag feedback
  const [livePositions, setLivePositions] = useState<Record<string, { x: number; y: number }>>({});

  const formattedDate = formatFullDateRU(date);

  // Dragging state
  const dragRef = useRef<{
    id: string; // 'note' or activityId
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    isDragging: boolean;
  } | null>(null);

  const activities = dayInfo.activities || [];
  const markerPositions = dayInfo.markerPositions || {};

  // Check if note is present
  const hasNote = Boolean(
    (dayInfo.noteSticker && (dayInfo.noteSticker.text?.trim() || dayInfo.noteSticker.style)) ||
    (dayInfo.note && dayInfo.note.trim().length > 0) ||
    (dayInfo.journalPage && (dayInfo.journalPage.content?.trim() || dayInfo.journalPage.title?.trim()))
  );

  // Helper to get marker coordinates (live > saved > default)
  const getMarkerCoords = (markerId: string, defaultIdx: number = 0) => {
    if (livePositions[markerId]) {
      return livePositions[markerId];
    }
    if (markerPositions[markerId]) {
      return markerPositions[markerId];
    }
    if (markerId === 'note') {
      return { x: dayInfo.noteSticker?.x ?? 0, y: dayInfo.noteSticker?.y ?? -8 };
    }
    // Default staggered layout for activity badges if user hasn't moved them yet
    const cols = Math.min(3, Math.max(1, activities.length));
    const colIdx = defaultIdx % cols;
    const rowIdx = Math.floor(defaultIdx / cols);
    const spacingX = cols > 1 ? 55 / (cols - 1) : 0;
    const defX = cols > 1 ? -28 + colIdx * spacingX : 0;
    const defY = 16 + rowIdx * 24;
    return { x: Math.round(defX), y: Math.round(defY) };
  };

  const handlePointerDown = (
    e: React.PointerEvent,
    markerId: string,
    initialX: number,
    initialY: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItemId(markerId);
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(6, settings.hapticsEnabled !== false);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    dragRef.current = {
      id: markerId,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: initialX,
      origY: initialY,
      isDragging: true
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !dragRef.current.isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    // Zoomed cell is ~300px, 3px = ~1%
    const deltaPercentX = deltaX / 3.0;
    const deltaPercentY = deltaY / 3.0;

    const newX = Math.round(Math.max(-42, Math.min(42, dragRef.current.origX + deltaPercentX)));
    const newY = Math.round(Math.max(-42, Math.min(42, dragRef.current.origY + deltaPercentY)));

    setLivePositions((prev) => ({
      ...prev,
      [dragRef.current!.id]: { x: newX, y: newY }
    }));
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (dragRef.current && dragRef.current.isDragging) {
      const activeId = dragRef.current.id;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      playStickerPop(settings.soundEnabled !== false);
      triggerHaptic(10, settings.hapticsEnabled !== false);

      const finalPos = livePositions[activeId];
      if (finalPos) {
        await updateDayMarkerPosition(date, activeId, finalPos);
      }

      dragRef.current.isDragging = false;
      dragRef.current = null;
    }
  };

  const handleResetPositions = async () => {
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(8, settings.hapticsEnabled !== false);
    setLivePositions({});
    await resetDayMarkerPositions(date);
  };

  return (
    <div className="scrapbook-zoom-overlay" onClick={onClose}>
      <div className="scrapbook-zoom-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="scrapbook-zoom-header">
          <div className="header-info">
            <span className="zoom-badge">Оформление окошка</span>
            <h3 className="zoom-title">{formattedDate}</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="scrapbook-quick-toolbar">
          <button
            className="toolbar-pill-btn"
            onClick={() => {
              playBubbleTap(settings.soundEnabled !== false);
              onOpenLifeTracker();
            }}
          >
            <Tag size={14} />
            <span>Отметки дня ({activities.length})</span>
          </button>

          <button
            className="toolbar-pill-btn"
            onClick={() => {
              playBubbleTap(settings.soundEnabled !== false);
              onOpenNoteSticker();
            }}
          >
            <Edit3 size={14} />
            <span>{hasNote ? 'Изменить заметку' : '+ Заметка'}</span>
          </button>

          <button
            className="toolbar-pill-btn"
            onClick={handleResetPositions}
            title="Сбросить расстановку значков в центр"
          >
            <RotateCcw size={14} />
            <span>Сбросить</span>
          </button>
        </div>

        <div className="zoom-hint-banner">
          <Sparkles size={14} />
          <span>Перетаскивай кругляхи и стикер заметки пальцем по окошку!</span>
        </div>

        {/* Enlarged Day Cell Canvas */}
        <div
          className="enlarged-day-canvas"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Day number & shift header */}
          <div className="enlarged-canvas-header">
            <div className="enlarged-day-badge">
              <span className="enlarged-day-number">{dayInfo.dayNumber}</span>
              <span className="enlarged-day-dow">
                {formattedDate.split(',')[1]?.trim() || ''}
              </span>
            </div>

            {dayInfo.status === 'work' && dayInfo.actualPoint && (
              <span
                className="enlarged-shift-pill"
                style={{
                  backgroundColor: dayInfo.actualPoint.color,
                  color: dayInfo.actualPoint.textColor || '#333'
                }}
              >
                {dayInfo.actualPoint.name}
              </span>
            )}
            {dayInfo.status === 'day_off' && (
              <span className="enlarged-status-pill day-off">Выходной</span>
            )}
          </div>

          {/* DRAGGABLE NOTE STICKER */}
          {hasNote && (() => {
            const noteCoords = getMarkerCoords('note', 0);
            const style = dayInfo.noteSticker?.style || 'paper-clip';
            const textPreview =
              dayInfo.noteSticker?.text?.trim() ||
              dayInfo.journalPage?.title?.trim() ||
              dayInfo.journalPage?.content?.trim() ||
              dayInfo.note?.trim() ||
              'Заметка';

            return (
              <div
                className={`canvas-note-sticker style-${style} ${selectedItemId === 'note' ? 'selected' : ''}`}
                style={{
                  transform: `translate(${noteCoords.x}%, ${noteCoords.y}%) rotate(${dayInfo.noteSticker?.rotation || 0}deg)`
                }}
                onPointerDown={(e) => handlePointerDown(e, 'note', noteCoords.x, noteCoords.y)}
                title="Стикер-заметка (перетаскивай)"
              >
                <div className={`canvas-note-decor decor-${style}`} />
                <div className="canvas-note-text">{textPreview}</div>
              </div>
            );
          })()}

          {/* DRAGGABLE CIRCULAR ACTIVITY BADGES ("КРУГЛЯХИ") */}
          {activities.map((actId, idx) => {
            const act = ACTIVITY_MAP[actId];
            const coords = getMarkerCoords(actId, idx);
            const isSelected = selectedItemId === actId;
            const customLabel = settings.activityCustomLabels?.[actId] || act?.label || actId;

            return (
              <div
                key={actId}
                className={`canvas-activity-badge ${isSelected ? 'selected' : ''}`}
                style={{
                  transform: `translate(${coords.x}%, ${coords.y}%)`
                }}
                onPointerDown={(e) => handlePointerDown(e, actId, coords.x, coords.y)}
                title={`${customLabel} (перетаскивай)`}
              >
                {act?.iconImage ? (
                  <img
                    src={`./${act.iconImage}?v=circle`}
                    alt={customLabel}
                    className="canvas-activity-img"
                  />
                ) : (
                  <span className="canvas-activity-emoji">{act?.emoji || '🏷️'}</span>
                )}
              </div>
            );
          })}

          {activities.length === 0 && !hasNote && (
            <div className="canvas-empty-state">
              <p>В этом окошке пока нет отметок</p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  playBubbleTap(settings.soundEnabled !== false);
                  onOpenLifeTracker();
                }}
              >
                + Добавить отметку дня
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
