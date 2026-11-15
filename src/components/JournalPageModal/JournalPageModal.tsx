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
        {/* Top Header & Sticker style selector: "Выбери вид стикера для окошка" (Image 6) */}
        <div className="note-style-picker-card">
          <div className="note-style-picker-header">
            <span className="journal-header-badge">Заметка дня</span>
            <div className="note-style-picker-label">Выбери вид стикера для окошка:</div>
          </div>
          <div className="note-style-picker-strip">
            {NOTE_STICKER_CHOICES.map((choice) => {
              const isSelected = selectedStyle === choice.style;
              return (
                <button
                  key={choice.style}
                  type="button"
                  className={`note-style-btn style-${choice.style} ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    playBubbleTap(settings.soundEnabled !== false);
                    triggerHaptic(6, settings.hapticsEnabled !== false);
                    setSelectedStyle(choice.style);
                  }}
                  title={`${choice.label}: ${choice.desc}`}
                >
                  <span className={`style-thumb-mini-icon style-icon-${choice.style}`} aria-hidden="true" />
                  <span className="note-style-name">{choice.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean Cozy White Note Sheet (Image 6) with Carved Borders & Top Attachment */}
        <div className="journal-sheet-wrapper">
          <div className={`journal-sheet-paper note-paper-authentic style-${selectedStyle}`}>
            {/* Visual top decorative clip/tape attachment sticking out over the top of the paper */}
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
              <div className="sheet-spiral-binder-decor" aria-hidden="true">
                <div className="sheet-spiral-rings">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="sheet-spiral-ring-item">
                      <span className="spiral-ring-coil" />
                      <span className="spiral-hole" />
                    </div>
                  ))}
                </div>
                <div className="sheet-spiral-tear-line" />
              </div>
            )}

            {selectedStyle === 'cloud' && (
              <>
                <div className="sheet-cloud-tape-decor" aria-hidden="true">
                  <span className="cloud-tape-heart">🤍</span>
                </div>
                <div className="sheet-cloud-scallops" aria-hidden="true">
                  <div className="cloud-scallop-edge scallop-top" />
                  <div className="cloud-scallop-edge scallop-bottom" />
                  <div className="cloud-scallop-edge scallop-left" />
                  <div className="cloud-scallop-edge scallop-right" />
                </div>
              </>
            )}

            {selectedStyle === 'ribbon-card' && (
              <div className="sheet-ribbon-decor" aria-hidden="true">
                <svg width="48" height="34" viewBox="0 0 48 34" fill="none" className="sheet-ribbon-svg">
                  <path d="M24 16 C20 8 10 6 8 12 C6 18 16 20 24 16 Z" fill="#D9829B" stroke="#B85D75" strokeWidth="1.2" />
                  <path d="M24 16 C28 8 38 6 40 12 C42 18 32 20 24 16 Z" fill="#D9829B" stroke="#B85D75" strokeWidth="1.2" />
                  <circle cx="24" cy="16" r="3.5" fill="#B85D75" />
                  <path d="M22 18 Q16 28 12 32" stroke="#B85D75" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M26 18 Q32 28 36 32" stroke="#B85D75" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {selectedStyle === 'tag' && (
              <div className="sheet-tag-decor" aria-hidden="true">
                <div className="tag-eyelet-reinforcer">
                  <div className="tag-eyelet-hole" />
                </div>
                <div className="tag-twine-loop" />
              </div>
            )}

            {selectedStyle === 'dark-craft' && (
              <div className="sheet-washi-tape-decor washi-craft" aria-hidden="true" />
            )}

            {/* Note Sheet Content */}
            <div className="journal-sheet-content">
              <div className="sheet-header-line">
                <span className="sheet-date-text">{formattedDate}</span>
                <button
                  type="button"
                  className="note-sheet-close-btn"
                  onClick={onClose}
                  aria-label="Закрыть"
                >
                  <X size={16} />
                </button>
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

              {/* Action Buttons: "Убрать стикер" & "Приклеить в окошко" (Image 6) */}
              <div className="journal-actions-row">
                <button
                  type="button"
                  className="btn btn-outline btn-trash-note"
                  onClick={handleRemove}
                  title="Убрать стикер"
                >
                  <Trash2 size={16} />
                  <span>Убрать стикер</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-save-note"
                  onClick={handleSave}
                  title="Приклеить в окошко"
                >
                  <Check size={18} />
                  <span>Приклеить в окошко</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
