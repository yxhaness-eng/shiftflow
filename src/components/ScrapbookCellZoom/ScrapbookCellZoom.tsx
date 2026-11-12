import React, { useState, useRef } from 'react';
import {
  X,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Trash2,
  Sparkles,
  Plus,
  Edit3,
  Tag,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatFullDateRU } from '../../utils/dateUtils';
import { STICKERS_MAP } from '../../data/stickersManifest';
import { ACTIVITY_MAP, INTIMATE_PRESETS } from '../../data/lifeTrackerData';
import { StickerPicker } from '../StickerPicker/StickerPicker';
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
    addStickerToDate,
    updateStickerTransform,
    removeSticker,
    updateNoteStickerTransform
  } = useApp();

  const dayInfo = getDayInfo(date);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null); // 'note' or stickerId
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);

  const formattedDate = formatFullDateRU(date);

  // Dragging state
  const dragRef = useRef<{
    type: 'sticker' | 'note';
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    isDragging: boolean;
  } | null>(null);

  const currentStickers = dayInfo.stickers;
  const activeSticker = currentStickers.find((s) => s.id === selectedItemId);

  // Sticker adjustments
  const handleRotateSticker = (deltaDeg: number) => {
    if (!activeSticker) return;
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(6, settings.hapticsEnabled !== false);
    const newRot = Math.round((activeSticker.rotation + deltaDeg) * 10) / 10;
    updateStickerTransform(activeSticker.id, { rotation: newRot });
  };

  const handleScaleSticker = (deltaScale: number) => {
    if (!activeSticker) return;
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(6, settings.hapticsEnabled !== false);
    const newScale = Math.max(0.5, Math.min(1.7, Math.round((activeSticker.scale + deltaScale) * 10) / 10));
    updateStickerTransform(activeSticker.id, { scale: newScale });
  };

  const handlePointerDown = (
    e: React.PointerEvent,
    type: 'sticker' | 'note',
    id: string,
    initialX: number,
    initialY: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItemId(id);
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(6, settings.hapticsEnabled !== false);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    dragRef.current = {
      type,
      id,
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

    // Zoomed cell is ~320px, so 3.2px corresponds to 1%
    const deltaPercentX = deltaX / 3.2;
    const deltaPercentY = deltaY / 3.2;

    const newX = Math.round(Math.max(-46, Math.min(46, dragRef.current.origX + deltaPercentX)));
    const newY = Math.round(Math.max(-46, Math.min(46, dragRef.current.origY + deltaPercentY)));

    if (dragRef.current.type === 'sticker') {
      updateStickerTransform(dragRef.current.id, { x: newX, y: newY });
    } else if (dragRef.current.type === 'note') {
      updateNoteStickerTransform(date, { x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current && dragRef.current.isDragging) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      playStickerPop(settings.soundEnabled !== false);
      triggerHaptic(10, settings.hapticsEnabled !== false);
      dragRef.current.isDragging = false;
      dragRef.current = null;
    }
  };

  // Find intimate preset emoji if active
  const intimatePreset = INTIMATE_PRESETS.find((p) => p.id === dayInfo.intimate?.type);

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
            <span>Отметки дня</span>
          </button>

          <button
            className="toolbar-pill-btn"
            onClick={() => {
              playBubbleTap(settings.soundEnabled !== false);
              onOpenNoteSticker();
            }}
          >
            <Edit3 size={14} />
            <span>Стикер-заметка</span>
          </button>

          <button
            className="toolbar-pill-btn primary"
            onClick={() => {
              playBubbleTap(settings.soundEnabled !== false);
              setIsStickerPickerOpen(true);
            }}
          >
            <Plus size={14} />
            <span>Добавить наклейку</span>
          </button>
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

          {/* Intimate Badge if present */}
          {dayInfo.intimate?.hadSex && (
            <div className="enlarged-intimate-badge" title="Отметка интимной жизни">
              <span className="intimate-badge-icon">💕</span>
              <span className="intimate-badge-type">
                {dayInfo.intimate.customType || intimatePreset?.emoji || '🔥'}
              </span>
            </div>
          )}

          {/* Activity Badges Strip */}
          {dayInfo.activities && dayInfo.activities.length > 0 && (
            <div className="enlarged-activities-strip">
              {dayInfo.activities.map((actId) => {
                const act = ACTIVITY_MAP[actId];
                return (
                  <div key={actId} className="enlarged-activity-icon" title={act?.label || actId}>
                    {act?.iconImage ? (
                      <img src={`./${act.iconImage}`} alt={act.label} />
                    ) : (
                      <span>{act?.emoji || '🏷️'}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Paper Note Sticker on Canvas (Draggable!) */}
          {dayInfo.noteSticker && (
            <div
              className={`canvas-note-sticker style-${dayInfo.noteSticker.style} ${
                selectedItemId === 'note' ? 'selected' : ''
              }`}
              style={{
                transform: `translate(${dayInfo.noteSticker.x || 0}%, ${
                  dayInfo.noteSticker.y || 0
                }%) rotate(${dayInfo.noteSticker.rotation || 0}deg)`
              }}
              onPointerDown={(e) =>
                handlePointerDown(
                  e,
                  'note',
                  'note',
                  dayInfo.noteSticker?.x || 0,
                  dayInfo.noteSticker?.y || 0
                )
              }
            >
              <div className={`canvas-note-decor decor-${dayInfo.noteSticker.style}`} />
              <div className="canvas-note-text">{dayInfo.noteSticker.text}</div>
            </div>
          )}

          {/* Placed Stickers (Draggable!) */}
          {currentStickers.map((stk) => {
            const item = STICKERS_MAP[stk.stickerId];
            const isSelected = stk.id === selectedItemId;

            return (
              <div
                key={stk.id}
                className={`canvas-placed-sticker ${isSelected ? 'selected' : ''}`}
                style={{
                  transform: `translate(${stk.x}%, ${stk.y}%) scale(${stk.scale}) rotate(${stk.rotation}deg)`
                }}
                onPointerDown={(e) => handlePointerDown(e, 'sticker', stk.id, stk.x, stk.y)}
              >
                <img
                  src={`./${item?.imagePath || ''}`}
                  alt={item?.name || 'Стикер'}
                  draggable={false}
                />
              </div>
            );
          })}

          <div className="canvas-drag-hint">
            <Sparkles size={12} />
            <span>Перетаскивайте стикеры и заметку пальцем или мышкой</span>
          </div>
        </div>

        {/* Selected Sticker Controls */}
        {activeSticker && (
          <div className="sticker-transform-bar">
            <span className="transform-bar-label">Выбран стикер:</span>
            <div className="transform-bar-actions">
              <button
                className="btn-icon-sm"
                onClick={() => handleRotateSticker(-15)}
                title="Повернуть влево"
              >
                <RotateCcw size={14} />
              </button>
              <button
                className="btn-icon-sm"
                onClick={() => handleRotateSticker(15)}
                title="Повернуть вправо"
              >
                <RotateCw size={14} />
              </button>
              <button
                className="btn-icon-sm"
                onClick={() => handleScaleSticker(-0.15)}
                title="Уменьшить"
              >
                <ZoomOut size={14} />
              </button>
              <button
                className="btn-icon-sm"
                onClick={() => handleScaleSticker(0.15)}
                title="Увеличить"
              >
                <ZoomIn size={14} />
              </button>
              <button
                className="btn-icon-sm danger"
                onClick={() => {
                  playStickerPop(settings.soundEnabled !== false);
                  removeSticker(activeSticker.id);
                  setSelectedItemId(null);
                }}
                title="Удалить"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer Done Button */}
        <div className="scrapbook-zoom-footer">
          <button
            className="btn-done-zoom"
            onClick={() => {
              playBubbleTap(settings.soundEnabled !== false);
              onClose();
            }}
          >
            <Check size={16} />
            <span>Готово</span>
          </button>
        </div>

        {/* Sticker Picker Modal */}
        {isStickerPickerOpen && (
          <StickerPicker
            isOpen={isStickerPickerOpen}
            targetDateTitle={formattedDate}
            onSelectSticker={async (stickerId: string) => {
              playStickerPop(settings.soundEnabled !== false);
              const newStk = await addStickerToDate(date, stickerId);
              setSelectedItemId(newStk.id);
              setIsStickerPickerOpen(false);
            }}
            onClose={() => setIsStickerPickerOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
