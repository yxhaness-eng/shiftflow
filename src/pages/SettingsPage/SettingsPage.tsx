import React, { useState, useRef } from 'react';
import {
  Calendar,
  Layers,
  Palette,
  Database,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertTriangle,
  Clock,
  X,
  Volume2,
  VolumeX,
  Smartphone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ThemeId, WorkPoint, CycleStep, ScheduleConfig, BackupData } from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import { playPaperRustle, playStickerPop, triggerHaptic } from '../../services/soundEffects';

const PASTEL_PALETTE = [
  { color: '#D9CDEB', text: '#4A3E59', name: 'Лавандовый' },
  { color: '#D4DFCC', text: '#3F4D38', name: 'Шалфейный' },
  { color: '#EBCDD0', text: '#59393C', name: 'Пыльно-розовый' },
  { color: '#D5E1EF', text: '#354759', name: 'Нежно-голубой' },
  { color: '#F4EBDD', text: '#544638', name: 'Кремовый' },
  { color: '#FDE4CF', text: '#61462E', name: 'Персиковый' },
  { color: '#E2D4F0', text: '#463757', name: 'Сиреневый' },
  { color: '#C8E6C9', text: '#2E4F31', name: 'Мятный' }
];

export const SettingsPage: React.FC = () => {
  const {
    settings,
    setTheme,
    toggleSound,
    toggleHaptics,
    points,
    saveWorkPoint,
    deleteWorkPoint,
    scheduleConfig,
    updateScheduleConfigAction,
    exportDatabase,
    importDatabase,
    resetDatabase
  } = useApp();

  // Point editor modal
  const [editingPoint, setEditingPoint] = useState<WorkPoint | null>(null);
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);

  // Cycle config local edits
  const [baseStartDate, setBaseStartDate] = useState(scheduleConfig.baseStartDate);
  const [cycleSteps, setCycleSteps] = useState<CycleStep[]>(scheduleConfig.baseCycle);
  const [isCycleSaved, setIsCycleSaved] = useState(false);

  // Reset confirmation
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme changer
  const handleThemeChange = (newTheme: ThemeId) => {
    setTheme(newTheme);
  };

  // Work Points operations
  const handleAddNewPoint = () => {
    const newId = `point_${Date.now()}`;
    const defaultColor = PASTEL_PALETTE[points.length % PASTEL_PALETTE.length];
    setEditingPoint({
      id: newId,
      name: `Точка ${String.fromCharCode(65 + points.length)}`,
      color: defaultColor.color,
      textColor: defaultColor.text,
      startTime: '',
      endTime: '',
      isActive: true,
      order: points.length + 1
    });
    setIsPointModalOpen(true);
  };

  const handleSavePointModal = async () => {
    if (!editingPoint || !editingPoint.name.trim()) return;
    await saveWorkPoint(editingPoint);
    setIsPointModalOpen(false);
    setEditingPoint(null);
  };

  const handleDeletePoint = async (pointId: string) => {
    if (points.length <= 1) {
      alert('В расписании должна оставаться хотя бы одна рабочая точка.');
      return;
    }
    if (confirm('Вы уверены, что хотите удалить эту точку?')) {
      await deleteWorkPoint(pointId);
      // Remove from cycle steps if present
      const updatedCycle = cycleSteps.filter((s) => s.pointId !== pointId);
      if (updatedCycle.length > 0) {
        setCycleSteps(updatedCycle);
        await updateScheduleConfigAction({
          ...scheduleConfig,
          baseCycle: updatedCycle
        });
      }
    }
  };

  // Cycle Step operations
  const handleAddCycleStep = (pointId: string) => {
    const updated = [...cycleSteps, { pointId, durationDays: 2 }];
    setCycleSteps(updated);
  };

  const handleUpdateStepDuration = (index: number, days: number) => {
    const updated = [...cycleSteps];
    updated[index] = { ...updated[index], durationDays: Math.max(1, days) };
    setCycleSteps(updated);
  };

  const handleRemoveCycleStep = (index: number) => {
    if (cycleSteps.length <= 1) {
      alert('Цикл должен содержать как минимум один шаг.');
      return;
    }
    const updated = cycleSteps.filter((_, idx) => idx !== index);
    setCycleSteps(updated);
  };

  const handleSaveCycle = async () => {
    const newConfig: ScheduleConfig = {
      ...scheduleConfig,
      baseStartDate,
      baseCycle: cycleSteps
    };
    await updateScheduleConfigAction(newConfig);
    setIsCycleSaved(true);
    setTimeout(() => setIsCycleSaved(false), 2000);
  };

  // Export / Import
  const handleExport = async () => {
    const data = await exportDatabase();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shiftflow-backup-${getTodayString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as BackupData;
        await importDatabase(parsed);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 2500);
      } catch (err: any) {
        console.error('Import error:', err);
        setImportError(err.message || 'Ошибка при чтении или валидации файла резервной копии');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleResetData = async () => {
    await resetDatabase();
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="settings-page">
      {/* 1. Theme & Appearance */}
      <div className="card">
        <h3 className="card-title">
          <Palette size={18} color="var(--accent-lavender-dark)" />
          <span>Тема оформления</span>
        </h3>

        <div className="themes-grid">
          {/* Theme 1: Wine Velvet (Фото 4 - Основная тема) */}
          <div
            className={`theme-card ${settings.theme === 'wine-velvet' ? 'selected' : ''}`}
            onClick={() => handleThemeChange('wine-velvet')}
          >
            <div className="theme-preview-dots">
              <span style={{ backgroundColor: '#1F060B' }} />
              <span style={{ backgroundColor: '#FAF5EE' }} />
              <span style={{ backgroundColor: '#DE4364' }} />
            </div>
            <div className="theme-info">
              <div className="theme-name">Wine Velvet</div>
              <div className="theme-desc">Тёмный винный велюр, страницы айвори и розовый румянец</div>
            </div>
            {settings.theme === 'wine-velvet' && <Check size={16} className="theme-check-icon" />}
          </div>

          {/* Theme 2: Rose Vintage */}
          <div
            className={`theme-card ${settings.theme === 'rose-vintage' ? 'selected' : ''}`}
            onClick={() => handleThemeChange('rose-vintage')}
          >
            <div className="theme-preview-dots">
              <span style={{ backgroundColor: '#FAF2F3' }} />
              <span style={{ backgroundColor: '#FFFFFF' }} />
              <span style={{ backgroundColor: '#B85D6B' }} />
            </div>
            <div className="theme-info">
              <div className="theme-name">Rose Vintage</div>
              <div className="theme-desc">Пыльно-розовый пергамент, античное дерево и сургуч</div>
            </div>
            {settings.theme === 'rose-vintage' && <Check size={16} className="theme-check-icon" />}
          </div>

          {/* Theme 3: Royal Bordeaux */}
          <div
            className={`theme-card ${settings.theme === 'royal-bordeaux' ? 'selected' : ''}`}
            onClick={() => handleThemeChange('royal-bordeaux')}
          >
            <div className="theme-preview-dots">
              <span style={{ backgroundColor: '#180408' }} />
              <span style={{ backgroundColor: '#24080E' }} />
              <span style={{ backgroundColor: '#D4AF37' }} />
            </div>
            <div className="theme-info">
              <div className="theme-name">Royal Bordeaux</div>
              <div className="theme-desc">Полуночный бордо, королевская слива и античное золото</div>
            </div>
            {settings.theme === 'royal-bordeaux' && <Check size={16} className="theme-check-icon" />}
          </div>

          {/* Theme 4: Cozy Journal */}
          <div
            className={`theme-card ${settings.theme === 'cozy-journal' || settings.theme === 'cozy-cats' ? 'selected' : ''}`}
            onClick={() => handleThemeChange('cozy-journal')}
          >
            <div className="theme-preview-dots">
              <span style={{ backgroundColor: '#FAF5EB' }} />
              <span style={{ backgroundColor: '#FFFFFF' }} />
              <span style={{ backgroundColor: '#8C6541' }} />
            </div>
            <div className="theme-info">
              <div className="theme-name">Cozy Journal</div>
              <div className="theme-desc">Тёплая молочная бумага, эспрессо-чернила и благородная кожа</div>
            </div>
            {(settings.theme === 'cozy-journal' || settings.theme === 'cozy-cats') && (
              <Check size={16} className="theme-check-icon" />
            )}
          </div>

          {/* Theme 5: Lavender Journal */}
          <div
            className={`theme-card ${settings.theme === 'lavender-journal' ? 'selected' : ''}`}
            onClick={() => handleThemeChange('lavender-journal')}
          >
            <div className="theme-preview-dots">
              <span style={{ backgroundColor: '#F7F4F9' }} />
              <span style={{ backgroundColor: '#FFFFFF' }} />
              <span style={{ backgroundColor: '#7B5EA7' }} />
            </div>
            <div className="theme-info">
              <div className="theme-name">Lavender Journal</div>
              <div className="theme-desc">Мягкая глициния, глубокая слива и королевская лаванда</div>
            </div>
            {settings.theme === 'lavender-journal' && <Check size={16} className="theme-check-icon" />}
          </div>

          {/* Theme 6: Sage Botanical (Pastel Scrapbook) */}
          <div
            className={`theme-card ${settings.theme === 'pastel-scrapbook' || settings.theme === 'sage-botanical' ? 'selected' : ''}`}
            onClick={() => handleThemeChange('pastel-scrapbook')}
          >
            <div className="theme-preview-dots">
              <span style={{ backgroundColor: '#F2F6F0' }} />
              <span style={{ backgroundColor: '#FFFFFF' }} />
              <span style={{ backgroundColor: '#557A46' }} />
            </div>
            <div className="theme-info">
              <div className="theme-name">Sage Botanical</div>
              <div className="theme-desc">Травяная матча-бумага, лесные чернила и оливковый шалфей</div>
            </div>
            {(settings.theme === 'pastel-scrapbook' || settings.theme === 'sage-botanical') && (
              <Check size={16} className="theme-check-icon" />
            )}
          </div>
        </div>
      </div>

      {/* 2. Cozy Sound Effects & Haptics */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 className="card-title">
          <Volume2 size={18} color="var(--accent-lavender-dark)" />
          <span>Звуковые эффекты и тактильный отклик</span>
        </h3>

        <div className="settings-toggles-list">
          {/* Sound Toggle */}
          <div className="settings-toggle-row">
            <div className="toggle-info">
              <div className="toggle-title">
                {settings.soundEnabled !== false ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>Звуковые эффекты</span>
              </div>
              <div className="toggle-desc">
                Мягкий шорох бумаги при переключении страниц и нежный хлопок при наклеивании стикеров
              </div>
            </div>
            <label className="switch-control">
              <input
                type="checkbox"
                checked={settings.soundEnabled !== false}
                onChange={() => toggleSound()}
              />
              <span className="slider-round" />
            </label>
          </div>

          {/* Haptics Toggle */}
          <div className="settings-toggle-row">
            <div className="toggle-info">
              <div className="toggle-title">
                <Smartphone size={16} />
                <span>Тактильный отклик (вибрация)</span>
              </div>
              <div className="toggle-desc">
                Мягкая короткая вибрация при взаимодействии с календарем, жестах смахивания и стикерах
              </div>
            </div>
            <label className="switch-control">
              <input
                type="checkbox"
                checked={settings.hapticsEnabled !== false}
                onChange={() => toggleHaptics()}
              />
              <span className="slider-round" />
            </label>
          </div>
        </div>

        {/* Audio / Haptic Testing Buttons */}
        <div className="settings-sound-preview-actions">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Попробовать эффекты:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => playPaperRustle(true)}
              title="Воспроизвести мягкий шорох бумаги"
            >
              📄 Шорох бумаги
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => playStickerPop(true)}
              title="Воспроизвести нежный хлопок наклеивания"
            >
              🌸 Хлопок стикера
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => triggerHaptic(20, true)}
              title="Проверить вибрацию устройства"
            >
              📳 Вибрация
            </button>
          </div>
        </div>
      </div>

      {/* 3. Work Points Management */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            <Layers size={18} color="var(--accent-lavender-dark)" />
            <span>Рабочие точки ({points.length})</span>
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={handleAddNewPoint}>
            <Plus size={14} />
            <span>Добавить точку</span>
          </button>
        </div>

        <div className="points-settings-list">
          {points.map((point) => (
            <div key={point.id} className="point-settings-item">
              <div className="point-settings-left">
                <span
                  className="point-color-indicator"
                  style={{ backgroundColor: point.color }}
                />
                <div>
                  <div className="point-settings-name">{point.name}</div>
                  <div className="point-settings-sub">
                    {point.startTime && point.endTime ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {point.startTime} — {point.endTime}
                      </span>
                    ) : (
                      'Время смены не задано'
                    )}
                  </div>
                </div>
              </div>

              <div className="point-settings-actions">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setEditingPoint(point);
                    setIsPointModalOpen(true);
                  }}
                >
                  Изменить
                </button>
                <button
                  className="btn-icon"
                  style={{ color: '#A33A3A' }}
                  onClick={() => handleDeletePoint(point.id)}
                  title="Удалить точку"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Schedule & Cycle Configuration */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            <Calendar size={18} color="var(--accent-lavender-dark)" />
            <span>Настройка рабочего графика 7/0</span>
          </h3>
          {isCycleSaved && (
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-sage-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={14} /> Сохранено
            </span>
          )}
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Вы можете настроить дату начала отсчёта графика и произвольное чередование точек (например: 2 дня Точка А, 2 дня Точка Б).
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label className="section-label">Дата начала цикла:</label>
          <input
            type="date"
            className="date-input"
            value={baseStartDate}
            onChange={(e) => setBaseStartDate(e.target.value)}
            style={{ maxWidth: '220px', marginTop: '6px' }}
          />
        </div>

        <div>
          <label className="section-label">Последовательность чередования в цикле:</label>
          <div className="cycle-steps-list">
            {cycleSteps.map((step, idx) => {
              const pt = points.find((p) => p.id === step.pointId);
              return (
                <div key={idx} className="cycle-step-item">
                  <span className="step-index">#{idx + 1}</span>
                  <div
                    className="step-point-badge"
                    style={{ backgroundColor: pt?.color || 'var(--bg-secondary)', color: pt?.textColor || 'inherit' }}
                  >
                    {pt?.name || step.pointId}
                  </div>
                  <div className="step-duration-controls">
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>дней подряд:</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={step.durationDays}
                      onChange={(e) => handleUpdateStepDuration(idx, parseInt(e.target.value, 10) || 1)}
                      className="step-duration-input"
                    />
                  </div>
                  <button
                    className="btn-icon-sm"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => handleRemoveCycleStep(idx)}
                    title="Удалить шаг"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            <span style={{ fontSize: '0.8rem', alignSelf: 'center', color: 'var(--text-secondary)' }}>
              Добавить в цикл:
            </span>
            {points.map((p) => (
              <button
                key={p.id}
                className="btn btn-outline btn-sm"
                onClick={() => handleAddCycleStep(p.id)}
              >
                <Plus size={12} /> {p.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={handleSaveCycle}>
            Сохранить настройки графика
          </button>
        </div>
      </div>

      {/* 4. Backup & Restore */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 className="card-title">
          <Database size={18} color="var(--accent-lavender-dark)" />
          <span>Данные и резервное копирование</span>
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Все данные календаря, смены, подмены, личные заметки и стикеры хранятся локально в вашем браузере (IndexedDB).
          Вы можете выгрузить файл резервной копии или перенести его на другое устройство.
        </p>

        {importSuccess && (
          <div className="alert-box success" style={{ marginBottom: '14px' }}>
            <Check size={16} /> Данные успешно импортированы!
          </div>
        )}

        {importError && (
          <div className="alert-box error" style={{ marginBottom: '14px' }}>
            <AlertTriangle size={16} /> {importError}
          </div>
        )}

        <div className="backup-actions-row">
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} />
            <span>Экспорт в JSON</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button
            className="btn btn-outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            <span>Импорт JSON</span>
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => setIsResetConfirmOpen(true)}
            style={{ marginLeft: 'auto' }}
          >
            <RotateCcw size={14} />
            <span>Сбросить всё</span>
          </button>
        </div>
      </div>

      {/* Point Modal (Add / Edit) */}
      {isPointModalOpen && editingPoint && (
        <div className="modal-backdrop" onClick={() => setIsPointModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {editingPoint.id.startsWith('point_') && points.some((p) => p.id === editingPoint.id)
                  ? 'Редактирование точки'
                  : 'Новая рабочая точка'}
              </h3>
              <button className="btn-icon" onClick={() => setIsPointModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ gap: '16px' }}>
              <div>
                <label className="section-label">Название точки:</label>
                <input
                  type="text"
                  className="setup-text-input"
                  style={{ width: '100%', marginTop: '4px' }}
                  value={editingPoint.name}
                  onChange={(e) => setEditingPoint({ ...editingPoint, name: e.target.value })}
                  placeholder="Например: Точка А"
                />
              </div>

              <div>
                <label className="section-label">Цвет метки (пастельная палитра):</label>
                <div className="palette-grid">
                  {PASTEL_PALETTE.map((pal) => (
                    <button
                      key={pal.color}
                      className={`palette-swatch ${editingPoint.color === pal.color ? 'selected' : ''}`}
                      style={{ backgroundColor: pal.color }}
                      onClick={() =>
                        setEditingPoint({
                          ...editingPoint,
                          color: pal.color,
                          textColor: pal.text
                        })
                      }
                      title={pal.name}
                    >
                      {editingPoint.color === pal.color && <Check size={14} color={pal.text} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="section-label">Время смены (необязательно):</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                  <input
                    type="time"
                    className="time-input"
                    value={editingPoint.startTime || ''}
                    onChange={(e) => setEditingPoint({ ...editingPoint, startTime: e.target.value })}
                  />
                  <span>—</span>
                  <input
                    type="time"
                    className="time-input"
                    value={editingPoint.endTime || ''}
                    onChange={(e) => setEditingPoint({ ...editingPoint, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsPointModalOpen(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleSavePointModal}>
                Сохранить точку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setIsResetConfirmOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#A33A3A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> Сброс всех данных
              </h3>
              <button className="btn-icon" onClick={() => setIsResetConfirmOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Вы уверены, что хотите полностью сбросить базу данных? Все созданные изменения, подмены, личные заметки и наклеенные стикеры будут безвозвратно удалены.
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Рекомендуем перед сбросом экспортировать резервную копию в JSON.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsResetConfirmOpen(false)}>
                Отмена
              </button>
              <button className="btn btn-danger" onClick={handleResetData}>
                Да, стереть всё
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
