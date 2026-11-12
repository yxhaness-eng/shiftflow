import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  RefreshCw,
  Trash2,
  RotateCcw,
  RotateCw,
  MoveLeft,
  MoveRight,
  MoveUp,
  MoveDown,
  ZoomIn,
  ZoomOut,
  Heart,
  Coffee,
  Sparkles,
  Smile,
  Calendar,
  Check,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatFullDateRU } from '../../utils/dateUtils';
import { STICKERS_MAP } from '../../data/stickersManifest';
import { StickerPicker } from '../StickerPicker/StickerPicker';
import { LifeTrackerModal } from '../LifeTrackerModal/LifeTrackerModal';
import { ScrapbookCellZoom } from '../ScrapbookCellZoom/ScrapbookCellZoom';
import { JournalPageModal } from '../JournalPageModal/JournalPageModal';
import { ACTIVITY_MAP } from '../../data/lifeTrackerData';
import { triggerHaptic, playBubbleTap } from '../../services/soundEffects';

const AVAILABLE_TAGS = ['Романтика', 'Отдых', 'Встреча', 'Настроение', 'Праздник', 'Планы'];

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
    updateDayNote,
    resetDayToDefault,
    addStickerToDate,
    updateStickerTransform,
    removeSticker
  } = useApp();

  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [selectedStickerIdToEdit, setSelectedStickerIdToEdit] = useState<string | null>(null);

  // Life Tracker & Scrapbook Journal modals
  const [isLifeTrackerOpen, setIsLifeTrackerOpen] = useState(false);
  const [isScrapbookZoomOpen, setIsScrapbookZoomOpen] = useState(false);
  const [isJournalPageOpen, setIsJournalPageOpen] = useState(false);

  // Local state for note and tags
  const [noteText, setNoteText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSavedNote, setIsSavedNote] = useState(false);

  // Cycle change confirmation modal
  const [pendingCyclePointId, setPendingCyclePointId] = useState<string | null>(null);
  const [isCycleConfirmOpen, setIsCycleConfirmOpen] = useState(false);

  // Swap modal
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [swapPointId, setSwapPointId] = useState<string>('');
  const [swapNote, setSwapNote] = useState<string>('');

  // Dragging state for interactive sticker placement preview
  const dragRef = useRef<{
    stickerId: string;
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    isDragging: boolean;
  } | null>(null);

  const dayInfo = selectedDate ? getDayInfo(selectedDate) : null;

  useEffect(() => {
    if (dayInfo) {
      setNoteText(dayInfo.note || '');
      setSelectedTags(dayInfo.tags || []);
      if (dayInfo.stickers.length > 0 && !selectedStickerIdToEdit) {
        setSelectedStickerIdToEdit(dayInfo.stickers[0].id);
      }
    }
  }, [selectedDate, dayInfo?.note, dayInfo?.tags]);

  if (!selectedDate || !dayInfo) return null;

  const dateFormatted = formatFullDateRU(selectedDate);
  const currentStickers = dayInfo.stickers;
  const activeSelectedSticker = currentStickers.find((s) => s.id === selectedStickerIdToEdit);

  // Handle Note Save
  const handleSaveNote = async () => {
    await updateDayNote(selectedDate, noteText, selectedTags);
    setIsSavedNote(true);
    setTimeout(() => setIsSavedNote(false), 1500);
  };

  const handleToggleTag = (tag: string) => {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updated);
    updateDayNote(selectedDate, noteText, updated);
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

  // Sticker adjustments
  const handleNudgeSticker = (dx: number, dy: number) => {
    if (!activeSelectedSticker) return;
    triggerHaptic(6, settings.hapticsEnabled !== false);
    const newX = Math.max(-50, Math.min(50, activeSelectedSticker.x + dx));
    const newY = Math.max(-50, Math.min(50, activeSelectedSticker.y + dy));
    updateStickerTransform(activeSelectedSticker.id, { x: newX, y: newY });
  };

  const handleRotateSticker = (deltaDeg: number) => {
    if (!activeSelectedSticker) return;
    triggerHaptic(6, settings.hapticsEnabled !== false);
    const newRot = Math.round((activeSelectedSticker.rotation + deltaDeg) * 10) / 10;
    updateStickerTransform(activeSelectedSticker.id, { rotation: newRot });
  };

  const handleScaleSticker = (deltaScale: number) => {
    if (!activeSelectedSticker) return;
    triggerHaptic(6, settings.hapticsEnabled !== false);
    const newScale = Math.max(0.5, Math.min(1.6, Math.round((activeSelectedSticker.scale + deltaScale) * 10) / 10));
    updateStickerTransform(activeSelectedSticker.id, { scale: newScale });
  };

  const handleStickerAdded = async (stickerId: string) => {
    const newStk = await addStickerToDate(selectedDate, stickerId);
    setSelectedStickerIdToEdit(newStk.id);
  };

  const handleStickerPointerDown = (e: React.PointerEvent, stk: typeof currentStickers[0]) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedStickerIdToEdit(stk.id);
    triggerHaptic(6, settings.hapticsEnabled !== false);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    dragRef.current = {
      stickerId: stk.id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: stk.x,
      origY: stk.y,
      isDragging: true
    };
  };

  const handleStickerPointerMove = (e: React.PointerEvent, stk: typeof currentStickers[0]) => {
    if (!dragRef.current || !dragRef.current.isDragging || dragRef.current.stickerId !== stk.id) {
      return;
    }
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    // Convert pixel delta to coordinate offset (55px ~= 100% offset relative to sticker size)
    const deltaPercentX = (deltaX / 55) * 100;
    const deltaPercentY = (deltaY / 55) * 100;

    const newX = Math.round(Math.max(-50, Math.min(50, dragRef.current.origX + deltaPercentX)));
    const newY = Math.round(Math.max(-50, Math.min(50, dragRef.current.origY + deltaPercentY)));

    updateStickerTransform(stk.id, { x: newX, y: newY });
  };

  const handleStickerPointerUp = (e: React.PointerEvent, stk: typeof currentStickers[0]) => {
    if (dragRef.current && dragRef.current.stickerId === stk.id) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragRef.current.isDragging = false;
      dragRef.current = null;
      triggerHaptic(10, settings.hapticsEnabled !== false);
    }
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
              <label className="section-label">Журнал жизни и скрапбук</label>

              {/* Life Markings Card */}
              <div
                className="scrapbook-shortcut-card"
                onClick={() => {
                  playBubbleTap(settings.soundEnabled !== false);
                  setIsLifeTrackerOpen(true);
                }}
              >
                <div className="shortcut-card-left">
                  <span className="shortcut-card-icon">🌸</span>
                  <div>
                    <div className="shortcut-card-title">Отметки дня (дела и настроение)</div>
                    <div className="shortcut-card-subtitle">
                      {dayInfo.activities && dayInfo.activities.length > 0
                        ? `Выбрано отметок: ${dayInfo.activities.length}`
                        : 'Нажми, чтобы настроить настроение и дела'}
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm">Настроить</button>
              </div>

              {/* Active Badges Preview if any */}
              {dayInfo.activities && dayInfo.activities.length > 0 && (
                <div className="editor-active-activities-row">
                  {dayInfo.activities.map((actId) => {
                    const act = ACTIVITY_MAP[actId];
                    return (
                      <span key={actId} className="editor-active-badge-pill">
                        {act?.iconImage ? (
                          <img src={`./${act.iconImage}`} alt={act?.label || actId} />
                        ) : (
                          <span>{act?.emoji || '🏷️'}</span>
                        )}
                        <span>{act?.label || actId}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Unified Scrapbook Journal & Note Card */}
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
                        ? `Заметка: "${(dayInfo.journalPage?.content || dayInfo.noteSticker?.text || dayInfo.note || '').slice(0, 30)}..."`
                        : 'Оформить мысли, выбрать стикер со скрепкой или скотчем, добавить сухоцветы'}
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm">
                  {dayInfo.journalPage?.content || dayInfo.noteSticker?.text || dayInfo.note ? 'Открыть' : 'Оформить'}
                </button>
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
                <span>Увеличить окошко и свободно расставить стикеры</span>
              </button>
            </div>

            {/* SECTION 2: Personal Note & Events */}
            <div className="editor-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="section-label">Заметка и события дня</label>
                {isSavedNote && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-sage-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> Сохранено
                  </span>
                )}
              </div>

              {/* Tag Chips */}
              <div className="tags-row">
                {AVAILABLE_TAGS.map((tag) => {
                  const isChecked = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      className={`tag-chip ${isChecked ? 'active' : ''}`}
                      onClick={() => handleToggleTag(tag)}
                    >
                      {tag === 'Романтика' && <Heart size={12} />}
                      {tag === 'Отдых' && <Coffee size={12} />}
                      {tag === 'Встреча' && <Sparkles size={12} />}
                      {tag === 'Настроение' && <Smile size={12} />}
                      {tag === 'Праздник' && <Sparkles size={12} />}
                      {tag === 'Планы' && <Calendar size={12} />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>

              <textarea
                className="note-textarea"
                rows={3}
                placeholder="Напишите личную заметку, мысли или событие..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onBlur={handleSaveNote}
              />
            </div>

            {/* SECTION 3: Stickers on this day */}
            <div className="editor-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="section-label">Стикеры ({currentStickers.length})</label>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsStickerPickerOpen(true)}
                >
                  <Plus size={14} />
                  <span>Добавить стикер</span>
                </button>
              </div>

              {currentStickers.length === 0 ? (
                <div className="empty-stickers-box">
                  <p>На этот день пока нет стикеров</p>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '8px' }}
                    onClick={() => setIsStickerPickerOpen(true)}
                  >
                    Выбрать стикер для окошка
                  </button>
                </div>
              ) : (
                <div className="stickers-manager">
                  {/* Thumbnails list */}
                  <div className="stickers-thumbnails-strip">
                    {currentStickers.map((stk) => {
                      const item = STICKERS_MAP[stk.stickerId];
                      const isSelected = stk.id === selectedStickerIdToEdit;
                      return (
                        <div
                          key={stk.id}
                          className={`sticker-thumb-card ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedStickerIdToEdit(stk.id)}
                        >
                          <img
                            src={`./${item?.imagePath || ''}`}
                            alt={item?.name || 'Стикер'}
                            style={{ width: '42px', height: '42px', objectFit: 'contain' }}
                          />
                          <button
                            className="sticker-thumb-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSticker(stk.id);
                              if (selectedStickerIdToEdit === stk.id) {
                                setSelectedStickerIdToEdit(null);
                              }
                            }}
                            title="Удалить стикер"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Interactive Visual Placement Simulation Preview Card */}
                  <div className="simulation-preview-card">
                    <div className="simulation-preview-header">
                      <span className="simulation-preview-title">
                        <Sparkles size={14} /> Макет карточки дня
                      </span>
                      <span className="simulation-preview-hint">
                        👆 Перетаскивайте стикер прямо на карточке
                      </span>
                    </div>

                    <div className="preview-day-cell-outer">
                      <div className="preview-day-cell">
                        {/* Cell Header */}
                        <div className="cell-header">
                          <span className="day-number today-badge">
                            {dayInfo.dayNumber}
                          </span>
                          {dayInfo.note && dayInfo.note.trim().length > 0 && (
                            <span className="note-indicator" title="Есть личная заметка">
                              <FileText size={12} />
                            </span>
                          )}
                        </div>

                        {/* Cell Stage where stickers are placed & dragged */}
                        <div className="preview-cell-stage">
                          {currentStickers.map((stk) => {
                            const item = STICKERS_MAP[stk.stickerId];
                            if (!item) return null;
                            const isSelected = stk.id === selectedStickerIdToEdit;
                            return (
                              <div
                                key={stk.id}
                                className={`preview-draggable-sticker ${isSelected ? 'active-target' : ''}`}
                                style={{
                                  transform: `translate(${stk.x}%, ${stk.y}%) rotate(${stk.rotation}deg) scale(${stk.scale})`,
                                  touchAction: 'none'
                                }}
                                onPointerDown={(e) => handleStickerPointerDown(e, stk)}
                                onPointerMove={(e) => handleStickerPointerMove(e, stk)}
                                onPointerUp={(e) => handleStickerPointerUp(e, stk)}
                                onPointerCancel={(e) => handleStickerPointerUp(e, stk)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStickerIdToEdit(stk.id);
                                }}
                                title={`${item.name} (нажмите для выбора или перетаскивайте)`}
                              >
                                <img
                                  src={`./${item.imagePath}`}
                                  alt={item.name}
                                  draggable={false}
                                  className="preview-sticker-img"
                                />
                                {isSelected && (
                                  <div className="active-sticker-indicator">
                                    <span className="active-pill">Выбран</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Cell Footer matching calendar day */}
                        <div className="cell-footer">
                          {dayInfo.status === 'work' && dayInfo.actualPoint && (
                            <div
                              className={`shift-pill ${dayInfo.isSwap ? 'is-swap' : ''}`}
                              style={{
                                backgroundColor: dayInfo.actualPoint.color,
                                color: dayInfo.actualPoint.textColor || 'var(--text-primary)'
                              }}
                            >
                              {dayInfo.isSwap && <RefreshCw size={10} className="swap-icon-spin" />}
                              <span className="shift-pill-text">{dayInfo.actualPoint.name}</span>
                            </div>
                          )}

                          {dayInfo.status === 'day_off' && (
                            <div className="status-pill day-off-pill">
                              <span>Выходной</span>
                            </div>
                          )}

                          {dayInfo.status === 'vacation' && (
                            <div className="status-pill vacation-pill">
                              <span>Отпуск</span>
                            </div>
                          )}

                          {dayInfo.status === 'sick' && (
                            <div className="status-pill sick-pill">
                              <span>Больничный</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Sticker Transform Controls */}
                  {activeSelectedSticker && (
                    <div className="sticker-controls-panel">
                      <div className="controls-row">
                        <span className="control-label">Положение:</span>
                        <div className="control-buttons-group">
                          <button
                            className="btn-icon-sm"
                            onClick={() => handleNudgeSticker(-5, 0)}
                            title="Влево"
                          >
                            <MoveLeft size={14} />
                          </button>
                          <button
                            className="btn-icon-sm"
                            onClick={() => handleNudgeSticker(5, 0)}
                            title="Вправо"
                          >
                            <MoveRight size={14} />
                          </button>
                          <button
                            className="btn-icon-sm"
                            onClick={() => handleNudgeSticker(0, -5)}
                            title="Вверх"
                          >
                            <MoveUp size={14} />
                          </button>
                          <button
                            className="btn-icon-sm"
                            onClick={() => handleNudgeSticker(0, 5)}
                            title="Вниз"
                          >
                            <MoveDown size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="controls-row">
                        <span className="control-label">Поворот:</span>
                        <div className="control-buttons-group">
                          <button
                            className="btn-icon-sm"
                            onClick={() => handleRotateSticker(-5)}
                            title="Повернуть против часовой"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <span className="control-value-display">
                            {activeSelectedSticker.rotation}°
                          </span>
                          <button
                            className="btn-icon-sm"
                            onClick={() => handleRotateSticker(5)}
                            title="Повернуть по часовой"
                          >
                            <RotateCw size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="controls-row">
                        <span className="control-label">Размер:</span>
                        <div className="control-buttons-group">
                          <button
                            className="btn-icon-sm"
                            onClick={() => handleScaleSticker(-0.1)}
                            title="Уменьшить"
                          >
                            <ZoomOut size={14} />
                          </button>
                          <span className="control-value-display">
                            {Math.round(activeSelectedSticker.scale * 100)}%
                          </span>
                          <button
                            className="btn-icon-sm"
                            onClick={() => handleScaleSticker(0.1)}
                            title="Увеличить"
                          >
                            <ZoomIn size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
              onClick={() => {
                handleSaveNote();
                setSelectedDate(null);
              }}
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
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Вы выбрали точку <strong>{points.find((p) => p.id === pendingCyclePointId)?.name}</strong> на {selectedDate}. Как применить изменение?
              </p>

              <div
                className="choice-card"
                onClick={confirmOptionA_SingleDay}
              >
                <div className="choice-title">Вариант А — Изменить только этот день</div>
                <div className="choice-desc">
                  Меняется исключительно выбранная дата ({selectedDate}). Все остальные дни и цикл остаются без изменений.
                </div>
              </div>

              <div
                className="choice-card highlight"
                onClick={confirmOptionB_SubsequentCycle}
              >
                <div className="choice-title">Вариант Б — Изменить этот день и последующий цикл</div>
                <div className="choice-desc">
                  С этой даты ({selectedDate}) запускается новая последовательность чередования точек (2 дня {points.find((p) => p.id === pendingCyclePointId)?.name} ➔ 2 дня следующая точка).
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsCycleConfirmOpen(false)}>
                Отмена
              </button>
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

      {/* Sticker Picker Modal */}
      <StickerPicker
        isOpen={isStickerPickerOpen}
        onClose={() => setIsStickerPickerOpen(false)}
        onSelectSticker={handleStickerAdded}
        targetDateTitle={dateFormatted}
      />

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
