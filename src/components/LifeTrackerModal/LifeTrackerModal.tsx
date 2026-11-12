import React, { useState } from 'react';
import { X, Trash2, Edit3, ZoomIn, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatFullDateRU } from '../../utils/dateUtils';
import { INTIMATE_PRESETS, ACTIVITY_PRESETS } from '../../data/lifeTrackerData';
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

  const [hadSex, setHadSex] = useState<boolean>(dayInfo.intimate?.hadSex ?? false);
  const [selectedSexType, setSelectedSexType] = useState<string>(dayInfo.intimate?.type || 'passionate');
  const [customSexType, setCustomSexType] = useState<string>(dayInfo.intimate?.customType || '');
  const [isAddingCustomSex, setIsAddingCustomSex] = useState<boolean>(false);
  const [customSexInput, setCustomSexInput] = useState<string>('');

  const [selectedActivities, setSelectedActivities] = useState<string[]>(dayInfo.activities || []);
  const [isAddingCustomActivity, setIsAddingCustomActivity] = useState<boolean>(false);
  const [customActivityInput, setCustomActivityInput] = useState<string>('');

  const formattedDate = formatFullDateRU(date);

  // Toggle "Секас был"
  const handleToggleSex = async () => {
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(10, settings.hapticsEnabled !== false);
    const newHadSex = !hadSex;
    setHadSex(newHadSex);

    await updateDayLifeDetails(date, {
      intimate: {
        hadSex: newHadSex,
        type: selectedSexType,
        customType: customSexType
      }
    });
  };

  // Select Sex Type
  const handleSelectSexType = async (typeId: string) => {
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(8, settings.hapticsEnabled !== false);
    setSelectedSexType(typeId);
    setHadSex(true);

    await updateDayLifeDetails(date, {
      intimate: {
        hadSex: true,
        type: typeId,
        customType: typeId === 'custom' ? customSexType : undefined
      }
    });
  };

  // Save custom sex variant
  const handleSaveCustomSex = async () => {
    if (!customSexInput.trim()) return;
    const text = customSexInput.trim();
    setCustomSexType(text);
    setSelectedSexType('custom');
    setHadSex(true);
    setIsAddingCustomSex(false);
    setCustomSexInput('');

    playPaperRustle(settings.soundEnabled !== false);
    await updateDayLifeDetails(date, {
      intimate: {
        hadSex: true,
        type: 'custom',
        customType: text
      }
    });
  };

  // Toggle Activity (multi-select!)
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
    if (!selectedActivities.includes(text)) {
      const updated = [...selectedActivities, text];
      setSelectedActivities(updated);
      await updateDayLifeDetails(date, { activities: updated });
    }
    setIsAddingCustomActivity(false);
    setCustomActivityInput('');
    playPaperRustle(settings.soundEnabled !== false);
  };

  // Clear all markings for this day
  const handleClearDayMarkings = async () => {
    playBubbleTap(settings.soundEnabled !== false);
    if (window.confirm('Сбросить все отметки и стикеры для этого дня?')) {
      await resetDayToDefault(date);
      setHadSex(false);
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

        {/* Intimate Card: Отметка "Секас был" */}
        <div className="life-tracker-card sex-card">
          <div className="sex-card-content" onClick={handleToggleSex}>
            <div className="sex-card-icon-wrap">
              <span className="sex-3d-heart">💕</span>
            </div>
            <div className="sex-card-text">
              <div className="sex-card-title-row">
                <span className="sex-card-title">Отметка «Секас был»</span>
                {hadSex && <span className="sex-status-pill">Был 💕</span>}
              </div>
              <p className="sex-card-hint">Нажми, чтобы включить или убрать отметку</p>
            </div>
            <div className={`sex-card-checkbox ${hadSex ? 'checked' : ''}`}>
              {hadSex && <Check size={16} />}
            </div>
          </div>
        </div>

        {/* Subtitle & Type Selection */}
        <div className="life-tracker-section-head">
          <span className="section-head-title">
            КАКОЙ БЫЛ? (значок появится в квадратике)
          </span>
          <button
            className="section-head-action-btn"
            onClick={() => setIsAddingCustomSex(!isAddingCustomSex)}
          >
            + Свой вариант
          </button>
        </div>

        {/* Custom Sex Type Input */}
        {isAddingCustomSex && (
          <div className="custom-input-box">
            <input
              type="text"
              placeholder="Например: Невероятный, На крыше..."
              value={customSexInput}
              onChange={(e) => setCustomSexInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomSex()}
              autoFocus
            />
            <button className="custom-input-save-btn" onClick={handleSaveCustomSex}>
              Добавить
            </button>
          </div>
        )}

        {/* 3x3 Grid of Intimate Types */}
        <div className="sex-types-grid">
          {INTIMATE_PRESETS.map((preset) => {
            const isSelected = hadSex && selectedSexType === preset.id;
            return (
              <button
                key={preset.id}
                className={`sex-type-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectSexType(preset.id)}
              >
                <span className="sex-type-emoji">{preset.emoji}</span>
                <span className="sex-type-label">{preset.shortLabel}</span>
              </button>
            );
          })}
          {customSexType && (
            <button
              className={`sex-type-btn ${hadSex && selectedSexType === 'custom' ? 'active' : ''}`}
              onClick={() => handleSelectSexType('custom')}
            >
              <span className="sex-type-emoji">✨</span>
              <span className="sex-type-label">{customSexType}</span>
            </button>
          )}
        </div>

        {/* Section: ЕЩЁ В ЭТОТ ДЕНЬ */}
        <div className="life-tracker-section-head" style={{ marginTop: '18px' }}>
          <span className="section-head-title">
            ЕЩЁ В ЭТОТ ДЕНЬ (НАСТРОЕНИЕ, ДЕЛА, СВИДАНИЕ)
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
            <span>Изменить стикер-заметку этого дня</span>
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
