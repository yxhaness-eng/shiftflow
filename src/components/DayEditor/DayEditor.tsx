import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  ZoomIn
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatFullDateRU } from '../../utils/dateUtils';
import { LifeTrackerModal } from '../LifeTrackerModal/LifeTrackerModal';
import { ScrapbookCellZoom } from '../ScrapbookCellZoom/ScrapbookCellZoom';
import { JournalPageModal } from '../JournalPageModal/JournalPageModal';
import { ACTIVITY_PRESETS } from '../../data/lifeTrackerData';
import { triggerHaptic, playBubbleTap } from '../../services/soundEffects';

export const DayEditor: React.FC = () => {
  const {
    settings,
    selectedDate,
    setSelectedDate,
    getDayInfo,
    points,
    changeDayPointSingle,
    changeDayCycleSubsequent,
    createDaySwap,
    updateDayStatus,
    updateDayLifeDetails,
    resetDayToDefault
  } = useApp();

  // Life Tracker & Scrapbook Journal modals
  const [isLifeTrackerOpen, setIsLifeTrackerOpen] = useState(false);
  const [isScrapbookZoomOpen, setIsScrapbookZoomOpen] = useState(false);
  const [isJournalPageOpen, setIsJournalPageOpen] = useState(false);

  // Cycle change confirmation modal
  const [pendingCyclePointId, setPendingCyclePointId] = useState<string | null>(null);
  const [isCycleConfirmOpen, setIsCycleConfirmOpen] = useState(false);

  // Swap modal
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [swapPointId, setSwapPointId] = useState<string>('');
  const [swapNote, setSwapNote] = useState<string>('');

  const dayInfo = selectedDate ? getDayInfo(selectedDate) : null;

  if (!selectedDate || !dayInfo) return null;

  const dateFormatted = formatFullDateRU(selectedDate);

  const handleToggleActivity = async (actId: string) => {
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(6, settings.hapticsEnabled !== false);

    const currentActs = dayInfo.activities || [];
    const updated = currentActs.includes(actId)
      ? currentActs.filter((id) => id !== actId)
      : [...currentActs, actId];

    await updateDayLifeDetails(selectedDate, { activities: updated });
  };

  // Point Selection handling (Option A vs Option B)
  const handlePointClick = (pointId: string) => {
    setPendingCyclePointId(pointId);
    setIsCycleConfirmOpen(true);
  };

  const confirmOptionA_SingleDay = async () => {
    if (!pendingCyclePointId) return;
    await changeDayPointSingle(selectedDate, pendingCyclePointId);
    setIsCycleConfirmOpen(false);
    setPendingCyclePointId(null);
  };

  const confirmOptionB_SubsequentCycle = async () => {
    if (!pendingCyclePointId) return;
    await changeDayCycleSubsequent(selectedDate, pendingCyclePointId);
    setIsCycleConfirmOpen(false);
    setPendingCyclePointId(null);
  };

  // Swap handling
  const handleOpenSwapDialog = () => {
    const defaultSwapTarget = points.find((p) => p.id !== dayInfo.actualPoint?.id) || points[0];
    setSwapPointId(defaultSwapTarget?.id || '');
    setSwapNote(dayInfo.override?.isSwap ? dayInfo.override.note || '' : '');
    setIsSwapDialogOpen(true);
  };

  const handleConfirmSwap = async () => {
    if (!swapPointId) return;
    await createDaySwap(selectedDate, swapPointId, swapNote);
    setIsSwapDialogOpen(false);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={() => setSelectedDate(null)}>
        <div className="modal-sheet day-editor-sheet" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <div>
              <span className="editor-date-badge">{selectedDate}</span>
              <h3 className="editor-date-title">{dateFormatted}</h3>
            </div>
            <button
              className="btn-icon"
              onClick={() => setSelectedDate(null)}
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">
            {/* Status & Point summary card */}
            <div className="editor-status-card">
              <div className="status-row">
                <span className="status-label">По графику:</span>
                <span
                  className="status-pill-mini"
                  style={{
                    backgroundColor: dayInfo.scheduledPoint?.color || 'var(--bg-secondary)',
                    color: dayInfo.scheduledPoint?.textColor || 'var(--text-primary)'
                  }}
                >
                  {dayInfo.scheduledPoint?.name || 'Выходной'}
                </span>
              </div>

              {dayInfo.override && (
                <div className="status-row override-info">
                  <span className="status-label">Фактически:</span>
                  {dayInfo.isSwap ? (
                    <span className="swap-badge-tag">
                      <RefreshCw size={12} /> Подмена на {dayInfo.actualPoint?.name}
                    </span>
                  ) : dayInfo.status === 'day_off' ? (
                    <span className="day-off-tag">Выходной день</span>
                  ) : (
                    <span
                      className="status-pill-mini"
                      style={{
                        backgroundColor: dayInfo.actualPoint?.color,
                        color: dayInfo.actualPoint?.textColor || 'var(--text-primary)'
                      }}
                    >
                      {dayInfo.actualPoint?.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 1: Shift & Work Point */}
            <div className="editor-section">
              <label className="section-label">Рабочая смена</label>
              
              <div className="points-buttons-grid">
                {points.filter(p => p.isActive).map((point) => {
                  const isCurrent = dayInfo.status === 'work' && dayInfo.actualPoint?.id === point.id;
                  return (
                    <button
                      key={point.id}
                      className={`point-select-btn ${isCurrent ? 'selected' : ''}`}
                      style={{
                        borderColor: point.color,
                        backgroundColor: isCurrent ? point.color : 'transparent'
                      }}
                      onClick={() => handlePointClick(point.id)}
                    >
                      <span
                        className="point-btn-dot"
                        style={{ backgroundColor: point.color }}
                      />
                      <span>{point.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="quick-action-row" style={{ marginTop: '10px' }}>
                <button
                  className={`btn btn-sm ${dayInfo.isSwap ? 'btn-primary' : 'btn-outline'}`}
                  onClick={handleOpenSwapDialog}
                >
                  <RefreshCw size={14} />
                  <span>{dayInfo.isSwap ? 'Изменить подмену' : 'Оформить подмену'}</span>
                </button>

                <div className="status-options-group">
                  <button
                    className={`btn btn-sm ${dayInfo.status === 'day_off' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => updateDayStatus(selectedDate, dayInfo.status === 'day_off' ? 'work' : 'day_off')}
                  >
                    {dayInfo.status === 'day_off' ? 'Вернуть в рабочий' : 'Сделать выходным'}
                  </button>
                </div>
              </div>
            </div>

            {/* COZY SCRAPBOOK & LIFE TRACKER SHORTCUTS */}
            <div className="editor-section scrapbook-shortcuts-section">
              <label className="section-label">Журнал жизни и отметки дня</label>

              {/* Day Note & Journal Card */}
              <div
                className="scrapbook-shortcut-card journal-page-card"
                onClick={() => {
                  playBubbleTap(settings.soundEnabled !== false);
                  setIsJournalPageOpen(true);
                }}
              >
                <div className="shortcut-card-left">
                  <span className="shortcut-card-icon">📖</span>
                  <div>
                    <div className="shortcut-card-title">Заметка и страничка ежедневника</div>
                    <div className="shortcut-card-subtitle">
                      {dayInfo.journalPage?.content || dayInfo.noteSticker?.text || dayInfo.note
                        ? `Заметка: "${(dayInfo.journalPage?.content || dayInfo.noteSticker?.text || dayInfo.note || '').slice(0, 32)}..."`
                        : 'Оформить мысли, выбрать стикер со скрепкой или скотчем'}
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm">
                  {dayInfo.journalPage?.content || dayInfo.noteSticker?.text || dayInfo.note ? 'Открыть' : 'Оформить'}
                </button>
              </div>

              {/* Life Markings Grid */}
              <div className="editor-activities-block">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="editor-subhead">Отметки дня (круглые значки):</span>
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => {
                      playBubbleTap(settings.soundEnabled !== false);
                      setIsLifeTrackerOpen(true);
                    }}
                  >
                    + Все отметки
                  </button>
                </div>

                <div className="editor-activities-grid">
                  {ACTIVITY_PRESETS.slice(0, 12).map((act) => {
                    const isSelected = (dayInfo.activities || []).includes(act.id);
                    const label = settings.activityCustomLabels?.[act.id] || act.label;
                    return (
                      <button
                        key={act.id}
                        className={`editor-activity-badge-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => handleToggleActivity(act.id)}
                        title={label}
                      >
                        {act.iconImage ? (
                          <img src={`./${act.iconImage}?v=circle`} alt={label} />
                        ) : (
                          <span>{act.emoji}</span>
                        )}
                        <span>{label.split('/')[0].trim()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zoom & Free Drag Button */}
              <button
                className="btn-zoom-editor-trigger"
                onClick={() => {
                  playBubbleTap(settings.soundEnabled !== false);
                  setIsScrapbookZoomOpen(true);
                }}
              >
                <ZoomIn size={16} />
                <span>Увеличить окошко и свободно расставить значки</span>
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            {dayInfo.override && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => resetDayToDefault(selectedDate)}
                title="Сбросить все изменения этого дня"
              >
                Вернуть по графику
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => setSelectedDate(null)}
            >
              Готово
            </button>
          </div>
        </div>
      </div>

      {/* Choice Modal: Option A vs Option B */}
      {isCycleConfirmOpen && pendingCyclePointId && (
        <div className="modal-backdrop" onClick={() => setIsCycleConfirmOpen(false)}>
          <div className="modal-sheet confirm-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Режим изменения расписания
              </h3>
              <button className="btn-icon" onClick={() => setIsCycleConfirmOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '14px' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Вы выбрали точку <strong>{points.find((p) => p.id === pendingCyclePointId)?.name}</strong> на дату <strong>{dateFormatted}</strong>.
              </p>
              <div className="cycle-choice-buttons">
                <button className="btn btn-outline" onClick={confirmOptionA_SingleDay}>
                  Только на этот день
                </button>
                <button className="btn btn-primary" onClick={confirmOptionB_SubsequentCycle}>
                  И пересчитать дальше по циклу
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swap Dialog */}
      {isSwapDialogOpen && (
        <div className="modal-backdrop" onClick={() => setIsSwapDialogOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} /> Оформление подмены смены
              </h3>
              <button className="btn-icon" onClick={() => setIsSwapDialogOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '14px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                По графику: <strong>{dayInfo.scheduledPoint?.name}</strong>. Выберите точку, на которой фактически будет смена:
              </p>

              <div className="points-buttons-grid">
                {points.filter(p => p.isActive).map((point) => (
                  <button
                    key={point.id}
                    className={`point-select-btn ${swapPointId === point.id ? 'selected' : ''}`}
                    style={{
                      borderColor: point.color,
                      backgroundColor: swapPointId === point.id ? point.color : 'transparent'
                    }}
                    onClick={() => setSwapPointId(point.id)}
                  >
                    <span>{point.name}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="section-label" style={{ fontSize: '0.8rem' }}>Причина / заметка к подмене:</label>
                <input
                  type="text"
                  className="swap-note-input"
                  placeholder="Например: Поменялся с Машей"
                  value={swapNote}
                  onChange={(e) => setSwapNote(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsSwapDialogOpen(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleConfirmSwap}>
                Сохранить подмену
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Life & Daily Tracking Modal */}
      {isLifeTrackerOpen && (
        <LifeTrackerModal
          date={selectedDate}
          onClose={() => setIsLifeTrackerOpen(false)}
          onOpenNoteSticker={() => {
            setIsLifeTrackerOpen(false);
            setIsJournalPageOpen(true);
          }}
          onOpenZoomCanvas={() => {
            setIsLifeTrackerOpen(false);
            setIsScrapbookZoomOpen(true);
          }}
        />
      )}

      {/* Scrapbook Day Zoom Modal */}
      {isScrapbookZoomOpen && (
        <ScrapbookCellZoom
          date={selectedDate}
          onClose={() => setIsScrapbookZoomOpen(false)}
          onOpenLifeTracker={() => {
            setIsScrapbookZoomOpen(false);
            setIsLifeTrackerOpen(true);
          }}
          onOpenNoteSticker={() => {
            setIsScrapbookZoomOpen(false);
            setIsJournalPageOpen(true);
          }}
        />
      )}

      {/* Scrapbook Journal & Note Page Modal */}
      {isJournalPageOpen && (
        <JournalPageModal
          date={selectedDate}
          onClose={() => setIsJournalPageOpen(false)}
        />
      )}
    </>
  );
};
