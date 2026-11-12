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
  JOURNAL_DECOR_MAP
} from '../../data/journalDecorData';
import { STICKERS_MAP } from '../../data/stickersManifest';
import { JournalPaperType, NoteStickerStyle, NoteStickerConfig } from '../../types';
import { playPaperRustle, playStickerPop, playBubbleTap, triggerHaptic } from '../../services/soundEffects';

export type UnifiedFormatId =
  | 'paper-clip'
  | 'washi-tape'
  | 'spiral-pad'
  | 'cloud'
  | 'ribbon-card'
  | 'vintage'
  | 'lavender'
  | 'sage_herbal';

export interface UnifiedFormatOption {
  id: UnifiedFormatId;
  name: string;
  icon: string;
  desc: string;
  paperType: JournalPaperType;
  stickerStyle: NoteStickerStyle;
  previewBg: string;
}

export const UNIFIED_FORMAT_OPTIONS: UnifiedFormatOption[] = [
  {
    id: 'paper-clip',
    name: 'Со скрепкой',
    icon: '📎',
    desc: 'Светлый разлинованный листочек с металлической скрепкой',
    paperType: 'lined',
    stickerStyle: 'paper-clip',
    previewBg: '#FFFDF9'
  },
  {
    id: 'washi-tape',
    name: 'Со скотчем',
    icon: '🏷️',
    desc: 'Крафтовый стикер с декоративным скотчем по углам',
    paperType: 'kraft',
    stickerStyle: 'washi-tape',
    previewBg: '#DCC3A3'
  },
  {
    id: 'spiral-pad',
    name: 'Спиральный блокнот',
    icon: '📓',
    desc: 'Страничка из спирального блокнота',
    paperType: 'grid',
    stickerStyle: 'spiral-pad',
    previewBg: '#FDFBF7'
  },
  {
    id: 'cloud',
    name: 'Облачко',
    icon: '☁️',
    desc: 'Нежное облачко для мыслей и секретиков',
    paperType: 'lined',
    stickerStyle: 'cloud',
    previewBg: '#F3F6FD'
  },
  {
    id: 'ribbon-card',
    name: 'С бантиком',
    icon: '🎀',
    desc: 'Элегантная карточка с аккуратным бантиком',
    paperType: 'lined',
    stickerStyle: 'ribbon-card',
    previewBg: '#FAF2F4'
  },
  {
    id: 'vintage',
    name: 'Винтажный свиток',
    icon: '📜',
    desc: 'Состаренный винтажный пергамент',
    paperType: 'vintage',
    stickerStyle: 'dark-craft',
    previewBg: '#F4ECD8'
  },
  {
    id: 'lavender',
    name: 'Лаванда',
    icon: '💜',
    desc: 'Нежнейшая пастельная лавандовая бумага',
    paperType: 'lavender',
    stickerStyle: 'paper-clip',
    previewBg: '#ECE6F4'
  },
  {
    id: 'sage_herbal',
    name: 'Шалфей',
    icon: '🌿',
    desc: 'Спокойный ботанический шалфейный лист',
    paperType: 'sage_herbal',
    stickerStyle: 'paper-clip',
    previewBg: '#E7EFE3'
  }
];

interface JournalPageModalProps {
  date: string;
  onClose: () => void;
}

