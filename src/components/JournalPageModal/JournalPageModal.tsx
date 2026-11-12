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
import { STICKERS_MANIFEST, STICKERS_MAP } from '../../data/stickersManifest';
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

  const [activeDecorTab, setActiveDecorTab] = useState<'Гербарий' | 'Сухоцветы' | 'Винтаж' | 'Скотч' | 'Котики'>('Сухоцветы');
  const [isDecorTrayOpen, setIsDecorTrayOpen] = useState(true);

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
    await addJournalDecoration(date, stickerId);
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
    if (!dragRef.current || !dragRef.current.isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    // Relative to page container
    const deltaPercentX = deltaX / 3.4;
    const deltaPercentY = deltaY / 4.4;

    const newX = Math.round(Math.max(-46, Math.min(46, dragRef.current.origX + deltaPercentX)));
    const newY = Math.round(Math.max(-46, Math.min(46, dragRef.current.origY + deltaPercentY)));

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
                placeholder="Напиши сюда мысли, воспоминания, планы или секретики этого дня... Добавь сухоцветы, марки или котиков, чтобы оформить страничку!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {/* Draggable Placed Decorations directly on the Page */}
            {decorations.map((d) => {
              const imgSrc = resolveStickerImage(d.stickerId);
              const isSelected = d.id === selectedDecorId;
              return (
                <div
                  key={d.id}
                  className={`journal-page-placed-decor ${isSelected ? 'selected' : ''}`}
                  style={{
                    transform: `translate(${d.x}%, ${d.y}%) scale(${d.scale}) rotate(${d.rotation}deg)`
                  }}
                  onPointerDown={(e) => handlePointerDown(e, d.id, d.x, d.y)}
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
              {(['Сухоцветы', 'Гербарий', 'Винтаж', 'Скотч', 'Котики'] as const).map((cat) => (
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
              {activeDecorTab === 'Котики'
                ? STICKERS_MANIFEST.slice(0, 16).map((item) => (
                    <button
                      key={item.id}
                      className="tray-sticker-item-btn"
                      onClick={() => handleAddDecor(item.id)}
                      title={`Приклеить: ${item.name}`}
                    >
                      <img src={`./${item.imagePath}`} alt={item.name} />
                    </button>
                  ))
                : JOURNAL_DECOR_ITEMS.filter((item) => item.category === activeDecorTab).map((item) => (
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
