import React, { useState } from 'react';
import { X, Trash2, Edit3, ZoomIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatFullDateRU } from '../../utils/dateUtils';
import { ACTIVITY_PRESETS } from '../../data/lifeTrackerData';
import { playBubbleTap, playPaperRustle, triggerHaptic } from '../../services/soundEffects';

interface LifeTrackerModalProps {
  date: string;
  onClose: () => void;
  onOpenNoteSticker: () => void;
  onOpenZoomCanvas: () => void;
}

export const LifeTrackerModal: React.FC<LifeTrackerModalProps> = ({
  date,
  onClose,
  onOpenNoteSticker,
  onOpenZoomCanvas
}) => {
  const { settings, getDayInfo, updateDayLifeDetails, resetDayToDefault } = useApp();
  const dayInfo = getDayInfo(date);

  const [selectedActivities, setSelectedActivities] = useState<string[]>(dayInfo.activities || []);
  const [isAddingCustomActivity, setIsAddingCustomActivity] = useState<boolean>(false);
  const [customActivityInput, setCustomActivityInput] = useState<string>('');

  const formattedDate = formatFullDateRU(date);

  // Toggle Activity (multi-select)
  const handleToggleActivity = async (actId: string) => {
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(6, settings.hapticsEnabled !== false);

    const updated = selectedActivities.includes(actId)
      ? selectedActivities.filter((id) => id !== actId)
      : [...selectedActivities, actId];

    setSelectedActivities(updated);
    await updateDayLifeDetails(date, {
      activities: updated
    });
  };

  // Add custom activity
  const handleSaveCustomActivity = async () => {
    if (!customActivityInput.trim()) return;
    const text = customActivityInput.trim();
    setIsAddingCustomActivity(false);
    setCustomActivityInput('');
    playPaperRustle(settings.soundEnabled !== false);

    if (!selectedActivities.includes(text)) {
      const updated = [...selectedActivities, text];
      setSelectedActivities(updated);
      await updateDayLifeDetails(date, { activities: updated });
    }
  };

  // Clear all markings for this day
  const handleClearDayMarkings = async () => {
    playBubbleTap(settings.soundEnabled !== false);
    if (window.confirm('Сбросить все отметки и стикеры для этого дня?')) {
      await resetDayToDefault(date);
      setSelectedActivities([]);
      onClose();
    }
  };

  return (
    <div className="life-tracker-overlay" onClick={onClose}>
      <div className="life-tracker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="life-tracker-header">
          <div>
            <h3 className="life-tracker-date">{formattedDate.split(',')[0]}</h3>
            <p className="life-tracker-subtitle">Настрой отметки этого окошка</p>
          </div>
          <button className="life-tracker-close-btn" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        {/* Section: ОТМЕТКИ ЭТОГО ДНЯ (НАСТРОЕНИЕ, ДЕЛА, ВСТРЕЧИ) */}
        <div className="life-tracker-section-head">
          <span className="section-head-title">
            ОТМЕТКИ ЭТОГО ДНЯ (НАСТРОЕНИЕ, ДЕЛА, ВСТРЕЧИ)
          </span>
          <button
            className="section-head-action-btn"
            onClick={() => setIsAddingCustomActivity(!isAddingCustomActivity)}
          >
            + Своя метка
          </button>
        </div>

        {/* Custom Activity Input */}
        {isAddingCustomActivity && (
          <div className="custom-input-box">
            <input
              type="text"
              placeholder="Например: Поездка к маме, Баня, Концерт..."
              value={customActivityInput}
              onChange={(e) => setCustomActivityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomActivity()}
              autoFocus
            />
            <button className="custom-input-save-btn" onClick={handleSaveCustomActivity}>
              Добавить
            </button>
          </div>
        )}

        {/* Multi-select Activity Pills */}
        <div className="activities-chips-grid">
          {ACTIVITY_PRESETS.map((act) => {
            const isSelected = selectedActivities.includes(act.id);
            return (
              <button
                key={act.id}
                className={`activity-chip-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleToggleActivity(act.id)}
              >
                {act.iconImage ? (
                  <img
                    src={`./${act.iconImage}`}
                    alt={act.label}
                    className="activity-chip-img"
                  />
                ) : (
                  <span className="activity-chip-emoji">{act.emoji}</span>
                )}
                <span className="activity-chip-label">{act.label}</span>
              </button>
            );
          })}

          {/* Any custom activities added by user */}
          {selectedActivities
            .filter((act) => !ACTIVITY_PRESETS.some((p) => p.id === act))
            .map((customAct) => (
              <button
                key={customAct}
                className="activity-chip-btn active"
                onClick={() => handleToggleActivity(customAct)}
              >
                <span className="activity-chip-emoji">🏷️</span>
                <span className="activity-chip-label">{customAct}</span>
              </button>
            ))}
        </div>

        {/* Bottom Actions */}
        <div className="life-tracker-bottom-bar">
          <button
            className="btn-note-sticker-edit"
            onClick={() => {
              playBubbleTap(settings.soundEnabled !== false);
              onOpenNoteSticker();
            }}
          >
            <Edit3 size={16} />
            <span>Оформить стикер-заметку этого дня</span>
          </button>

          <button
            className="btn-zoom-canvas-open"
            onClick={() => {
              playBubbleTap(settings.soundEnabled !== false);
              onOpenZoomCanvas();
            }}
            title="Увеличить и оформить окошко скрапбука"
          >
            <ZoomIn size={18} />
          </button>

          <button
            className="btn-trash-markings"
            onClick={handleClearDayMarkings}
            title="Очистить отметки этого дня"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
