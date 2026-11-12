import React, { useState, useRef } from 'react';
import {
  X,
  Edit3,
  Tag,
  RotateCcw,
  Sparkles,
  Minus,
  Plus,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatFullDateRU } from '../../utils/dateUtils';
import { ACTIVITY_MAP } from '../../data/lifeTrackerData';
import { STICKERS_MAP } from '../../data/stickersManifest';
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
    updateDayMarkerScale,
    resetDayMarkerPositions,
    updateStickerTransform,
    removeSticker
  } = useApp();

  const dayInfo = getDayInfo(date);
  const activities = dayInfo.activities || [];
  const stickers = dayInfo.stickers || [];
  const markerPositions = dayInfo.markerPositions || {};

  // Check if note is present
  const hasNote = Boolean(
    (dayInfo.noteSticker && (dayInfo.noteSticker.text?.trim() || dayInfo.noteSticker.style)) ||
    (dayInfo.note && dayInfo.note.trim().length > 0) ||
    (dayInfo.journalPage && (dayInfo.journalPage.content?.trim() || dayInfo.journalPage.title?.trim()))
  );

  // Default selected item: note, or first activity, or first sticker
  const defaultSelected = hasNote
    ? 'note'
    : (activities[0] || (stickers[0]?.id || null));

  const [selectedItemId, setSelectedItemId] = useState<string | null>(defaultSelected);

  // Canvas element reference to precisely compute drag offsets across any screen size
  const canvasRef = useRef<HTMLDivElement>(null);

  // Local drag positions for instant smooth drag feedback
  const [livePositions, setLivePositions] = useState<Record<string, { x: number; y: number }>>({});

  const formattedDate = formatFullDateRU(date);

  // Dragging state
  const dragRef = useRef<{
    id: string; // 'note', activityId, or sticker.id
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    isDragging: boolean;
  } | null>(null);

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

  // Helper to get scale of any marker or sticker
  const getItemScale = (itemId: string): number => {
    if (itemId === 'note') {
      return markerPositions['note']?.scale ?? 1.0;
    }
    if (activities.includes(itemId)) {
      return markerPositions[itemId]?.scale ?? 1.0;
    }
    const stk = stickers.find((s) => s.id === itemId);
    if (stk) {
      return stk.scale ?? 1.0;
    }
    return 1.0;
  };

  // Helper to get label/name of selected item
  const getSelectedItemDetails = () => {
    if (!selectedItemId) return null;

    if (selectedItemId === 'note') {
      return {
        label: 'Стикер-заметка',
        scale: getItemScale('note'),
        canDelete: false
      };
    }

    if (activities.includes(selectedItemId)) {
      const act = ACTIVITY_MAP[selectedItemId];
      const customLabel = settings.activityCustomLabels?.[selectedItemId] || act?.label || selectedItemId;
      return {
        label: customLabel,
        scale: getItemScale(selectedItemId),
        canDelete: false
      };
    }

    const stk = stickers.find((s) => s.id === selectedItemId);
    if (stk) {
      const item = STICKERS_MAP[stk.stickerId];
      return {
        label: item?.name || 'Стикер',
        scale: stk.scale ?? 1.0,
        canDelete: true
      };
    }

    return null;
  };

  const handleAdjustScale = async (delta: number) => {
    if (!selectedItemId) return;
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(6, settings.hapticsEnabled !== false);

    const currentScale = getItemScale(selectedItemId);
    const nextScale = Math.max(0.4, Math.min(1.8, Math.round((currentScale + delta) * 100) / 100));

    if (selectedItemId === 'note' || activities.includes(selectedItemId)) {
      await updateDayMarkerScale(date, selectedItemId, nextScale);
    } else {
      // It's a placed sticker
      const stk = stickers.find((s) => s.id === selectedItemId);
      if (stk) {
        await updateStickerTransform(stk.id, { scale: nextScale });
      }
    }
  };

  const handleResetScale = async () => {
    if (!selectedItemId) return;
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(8, settings.hapticsEnabled !== false);

    if (selectedItemId === 'note' || activities.includes(selectedItemId)) {
      await updateDayMarkerScale(date, selectedItemId, 1.0);
    } else {
      const stk = stickers.find((s) => s.id === selectedItemId);
      if (stk) {
        await updateStickerTransform(stk.id, { scale: 1.0 });
      }
    }
  };

  const handleDeleteSticker = async (stickerId: string) => {
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(12, settings.hapticsEnabled !== false);
    await removeSticker(stickerId);
    if (selectedItemId === stickerId) {
      setSelectedItemId(hasNote ? 'note' : (activities[0] || null));
    }
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

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const canvasWidth = canvasRect?.width || 320;
    const canvasHeight = canvasRect?.height || 320;

    // Convert pixel delta directly to percentage of canvas width / height for 1:1 finger tracking
    const deltaPercentX = (deltaX / canvasWidth) * 100;
    const deltaPercentY = (deltaY / canvasHeight) * 100;

    // Unrestricted movement across the entire canvas: -44% to +44%
    const newX = Math.round(Math.max(-44, Math.min(44, dragRef.current.origX + deltaPercentX)));
    const newY = Math.round(Math.max(-42, Math.min(44, dragRef.current.origY + deltaPercentY)));

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
        if (activeId === 'note' || activities.includes(activeId)) {
          await updateDayMarkerPosition(date, activeId, finalPos);
        } else {
          // Placed sticker
          const stk = stickers.find((s) => s.id === activeId);
          if (stk) {
            await updateStickerTransform(stk.id, { x: finalPos.x, y: finalPos.y });
          }
        }
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

  const selectedDetails = getSelectedItemDetails();

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
          <span>Перетаскивай значки и стикер заметки пальцем, нажимай для изменения размера!</span>
        </div>

        {/* Enlarged Day Cell Canvas */}
        <div
          ref={canvasRef}
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
            const noteScale = getItemScale('note');
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
                  left: `calc(50% + ${noteCoords.x}%)`,
                  top: `calc(50% + ${noteCoords.y}%)`,
                  transform: `translate(-50%, -50%) rotate(${dayInfo.noteSticker?.rotation || 0}deg) scale(${noteScale})`
                }}
                onPointerDown={(e) => handlePointerDown(e, 'note', noteCoords.x, noteCoords.y)}
                onClick={() => setSelectedItemId('note')}
                title="Стикер-заметка (нажми для размера, перетаскивай)"
              >
                <div className={`canvas-note-decor decor-${style}`} />
                <div className="canvas-note-text">{textPreview}</div>
              </div>
            );
          })()}

          {/* DRAGGABLE CIRCULAR ACTIVITY BADGES */}
          {activities.map((actId, idx) => {
            const act = ACTIVITY_MAP[actId];
            const coords = getMarkerCoords(actId, idx);
            const scale = getItemScale(actId);
            const isSelected = selectedItemId === actId;
            const customLabel = settings.activityCustomLabels?.[actId] || act?.label || actId;

            return (
              <div
                key={actId}
                className={`canvas-activity-badge ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `calc(50% + ${coords.x}%)`,
                  top: `calc(50% + ${coords.y}%)`,
                  transform: `translate(-50%, -50%) scale(${scale})`
                }}
                onPointerDown={(e) => handlePointerDown(e, actId, coords.x, coords.y)}
                onClick={() => setSelectedItemId(actId)}
                title={`${customLabel} (нажми для размера, перетаскивай)`}
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

          {/* DRAGGABLE PLACED STICKERS */}
          {stickers.map((stk) => {
            const item = STICKERS_MAP[stk.stickerId];
            if (!item) return null;
            const isSelected = selectedItemId === stk.id;
            const currentPos = livePositions[stk.id] || { x: stk.x, y: stk.y };
            const scale = stk.scale ?? 1.0;

            return (
              <div
                key={stk.id}
                className={`canvas-placed-sticker ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `calc(50% + ${currentPos.x}%)`,
                  top: `calc(50% + ${currentPos.y}%)`,
                  transform: `translate(-50%, -50%) rotate(${stk.rotation || 0}deg) scale(${scale})`
                }}
                onPointerDown={(e) => handlePointerDown(e, stk.id, currentPos.x, currentPos.y)}
                onClick={() => setSelectedItemId(stk.id)}
                title={`${item.name} (нажми для размера, перетаскивай)`}
              >
                <img
                  src={`./${item.imagePath}?v=cutout2`}
                  alt={item.name}
                  draggable={false}
                />
              </div>
            );
          })}

          {activities.length === 0 && !hasNote && stickers.length === 0 && (
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

        {/* RESIZE AND SCALE CONTROLS BAR (Photo & User feedback) */}
        {selectedDetails && (
          <div className="marker-resize-bar">
            <div className="resize-item-info">
              <span className="resize-item-name">{selectedDetails.label}</span>
            </div>

            <div className="resize-controls-group">
              <button
                type="button"
                className="btn-resize-step"
                onClick={() => handleAdjustScale(-0.1)}
                disabled={selectedDetails.scale <= 0.45}
                title="Уменьшить размер (−10%)"
                aria-label="Уменьшить"
              >
                <Minus size={16} />
              </button>

              <span className="resize-value-badge" title="Текущий масштаб">
                {Math.round(selectedDetails.scale * 100)}%
              </span>

              <button
                type="button"
                className="btn-resize-step"
                onClick={() => handleAdjustScale(0.1)}
                disabled={selectedDetails.scale >= 1.75}
                title="Увеличить размер (+10%)"
                aria-label="Увеличить"
              >
                <Plus size={16} />
              </button>

              <button
                type="button"
                className="btn-resize-reset"
                onClick={handleResetScale}
                title="Вернуть стандартный размер (100%)"
              >
                100%
              </button>

              {selectedDetails.canDelete && selectedItemId && (
                <button
                  type="button"
                  className="btn-resize-delete"
                  onClick={() => handleDeleteSticker(selectedItemId)}
                  title="Убрать этот стикер с даты"
                  aria-label="Удалить"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
