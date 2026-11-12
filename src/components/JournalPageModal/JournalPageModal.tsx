import React, { useState, useRef } from 'react';
import {
  X,
  Check,
  Trash2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatFullDateRU } from '../../utils/dateUtils';
import {
  JOURNAL_DECOR_ITEMS,
  JOURNAL_DECOR_MAP,
  JOURNAL_PAPER_OPTIONS
} from '../../data/journalDecorData';
import { STICKERS_MAP } from '../../data/stickersManifest';
import { JournalPaperType } from '../../types';
import { playPaperRustle, playStickerPop, playBubbleTap, triggerHaptic } from '../../services/soundEffects';

interface JournalPageModalProps {
  date: string;
  onClose: () => void;
}

export const JournalPageModal: React.FC<JournalPageModalProps> = ({ date, onClose }) => {
  const {
    settings,
    getDayInfo,
    updateJournalPage,
    addJournalDecoration,
    updateJournalDecorationTransform,
    removeJournalDecoration
  } = useApp();

  const dayInfo = getDayInfo(date);
  const existingJournal = dayInfo.journalPage;

  const [paperType, setPaperType] = useState<JournalPaperType>(existingJournal?.paperType || 'lined');
  const [title, setTitle] = useState<string>(existingJournal?.title || '');
  const [content, setContent] = useState<string>(existingJournal?.content || dayInfo.note || '');
  const [selectedDecorId, setSelectedDecorId] = useState<string | null>(null);

  const [activeDecorTab, setActiveDecorTab] = useState<'Гербарий' | 'Сухоцветы' | 'Винтаж' | 'Уют' | 'Скотч'>('Сухоцветы');
  const [isDecorTrayOpen, setIsDecorTrayOpen] = useState(true);

  const sheetRef = useRef<HTMLDivElement>(null);

  const formattedDate = formatFullDateRU(date);

  // Dragging state
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    isDragging: boolean;
  } | null>(null);

  const decorations = existingJournal?.decorations || [];
  const activeDecor = decorations.find((d) => d.id === selectedDecorId);

  // Helper to normalize coordinates to [5, 95] with backward compatibility for old (0,0) or negative coords
  const getDecorCoords = (d: { x?: number; y?: number }) => {
    let x = d.x ?? 50;
    let y = d.y ?? 45;

    // Backward compatibility: old format was centered at 0 in range [-46, 46]
    if (x < 0) {
      x = Math.max(5, Math.min(95, Math.round(x + 50)));
    } else if (x === 0 && y === 0) {
      x = 50;
      y = 45;
    }
    if (y < 0) {
      y = Math.max(5, Math.min(95, Math.round(y + 50)));
    }

    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y))
    };
  };

  // Save journal page
  const handleSave = async () => {
    playPaperRustle(settings.soundEnabled !== false);
    triggerHaptic(12, settings.hapticsEnabled !== false);

    await updateJournalPage(date, {
      paperType,
      title: title.trim(),
      content: content.trim()
    });
    onClose();
  };

  // Add a decoration
  const handleAddDecor = async (stickerId: string) => {
    playStickerPop(settings.soundEnabled !== false);
    triggerHaptic(8, settings.hapticsEnabled !== false);
    const randomOffsetX = Math.round(50 + (Math.random() * 24 - 12));
    const randomOffsetY = Math.round(45 + (Math.random() * 24 - 12));
    await addJournalDecoration(date, stickerId, { x: randomOffsetX, y: randomOffsetY });
  };

  // Clear journal page
  const handleClear = async () => {
    if (window.confirm('Очистить текст и оформление этой странички?')) {
      playBubbleTap(settings.soundEnabled !== false);
      await updateJournalPage(date, {
        title: '',
        content: '',
        decorations: []
      });
      setTitle('');
      setContent('');
      setSelectedDecorId(null);
    }
  };

  // Rotate decoration
  const handleRotate = (delta: number) => {
    if (!activeDecor) return;
    playBubbleTap(settings.soundEnabled !== false);
    const newRot = Math.round((activeDecor.rotation + delta) * 10) / 10;
    updateJournalDecorationTransform(date, activeDecor.id, { rotation: newRot });
  };

  // Scale decoration
  const handleScale = (delta: number) => {
    if (!activeDecor) return;
    playBubbleTap(settings.soundEnabled !== false);
    const newScale = Math.max(0.4, Math.min(1.9, Math.round((activeDecor.scale + delta) * 10) / 10));
    updateJournalDecorationTransform(date, activeDecor.id, { scale: newScale });
  };

  // Pointer drag handling
  const handlePointerDown = (e: React.PointerEvent, id: string, initialX: number, initialY: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDecorId(id);
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(6, settings.hapticsEnabled !== false);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    dragRef.current = {
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
    if (!dragRef.current || !dragRef.current.isDragging || !sheetRef.current) return;

    const rect = sheetRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaX = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragRef.current.startY) / rect.height) * 100;

    const newX = Math.round(Math.max(5, Math.min(95, dragRef.current.origX + deltaX)));
    const newY = Math.round(Math.max(5, Math.min(95, dragRef.current.origY + deltaY)));

    updateJournalDecorationTransform(date, dragRef.current.id, { x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current && dragRef.current.isDragging) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      playStickerPop(settings.soundEnabled !== false);
      triggerHaptic(8, settings.hapticsEnabled !== false);
      dragRef.current.isDragging = false;
      dragRef.current = null;
    }
  };

  // Resolve sticker image by ID
  const resolveStickerImage = (stickerId: string): string => {
    if (JOURNAL_DECOR_MAP[stickerId]) {
      return JOURNAL_DECOR_MAP[stickerId].imagePath;
    }
    if (STICKERS_MAP[stickerId]) {
      return STICKERS_MAP[stickerId].imagePath;
    }
    return '';
  };

  return (
    <div className="journal-page-overlay" onClick={onClose}>
      <div className="journal-page-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Control Bar */}
        <div className="journal-page-topbar">
          <div className="topbar-date-group">
            <span className="topbar-badge">Страничка ежедневника</span>
            <span className="topbar-date">{formattedDate.split(',')[0]}</span>
          </div>

          <div className="topbar-actions">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setIsDecorTrayOpen(!isDecorTrayOpen)}
              title="Панель наклеек и гербария"
            >
              <Sparkles size={14} />
              <span>Наклейки и скотч</span>
            </button>
            <button className="btn-icon" onClick={onClose} aria-label="Закрыть">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper Style Selector */}
        <div className="journal-paper-type-row">
          <span className="paper-row-label">Бумага:</span>
          <div className="paper-options-strip">
            {JOURNAL_PAPER_OPTIONS.map((p) => {
              const isSelected = paperType === p.id;
              return (
                <button
                  key={p.id}
                  className={`paper-choice-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    playBubbleTap(settings.soundEnabled !== false);
                    setPaperType(p.id);
                  }}
                  title={p.desc}
                >
                  <span className="paper-swatch" style={{ backgroundColor: p.previewBg }} />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The Authentic Journal Scrapbook Page */}
        <div
          ref={sheetRef}
          className={`journal-scrapbook-sheet paper-theme-${paperType}`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Left Binder Spiral Rings */}
          <div className="journal-binder-rings">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="binder-ring-hole">
                <div className="binder-ring-clip" />
              </div>
            ))}
          </div>

          {/* Decorative Corner Washi Tapes */}
          <div className="journal-page-washi-corner top-left" />
          <div className="journal-page-washi-corner top-right" />

          {/* Page Content Container */}
          <div className="journal-page-inner">
            {/* Header / Date Stamp */}
            <div className="journal-page-header">
              <span className="journal-stamp-date">{formattedDate}</span>
              <input
                type="text"
                className="journal-title-input"
                placeholder="Заголовок странички или настроение..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Ruled Handwriting Journal Textarea */}
            <div className="journal-lines-container">
              <textarea
                className="journal-ruled-textarea"
                rows={9}
                placeholder="Напиши сюда мысли, воспоминания, планы или секретики этого дня... Добавь сухоцветы, марки или скотч, чтобы оформить страничку!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>

          {/* Draggable Placed Decorations Layer directly on the Page */}
          <div className="journal-decor-layer">
            {decorations.map((d) => {
              const imgSrc = resolveStickerImage(d.stickerId);
              const isSelected = d.id === selectedDecorId;
              const { x: posX, y: posY } = getDecorCoords(d);
              return (
                <div
                  key={d.id}
                  className={`journal-page-placed-decor ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transform: `translate(-50%, -50%) rotate(${d.rotation || 0}deg) scale(${d.scale || 1})`,
                    pointerEvents: 'auto'
                  }}
                  onPointerDown={(e) => handlePointerDown(e, d.id, posX, posY)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <img src={`./${imgSrc}`} alt="Декор" draggable={false} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Decor Controls Toolbar */}
        {activeDecor && (
          <div className="journal-decor-controls-bar">
            <span className="decor-controls-label">Наклейка на странице:</span>
            <div className="decor-controls-buttons">
              <button className="btn-icon-sm" onClick={() => handleRotate(-15)} title="Повернуть влево">
                <RotateCcw size={14} />
              </button>
              <button className="btn-icon-sm" onClick={() => handleRotate(15)} title="Повернуть вправо">
                <RotateCw size={14} />
              </button>
              <button className="btn-icon-sm" onClick={() => handleScale(-0.15)} title="Уменьшить">
                <ZoomOut size={14} />
              </button>
              <button className="btn-icon-sm" onClick={() => handleScale(0.15)} title="Увеличить">
                <ZoomIn size={14} />
              </button>
              <button
                className="btn-icon-sm danger"
                onClick={() => {
                  removeJournalDecoration(date, activeDecor.id);
                  setSelectedDecorId(null);
                }}
                title="Удалить со странички"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Sticker / Decorator Tray */}
        {isDecorTrayOpen && (
          <div className="journal-stickers-tray">
            {/* Category Tabs */}
            <div className="tray-categories-row">
              {(['Сухоцветы', 'Гербарий', 'Винтаж', 'Уют', 'Скотч'] as const).map((cat) => (
                <button
                  key={cat}
                  className={`tray-cat-pill ${activeDecorTab === cat ? 'active' : ''}`}
                  onClick={() => {
                    playBubbleTap(settings.soundEnabled !== false);
                    setActiveDecorTab(cat);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sticker Items Strip */}
            <div className="tray-stickers-strip">
              {JOURNAL_DECOR_ITEMS.filter((item) => item.category === activeDecorTab).map((item) => (
                <button
                  key={item.id}
                  className="tray-sticker-item-btn"
                  onClick={() => handleAddDecor(item.id)}
                  title={`Приклеить: ${item.name}`}
                >
                  <img src={`./${item.imagePath}`} alt={item.name} />
                  <span className="tray-item-name">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="journal-page-footer">
          <button className="btn btn-outline" onClick={handleClear}>
            <Trash2 size={14} />
            <span>Очистить</span>
          </button>

          <button className="btn btn-primary btn-save-journal" onClick={handleSave}>
            <Check size={16} />
            <span>Сохранить страничку</span>
          </button>
        </div>
      </div>
    </div>
  );
};
