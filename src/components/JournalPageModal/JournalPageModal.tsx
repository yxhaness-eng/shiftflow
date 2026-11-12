import React, { useState } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatFullDateRU } from '../../utils/dateUtils';
import { NoteStickerStyle, NoteStickerConfig } from '../../types';
import { playPaperRustle, playBubbleTap, triggerHaptic } from '../../services/soundEffects';

export interface NoteStickerChoice {
  style: NoteStickerStyle;
  label: string;
  icon: string;
  desc: string;
}

export const NOTE_STICKER_CHOICES: NoteStickerChoice[] = [
  { style: 'paper-clip', label: 'Со скрепкой', icon: '📎', desc: 'Белый листочек с металлической скрепкой' },
  { style: 'washi-tape', label: 'Со скотчем', icon: '🏷️', desc: 'Крафтовый стикер с декоративным скотчем' },
  { style: 'spiral-pad', label: 'Блокнот', icon: '📓', desc: 'Страничка из спирального блокнота' },
  { style: 'cloud', label: 'Облачко', icon: '☁️', desc: 'Нежное облачко для мыслей и секретиков' },
  { style: 'ribbon-card', label: 'С бантиком', icon: '🎀', desc: 'Элегантная карточка с аккуратным бантиком' },
  { style: 'tag', label: 'Ярлычок', icon: '🏷️', desc: 'Скрапбук-тег с дырочкой' },
  { style: 'dark-craft', label: 'Тёмный крафт', icon: '📜', desc: 'Уютный тёплый крафтовый лист' }
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
    updateDayLifeDetails
  } = useApp();

  const dayInfo = getDayInfo(date);
  const existingJournal = dayInfo.journalPage;
  const existingNoteSticker = dayInfo.noteSticker;

  const [selectedStyle, setSelectedStyle] = useState<NoteStickerStyle>(
    existingNoteSticker?.style || 'paper-clip'
  );
  const [title, setTitle] = useState<string>(existingJournal?.title || '');
  const [content, setContent] = useState<string>(
    existingJournal?.content || existingNoteSticker?.text || dayInfo.note || ''
  );

  const formattedDate = formatFullDateRU(date);

  // Save note & glue to calendar cell
  const handleSave = async () => {
    playPaperRustle(settings.soundEnabled !== false);
    triggerHaptic(12, settings.hapticsEnabled !== false);

    const trimmedContent = content.trim();

    const noteStickerConfig: NoteStickerConfig | null = trimmedContent
      ? {
          style: selectedStyle,
          text: trimmedContent,
          x: existingNoteSticker?.x || 0,
          y: existingNoteSticker?.y || 0,
          rotation: existingNoteSticker?.rotation || (Math.random() * 4 - 2)
        }
      : null;

    await updateJournalPage(
      date,
      {
        paperType: 'lined',
        title: title.trim(),
        content: trimmedContent,
        decorations: []
      },
      noteStickerConfig
    );

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
    onClose();
  };

  return (
    <div className="journal-page-overlay" onClick={onClose}>
      <div className="journal-page-container" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="journal-page-header">
          <div>
            <span className="journal-header-badge">Заметка дня</span>
            <h3 className="journal-header-title">{formattedDate}</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        {/* Sticker style selector: "Выбери вид стикера для окошка" (Photo 4) */}
        <div className="note-style-picker-card">
          <div className="note-style-picker-label">Выбери вид стикера для окошка:</div>
          <div className="note-style-picker-strip">
            {NOTE_STICKER_CHOICES.map((choice) => {
              const isSelected = selectedStyle === choice.style;
              return (
                <button
                  key={choice.style}
                  className={`note-style-btn style-${choice.style} ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    playBubbleTap(settings.soundEnabled !== false);
                    triggerHaptic(6, settings.hapticsEnabled !== false);
                    setSelectedStyle(choice.style);
                  }}
                  title={`${choice.label}: ${choice.desc}`}
                >
                  <span className="note-style-icon">{choice.icon}</span>
                  <span className="note-style-name">{choice.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Authentic Watercolor Note Sheet (Using user uploaded paper texture) */}
        <div className="journal-sheet-wrapper">
          <div
            className={`journal-sheet-paper note-paper-authentic style-${selectedStyle}`}
            style={{
              backgroundImage: `url('./textures/journal_paper.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Visual clip/tape header decor */}
            {selectedStyle === 'paper-clip' && (
              <div className="sheet-paperclip-decor" aria-hidden="true">
                <svg width="22" height="44" viewBox="0 0 16 32" fill="none" className="sheet-clip-svg">
                  <path
                    d="M4 3v20a4 4 0 0 0 8 0v-16a2.5 2.5 0 0 0-5 0v15"
                    stroke="#4E7C4B"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            {selectedStyle === 'washi-tape' && (
              <div className="sheet-washi-tape-decor washi-top" aria-hidden="true" />
            )}

            {selectedStyle === 'spiral-pad' && (
              <div className="sheet-spiral-holes-decor" aria-hidden="true">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="sheet-spiral-ring" />
                ))}
              </div>
            )}

            {selectedStyle === 'ribbon-card' && (
              <div className="sheet-ribbon-decor" aria-hidden="true">🎀</div>
            )}

            {selectedStyle === 'dark-craft' && (
              <div className="sheet-washi-tape-decor washi-craft" aria-hidden="true" />
            )}

            {/* Note Sheet Content */}
            <div className="journal-sheet-content">
              <div className="sheet-header-line">
                <span className="sheet-date-text">{formattedDate}</span>
              </div>

              <input
                type="text"
                className="journal-title-input"
                placeholder="Заголовок странички или мысли..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
              />

              <div className="sheet-textarea-container">
                <textarea
                  className="journal-content-textarea"
                  placeholder="Напиши сюда заметку, мысль или секретик... Когда сохранишь, в квадратике этого дня появится милый стикер!"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: "Убрать стикер" & "Приклеить в окошко" (Photo 4) */}
        <div className="journal-actions-row">
          {(content.trim() || title.trim() || existingNoteSticker) && (
            <button className="btn btn-outline btn-trash-note" onClick={handleRemove}>
              <Trash2 size={16} />
              <span>Убрать стикер</span>
            </button>
          )}

          <button className="btn btn-primary btn-save-note" onClick={handleSave}>
            <Check size={18} />
            <span>Приклеить в окошко</span>
          </button>
        </div>
      </div>
    </div>
  );
};