export const JournalPageModal: React.FC<JournalPageModalProps> = ({ date, onClose }) => {
  const {
    settings,
    getDayInfo,
    updateJournalPage,
    updateDayLifeDetails,
    addJournalDecoration,
    updateJournalDecorationTransform,
    removeJournalDecoration
  } = useApp();

  const dayInfo = getDayInfo(date);
  const existingJournal = dayInfo.journalPage;
  const existingNoteSticker = dayInfo.noteSticker;

  // Determine initial format from existing day data
  const getInitialFormat = (): UnifiedFormatId => {
    const existingStickerStyle = existingNoteSticker?.style;
    const existingPaperType = existingJournal?.paperType;

    if (existingStickerStyle === 'washi-tape') return 'washi-tape';
    if (existingStickerStyle === 'spiral-pad') return 'spiral-pad';
    if (existingStickerStyle === 'cloud') return 'cloud';
    if (existingStickerStyle === 'ribbon-card') return 'ribbon-card';
    if (existingStickerStyle === 'dark-craft') return 'vintage';

    if (existingPaperType === 'kraft') return 'washi-tape';
    if (existingPaperType === 'grid') return 'spiral-pad';
    if (existingPaperType === 'vintage') return 'vintage';
    if (existingPaperType === 'lavender') return 'lavender';
    if (existingPaperType === 'sage_herbal') return 'sage_herbal';

    return 'paper-clip';
  };

  const [selectedFormat, setSelectedFormat] = useState<UnifiedFormatId>(getInitialFormat());
  const [title, setTitle] = useState<string>(existingJournal?.title || '');
  const [content, setContent] = useState<string>(
    existingJournal?.content || existingNoteSticker?.text || dayInfo.note || ''
  );
  const [selectedDecorId, setSelectedDecorId] = useState<string | null>(null);

  const [activeDecorTab, setActiveDecorTab] = useState<'Гербарий' | 'Сухоцветы' | 'Винтаж' | 'Уют' | 'Скотч'>('Сухоцветы');
  const [isDecorTrayOpen, setIsDecorTrayOpen] = useState(true);

  const sheetRef = useRef<HTMLDivElement>(null);

  const formattedDate = formatFullDateRU(date);
  const currentOption = UNIFIED_FORMAT_OPTIONS.find((o) => o.id === selectedFormat) || UNIFIED_FORMAT_OPTIONS[0];

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

  // Save / Glue note and journal page to calendar
  const handleSave = async () => {
    playPaperRustle(settings.soundEnabled !== false);
    triggerHaptic(12, settings.hapticsEnabled !== false);

    const trimmedContent = content.trim();

    const noteStickerConfig: NoteStickerConfig | null = trimmedContent
      ? {
          style: currentOption.stickerStyle,
          text: trimmedContent,
          x: existingNoteSticker?.x || 0,
          y: existingNoteSticker?.y || 0,
          rotation: existingNoteSticker?.rotation || (Math.random() * 4 - 2)
        }
      : null;

    // Atomically update journal page and note sticker in one update
    await updateJournalPage(
      date,
      {
        paperType: currentOption.paperType,
        title: title.trim(),
        content: trimmedContent
      },
      noteStickerConfig
    );

    // Also update life details note for backwards compatibility
    await updateDayLifeDetails(date, {
      noteSticker: noteStickerConfig || undefined,
      note: trimmedContent
    });

    onClose();
  };

  // Remove note sticker and journal content
  const handleRemove = async () => {
    playPaperRustle(settings.soundEnabled !== false);
    triggerHaptic(8, settings.hapticsEnabled !== false);

    await updateJournalPage(
      date,
      {
        title: '',
        content: '',
        decorations: []
      },
      null
    );

    await updateDayLifeDetails(date, {
      noteSticker: undefined,
      note: ''
    });

    setTitle('');
    setContent('');
    setSelectedDecorId(null);
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
            <span className="topbar-badge">Заметка и страничка ежедневника</span>
            <span className="topbar-date">{formattedDate.split(',')[0]}</span>
          </div>

          <div className="topbar-actions">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setIsDecorTrayOpen(!isDecorTrayOpen)}
              title="Панель сухоцветов, марок и скотча"
            >
              <Sparkles size={14} />
              <span>Сухоцветы и скотч</span>
            </button>
            <button className="btn-icon" onClick={onClose} aria-label="Закрыть">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper & Sticker Format Selector (Unified top bar) */}
        <div className="journal-paper-type-row">
          <span className="paper-row-label">Формат:</span>
          <div className="paper-options-strip">
            {UNIFIED_FORMAT_OPTIONS.map((f) => {
              const isSelected = selectedFormat === f.id;
              return (
                <button
                  key={f.id}
                  className={`paper-choice-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    playBubbleTap(settings.soundEnabled !== false);
                    setSelectedFormat(f.id);
                  }}
                  title={f.desc}
                >
                  <span className="paper-format-icon">{f.icon}</span>
                  <span>{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The Authentic Scrapbook Journal Sheet */}
        <div
          ref={sheetRef}
          className={`journal-scrapbook-sheet paper-theme-${currentOption.paperType} format-${selectedFormat}`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Format Decor: 📎 Metal Paperclip on top for 'Со скрепкой' */}
          {selectedFormat === 'paper-clip' && (
            <div className="journal-sheet-clip-decor" aria-hidden="true">
              <svg viewBox="0 0 24 48" fill="none" className="journal-paperclip-svg">
                <path
                  d="M7 6v30a5 5 0 0 0 10 0V11a3.5 3.5 0 0 0-7 0v24"
                  stroke="#3F683B"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          {/* Format Decor: 🏷️ Washi Tape Corners for 'Со скотчем' */}
          {selectedFormat === 'washi-tape' && (
            <>
              <div className="journal-page-washi-corner top-left" aria-hidden="true" />
              <div className="journal-page-washi-corner top-right" aria-hidden="true" />
            </>
          )}

          {/* Format Decor: 📓 Spiral Binder Rings for 'Спиральный блокнот' */}
          {selectedFormat === 'spiral-pad' && (
            <div className="journal-binder-rings" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="binder-ring-hole">
                  <div className="binder-ring-clip" />
                </div>
              ))}
            </div>
          )}

          {/* Format Decor: ☁️ Cloud Badge */}
          {selectedFormat === 'cloud' && (
            <div className="journal-sheet-badge-decor cloud" aria-hidden="true">
              ☁️
            </div>
          )}

          {/* Format Decor: 🎀 Ribbon Bow */}
          {selectedFormat === 'ribbon-card' && (
            <div className="journal-sheet-badge-decor ribbon" aria-hidden="true">
              🎀
            </div>
          )}

          {/* Format Decor: 📜 Vintage Wax Seal */}
          {selectedFormat === 'vintage' && (
            <div className="journal-sheet-badge-decor vintage" aria-hidden="true">
              📜
            </div>
          )}

          {/* Format Decor: 💜 Lavender Sprig */}
          {selectedFormat === 'lavender' && (
            <div className="journal-sheet-badge-decor lavender" aria-hidden="true">
              💜
            </div>
          )}

          {/* Format Decor: 🌿 Sage Leaves */}
          {selectedFormat === 'sage_herbal' && (
            <div className="journal-sheet-badge-decor sage" aria-hidden="true">
              🌿
            </div>
          )}

          {/* Page Content Container */}
          <div className="journal-page-inner">
            {/* Header / Date Stamp & Optional Title */}
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

            {/* Ruled Handwriting Journal & Note Textarea */}
            <div className="journal-lines-container">
              <textarea
                className="journal-ruled-textarea"
                rows={9}
                placeholder="Напиши сюда заметку, мысль или секретик... Когда сохранишь, в квадратике этого дня появится милый стикер!"
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

        {/* Bottom Drawer: Botanicals, Dried Flowers, Vintage & Washi Strips */}
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
          <button className="btn btn-outline btn-remove-journal" onClick={handleRemove}>
            <Trash2 size={14} />
            <span>Убрать стикер</span>
          </button>

          <button className="btn btn-primary btn-save-journal" onClick={handleSave}>
            <Check size={16} />
            <span>Приклеить в календарь</span>
          </button>
        </div>
      </div>
    </div>
  );
};
