import React, { useState } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteStickerStyle } from '../../types';
import { NOTE_STYLE_OPTIONS } from '../../data/lifeTrackerData';
import { formatFullDateRU } from '../../utils/dateUtils';
import { playPaperRustle, playBubbleTap, triggerHaptic } from '../../services/soundEffects';

interface NoteStickerModalProps {
  date: string;
  onClose: () => void;
}

export const NoteStickerModal: React.FC<NoteStickerModalProps> = ({ date, onClose }) => {
  const { settings, getDayInfo, updateDayLifeDetails } = useApp();
  const dayInfo = getDayInfo(date);

  const existingNoteSticker = dayInfo.noteSticker;
  const existingNoteText = existingNoteSticker?.text || dayInfo.note || '';

  const [selectedStyle, setSelectedStyle] = useState<NoteStickerStyle>(
    existingNoteSticker?.style || 'paper-clip'
  );
  const [noteContent, setNoteContent] = useState<string>(existingNoteText);

  const formattedDate = formatFullDateRU(date).split(',')[0];

  const handleSelectStyle = (style: NoteStickerStyle) => {
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(6, settings.hapticsEnabled !== false);
    setSelectedStyle(style);
  };

  // Save / Glue note sticker to day cell
  const handleSave = async () => {
    playPaperRustle(settings.soundEnabled !== false);
    triggerHaptic(12, settings.hapticsEnabled !== false);

    if (!noteContent.trim()) {
      // If empty, remove sticker
      await updateDayLifeDetails(date, {
        noteSticker: undefined,
        note: ''
      });
    } else {
      await updateDayLifeDetails(date, {
        noteSticker: {
          style: selectedStyle,
          text: noteContent.trim(),
          x: existingNoteSticker?.x || 0,
          y: existingNoteSticker?.y || 0,
          rotation: existingNoteSticker?.rotation || (Math.random() * 4 - 2)
        },
        note: noteContent.trim()
      });
    }
    onClose();
  };

  // Remove note sticker
  const handleRemove = async () => {
    playPaperRustle(settings.soundEnabled !== false);
    triggerHaptic(8, settings.hapticsEnabled !== false);

    await updateDayLifeDetails(date, {
      noteSticker: undefined,
      note: ''
    });
    setNoteContent('');
    onClose();
  };

  return (
    <div className="note-sticker-overlay" onClick={onClose}>
      <div className="note-sticker-container" onClick={(e) => e.stopPropagation()}>
        {/* Top Style Selector Bar */}
        <div className="note-style-selector-bar">
          <p className="style-selector-title">Выбери вид стикера для окошка:</p>
          <div className="style-options-row">
            {NOTE_STYLE_OPTIONS.map((opt) => {
              const isSelected = selectedStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  className={`style-thumb-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectStyle(opt.id)}
                  title={opt.description}
                >
                  <span className={`style-thumb-mini-icon style-icon-${opt.id}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Decorative Top Attachment (clip or tape) */}
        <div className={`note-attachment-decor decor-${selectedStyle}`} />

        {/* The Paper Note Card */}
        <div className={`note-paper-sheet style-${selectedStyle}`}>
          {/* Note Card Header */}
          <div className="note-paper-header">
            <h4 className="note-paper-date">{formattedDate}</h4>
            <button className="note-paper-close-btn" onClick={onClose} aria-label="Закрыть">
              <X size={16} />
            </button>
          </div>

          {/* Lined Textarea */}
          <div className="note-paper-body">
            <textarea
              className="note-lined-textarea"
              rows={5}
              placeholder="Напиши сюда заметку, мысль или секретик... Когда сохранишь, в квадратике этого дня появится милый стикер!"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              autoFocus
            />
          </div>

          {/* Bottom Actions */}
          <div className="note-paper-footer">
            <button className="btn-remove-note-sticker" onClick={handleRemove}>
              <Trash2 size={14} />
              <span>Убрать стикер</span>
            </button>

            <button className="btn-glue-note-sticker" onClick={handleSave}>
              <Check size={16} />
              <span>Приклеить в окошко</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
