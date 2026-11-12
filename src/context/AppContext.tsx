import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppSettings,
  WorkPoint,
  ScheduleConfig,
  DayOverride,
  PlacedSticker,
  HistoryEvent,
  ThemeId,
  ResolvedDayInfo,
  DayStatus,
  BackupData,
  IntimateEntry,
  NoteStickerConfig,
  JournalPageData,
  JournalPageDecoration
} from '../types';
import {
  initializeDatabase,
  saveSettings,
  getAllPoints,
  savePoint,
  deletePoint as dbDeletePoint,
  saveScheduleConfig,
  getAllOverrides,
  saveOverride,
  deleteOverride as dbDeleteOverride,
  getAllPlacedStickers,
  savePlacedSticker,
  deletePlacedSticker as dbDeletePlacedSticker,
  getHistoryEvents,
  addHistoryEvent,
  exportAllData,
  importData,
  resetAllData
} from '../services/database';
import { resolveDayInfo } from '../services/scheduleEngine';
import { parseISODate, getTodayString } from '../utils/dateUtils';
import { playPaperRustle, playStickerPop, playBubbleTap, triggerHaptic } from '../services/soundEffects';

interface AppContextType {
  // State
  isLoading: boolean;
  settings: AppSettings;
  points: WorkPoint[];
  pointsMap: Record<string, WorkPoint>;
  scheduleConfig: ScheduleConfig;
  overrides: Record<string, DayOverride>;
  placedStickers: PlacedSticker[];
  stickersByDate: Record<string, PlacedSticker[]>;
  history: HistoryEvent[];
  activeTab: 'calendar' | 'stickers' | 'stats' | 'settings';
  currentMonth: { year: number; month: number };
  selectedDate: string | null;

  // Navigation
  setActiveTab: (tab: 'calendar' | 'stickers' | 'stats' | 'settings') => void;
  setCurrentMonth: React.Dispatch<React.SetStateAction<{ year: number; month: number }>>;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  goToToday: () => void;
  setSelectedDate: (date: string | null) => void;

  // Day resolution helper
  getDayInfo: (dateStr: string) => ResolvedDayInfo;

  // Day Editing actions
  changeDayPointSingle: (date: string, pointId: string, status?: DayStatus) => Promise<void>;
  changeDayCycleSubsequent: (date: string, newFirstPointId: string) => Promise<void>;
  createDaySwap: (date: string, actualPointId: string, note?: string) => Promise<void>;
  updateDayStatus: (date: string, status: DayStatus) => Promise<void>;
  updateDayNote: (date: string, note: string, tags?: string[]) => Promise<void>;
  updateDayLifeDetails: (
    date: string,
    data: {
      intimate?: IntimateEntry;
      activities?: string[];
      noteSticker?: NoteStickerConfig;
      note?: string;
      tags?: string[];
    }
  ) => Promise<void>;
  updateNoteStickerTransform: (
    date: string,
    transform: { x?: number; y?: number; rotation?: number }
  ) => Promise<void>;
  updateJournalPage: (date: string, pageData: Partial<JournalPageData>) => Promise<void>;
  addJournalDecoration: (date: string, stickerId: string) => Promise<void>;
  updateJournalDecorationTransform: (
    date: string,
    decorId: string,
    transform: { x?: number; y?: number; scale?: number; rotation?: number }
  ) => Promise<void>;
  removeJournalDecoration: (date: string, decorId: string) => Promise<void>;
  resetDayToDefault: (date: string) => Promise<void>;

  // Sticker actions
  addStickerToDate: (
    date: string,
    stickerId: string,
    coords?: { x?: number; y?: number; scale?: number; rotation?: number }
  ) => Promise<PlacedSticker>;
  updateStickerTransform: (
    id: string,
    transform: { x?: number; y?: number; scale?: number; rotation?: number }
  ) => Promise<void>;
  removeSticker: (id: string) => Promise<void>;

  // Points Management
  saveWorkPoint: (point: WorkPoint) => Promise<void>;
  deleteWorkPoint: (id: string) => Promise<void>;

  // Settings & Theme
  setTheme: (theme: ThemeId) => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  toggleSound: () => Promise<void>;
  toggleHaptics: () => Promise<void>;
  updateScheduleConfigAction: (config: ScheduleConfig) => Promise<void>;
  completeInitialSetup: (firstPointId: string) => Promise<void>;
  toggleFavoriteSticker: (stickerId: string) => Promise<void>;

  // Backup & Reset
  exportDatabase: () => Promise<BackupData>;
  importDatabase: (backup: BackupData) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettingsState] = useState<AppSettings>({
    theme: 'cozy-cats',
    initialSetupDone: false,
    userNotesEnabled: true,
    highlightToday: true,
    soundEnabled: true,
    hapticsEnabled: true
  });
  const [points, setPoints] = useState<WorkPoint[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    baseStartDate: '2026-11-01',
    baseCycle: [],
    epochs: []
  });
  const [overrides, setOverrides] = useState<Record<string, DayOverride>>({});
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);

  // Navigation & view states
  const [activeTab, setActiveTabState] = useState<'calendar' | 'stickers' | 'stats' | 'settings'>('calendar');
  const todayParts = parseISODate(getTodayString());
  const [currentMonth, setCurrentMonth] = useState({ year: todayParts.year, month: todayParts.month });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const setActiveTab = useCallback((tab: 'calendar' | 'stickers' | 'stats' | 'settings') => {
    setActiveTabState((prev) => {
      if (prev !== tab) {
        playPaperRustle(settings.soundEnabled !== false);
        triggerHaptic(8, settings.hapticsEnabled !== false);
      }
      return tab;
    });
  }, [settings.soundEnabled, settings.hapticsEnabled]);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { settings: initSettings, points: initPoints, schedule: initSchedule } = await initializeDatabase();
      const allOverrides = await getAllOverrides();
      const allStickers = await getAllPlacedStickers();
      const allHistory = await getHistoryEvents(100);

      if (typeof window === 'undefined') return;

      setSettingsState(initSettings);
      setPoints(initPoints);
      setScheduleConfig(initSchedule);
      setOverrides(allOverrides);
      setPlacedStickers(allStickers);
      setHistory(allHistory);
    } catch (err) {
      if (typeof window !== 'undefined') {
        console.error('Failed to load database:', err);
      }
    } finally {
      if (typeof window !== 'undefined') {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quick lookup map for points
  const pointsMap = useMemo(() => {
    const map: Record<string, WorkPoint> = {};
    for (const p of points) {
      map[p.id] = p;
    }
    return map;
  }, [points]);

  // Group stickers by date
  const stickersByDate = useMemo(() => {
    const grouped: Record<string, PlacedSticker[]> = {};
    for (const s of placedStickers) {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    }
    return grouped;
  }, [placedStickers]);

  // Day resolution helper
  const getDayInfo = useCallback(
    (dateStr: string): ResolvedDayInfo => {
      return resolveDayInfo(dateStr, currentMonth.month, scheduleConfig, pointsMap, overrides, stickersByDate);
    },
    [currentMonth.month, scheduleConfig, pointsMap, overrides, stickersByDate]
  );

  // Month navigation
  const goToNextMonth = useCallback(() => {
    playPaperRustle(settings.soundEnabled !== false);
    triggerHaptic(10, settings.hapticsEnabled !== false);
    setCurrentMonth((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  }, [settings.soundEnabled, settings.hapticsEnabled]);

  const goToPrevMonth = useCallback(() => {
    playPaperRustle(settings.soundEnabled !== false);
    triggerHaptic(10, settings.hapticsEnabled !== false);
    setCurrentMonth((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  }, [settings.soundEnabled, settings.hapticsEnabled]);

  const goToToday = useCallback(() => {
    const parts = parseISODate(getTodayString());
    setCurrentMonth({ year: parts.year, month: parts.month });
  }, []);

  // Theme changer
  const setTheme = useCallback(
    async (theme: ThemeId) => {
      const updated = { ...settings, theme };
      setSettingsState(updated);
      await saveSettings(updated);
    },
    [settings]
  );

  // Settings update helper
  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial };
      setSettingsState(updated);
      await saveSettings(updated);
    },
    [settings]
  );

  const toggleSound = useCallback(async () => {
    const current = settings.soundEnabled !== false;
    await updateSettings({ soundEnabled: !current });
  }, [settings.soundEnabled, updateSettings]);

  const toggleHaptics = useCallback(async () => {
    const current = settings.hapticsEnabled !== false;
    await updateSettings({ hapticsEnabled: !current });
  }, [settings.hapticsEnabled, updateSettings]);

  // Toggle favorite sticker
  const toggleFavoriteSticker = useCallback(
    async (stickerId: string) => {
      const current = settings.favoriteStickerIds || [];
      const updatedFavorites = current.includes(stickerId)
        ? current.filter((id) => id !== stickerId)
        : [...current, stickerId];
      const updated = { ...settings, favoriteStickerIds: updatedFavorites };
      setSettingsState(updated);
      await saveSettings(updated);
    },
    [settings]
  );

  // Complete initial setup
  const completeInitialSetup = useCallback(
    async (firstPointId: string) => {
      // Reorder baseCycle so the selected point starts on baseStartDate
      const secondPoint = points.find((p) => p.id !== firstPointId) || points[0];
      const newCycle = [
        { pointId: firstPointId, durationDays: 2 },
        { pointId: secondPoint.id, durationDays: 2 }
      ];
      const newConfig: ScheduleConfig = {
        ...scheduleConfig,
        baseCycle: newCycle
      };
      const newSettings: AppSettings = {
        ...settings,
        initialSetupDone: true
      };

      setScheduleConfig(newConfig);
      setSettingsState(newSettings);

      await saveScheduleConfig(newConfig);
      await saveSettings(newSettings);
      await addHistoryEvent('cycle_change', scheduleConfig.baseStartDate, `Первоначальная настройка: первая точка — ${pointsMap[firstPointId]?.name || firstPointId}`);
      const h = await getHistoryEvents(100);
      setHistory(h);
    },
    [points, scheduleConfig, settings, pointsMap]
  );

  // Day Editing: Option A - change only this day
  const changeDayPointSingle = useCallback(
    async (date: string, pointId: string, status: DayStatus = 'work') => {
      const existing = overrides[date];
      const updated: DayOverride = {
        date,
        pointId,
        status,
        isSwap: false,
        note: existing?.note,
        tags: existing?.tags,
        intimate: existing?.intimate,
        activities: existing?.activities,
        noteSticker: existing?.noteSticker,
        updatedAt: new Date().toISOString()
      };

      await saveOverride(updated);
      if (typeof window !== 'undefined') {
        setOverrides((prev) => ({ ...prev, [date]: updated }));
      }

      const pointName = pointsMap[pointId]?.name || pointId;
      await addHistoryEvent('point_change', date, `Изменение точки на ${pointName} (только этот день)`);
      const h = await getHistoryEvents(100);
      setHistory(h);
    },
    [overrides, pointsMap]
  );

  // Day Editing: Option B - change this day and subsequent cycle
  const changeDayCycleSubsequent = useCallback(
    async (date: string, newFirstPointId: string) => {
      // Find other active points to complete cycle
      const otherPoints = points.filter((p) => p.isActive && p.id !== newFirstPointId);
      const cycleSteps = [
        { pointId: newFirstPointId, durationDays: 2 },
        ...(otherPoints.length > 0
          ? otherPoints.map((p) => ({ pointId: p.id, durationDays: 2 }))
          : [{ pointId: newFirstPointId, durationDays: 2 }])
      ];

      const newEpoch = {
        id: `epoch_${Date.now()}`,
        startDate: date,
        cycle: cycleSteps,
        createdAt: new Date().toISOString(),
        description: `Смена цикла с ${date}: первая точка ${pointsMap[newFirstPointId]?.name || newFirstPointId}`
      };

      // Filter out any existing epoch with same startDate and append
      const filteredEpochs = scheduleConfig.epochs.filter((e) => e.startDate !== date);
      const updatedConfig: ScheduleConfig = {
        ...scheduleConfig,
        epochs: [...filteredEpochs, newEpoch].sort((a, b) => a.startDate.localeCompare(b.startDate))
      };

      // Also clean up any single override for this specific date if it was set
      if (overrides[date]?.pointId) {
        const remainingOverrides = { ...overrides };
        delete remainingOverrides[date];
        await dbDeleteOverride(date);
        setOverrides(remainingOverrides);
      }

      await saveScheduleConfig(updatedConfig);
      setScheduleConfig(updatedConfig);

      const pointName = pointsMap[newFirstPointId]?.name || newFirstPointId;
      await addHistoryEvent('cycle_change', date, `Запуск нового цикла: 1-я точка ${pointName}`);
      const h = await getHistoryEvents(100);
      setHistory(h);
    },
    [points, pointsMap, scheduleConfig, overrides]
  );

  // Day Swap (Подмена)
  const createDaySwap = useCallback(
    async (date: string, actualPointId: string, note?: string) => {
      const scheduledPoint = getDayInfo(date).scheduledPoint;
      const originalPointId = scheduledPoint?.id || points[0]?.id;

      const swapOverride: DayOverride = {
        date,
        pointId: actualPointId,
        status: 'work',
        isSwap: true,
        originalPointId,
        note: note || overrides[date]?.note || 'Подмена рабочей смены',
        tags: overrides[date]?.tags,
        intimate: overrides[date]?.intimate,
        activities: overrides[date]?.activities,
        noteSticker: overrides[date]?.noteSticker,
        updatedAt: new Date().toISOString()
      };

      await saveOverride(swapOverride);
      setOverrides((prev) => ({ ...prev, [date]: swapOverride }));

      const actualName = pointsMap[actualPointId]?.name || actualPointId;
      const origName = pointsMap[originalPointId]?.name || originalPointId;
      await addHistoryEvent('swap', date, `Подмена: ${origName} ➔ ${actualName}${note ? ` (${note})` : ''}`);
      const h = await getHistoryEvents(100);
      setHistory(h);
    },
    [getDayInfo, points, overrides, pointsMap]
  );

  // Day Status (e.g. Day off, vacation, sick)
  const updateDayStatus = useCallback(
    async (date: string, status: DayStatus) => {
      const existing = overrides[date];
      const updated: DayOverride = {
        date,
        pointId: existing?.pointId,
        status,
        isSwap: existing?.isSwap,
        originalPointId: existing?.originalPointId,
        note: existing?.note,
        tags: existing?.tags,
        intimate: existing?.intimate,
        activities: existing?.activities,
        noteSticker: existing?.noteSticker,
        updatedAt: new Date().toISOString()
      };

      await saveOverride(updated);
      if (typeof window !== 'undefined') {
        setOverrides((prev) => ({ ...prev, [date]: updated }));
      }

      const statusLabels: Record<DayStatus, string> = {
        work: 'Рабочий день',
        day_off: 'Выходной день',
        vacation: 'Отпуск',
        sick: 'Больничный'
      };
      await addHistoryEvent('point_change', date, `Статус дня: ${statusLabels[status]}`);
      const h = await getHistoryEvents(100);
      setHistory(h);
    },
    [overrides]
  );

  // Day Note
  const updateDayNote = useCallback(
    async (date: string, note: string, tags?: string[]) => {
      const existing = overrides[date];
      if (!existing && (!note || note.trim().length === 0)) {
        return; // nothing to save
      }

      const updated: DayOverride = {
        date,
        pointId: existing?.pointId,
        status: existing?.status || 'work',
        isSwap: existing?.isSwap,
        originalPointId: existing?.originalPointId,
        note: note.trim(),
        tags: tags || existing?.tags,
        intimate: existing?.intimate,
        activities: existing?.activities,
        noteSticker: existing?.noteSticker,
        updatedAt: new Date().toISOString()
      };

      await saveOverride(updated);
      if (typeof window !== 'undefined') {
        setOverrides((prev) => ({ ...prev, [date]: updated }));
      }

      await addHistoryEvent('note', date, `Обновлена заметка на ${date}`);
      const h = await getHistoryEvents(100);
      setHistory(h);
    },
    [overrides]
  );

  // Update Day Life Details (intimate, activities, noteSticker, note, tags)
  const updateDayLifeDetails = useCallback(
    async (
      date: string,
      data: {
        intimate?: IntimateEntry;
        activities?: string[];
        noteSticker?: NoteStickerConfig;
        note?: string;
        tags?: string[];
      }
    ) => {
      const existing = overrides[date];
      const updated: DayOverride = {
        date,
        pointId: existing?.pointId,
        status: existing?.status || 'work',
        isSwap: existing?.isSwap,
        originalPointId: existing?.originalPointId,
        note: data.note !== undefined ? data.note : (existing?.note || ''),
        tags: data.tags !== undefined ? data.tags : (existing?.tags || []),
        intimate: data.intimate !== undefined ? data.intimate : existing?.intimate,
        activities: data.activities !== undefined ? data.activities : existing?.activities,
        noteSticker: data.noteSticker !== undefined ? data.noteSticker : existing?.noteSticker,
        journalPage: existing?.journalPage,
        updatedAt: new Date().toISOString()
      };

      await saveOverride(updated);
      if (typeof window !== 'undefined') {
        setOverrides((prev) => ({ ...prev, [date]: updated }));
      }

      playBubbleTap(settings.soundEnabled !== false);
      triggerHaptic(8, settings.hapticsEnabled !== false);

      await addHistoryEvent('note', date, `Обновлены отметки настроения и дел на ${date}`);
      const h = await getHistoryEvents(100);
      if (typeof window !== 'undefined') {
        setHistory(h);
      }
    },
    [overrides, settings]
  );

  // Update Note Sticker Transform (x, y, rotation)
  const updateNoteStickerTransform = useCallback(
    async (
      date: string,
      transform: { x?: number; y?: number; rotation?: number }
    ) => {
      const existing = overrides[date];
      if (!existing || !existing.noteSticker) return;

      const updatedSticker: NoteStickerConfig = {
        ...existing.noteSticker,
        x: transform.x !== undefined ? transform.x : existing.noteSticker.x,
        y: transform.y !== undefined ? transform.y : existing.noteSticker.y,
        rotation: transform.rotation !== undefined ? transform.rotation : existing.noteSticker.rotation
      };

      const updated: DayOverride = {
        ...existing,
        noteSticker: updatedSticker,
        updatedAt: new Date().toISOString()
      };

      await saveOverride(updated);
      if (typeof window !== 'undefined') {
        setOverrides((prev) => ({ ...prev, [date]: updated }));
      }
    },
    [overrides]
  );

  // Update Journal Page (text, paperType, decorations)
  const updateJournalPage = useCallback(
    async (date: string, pageData: Partial<JournalPageData>) => {
      const existing = overrides[date];
      const currentJournal: JournalPageData = existing?.journalPage || {
        paperType: 'lined',
        title: '',
        content: existing?.note || '',
        decorations: [],
        updatedAt: new Date().toISOString()
      };

      const updatedJournal: JournalPageData = {
        ...currentJournal,
        ...pageData,
        updatedAt: new Date().toISOString()
      };

      const updated: DayOverride = {
        date,
        pointId: existing?.pointId,
        status: existing?.status || 'work',
        isSwap: existing?.isSwap,
        originalPointId: existing?.originalPointId,
        note: updatedJournal.content !== undefined ? updatedJournal.content : (existing?.note || ''),
        tags: existing?.tags,
        intimate: existing?.intimate,
        activities: existing?.activities,
        noteSticker: existing?.noteSticker,
        journalPage: updatedJournal,
        updatedAt: new Date().toISOString()
      };

      await saveOverride(updated);
      if (typeof window !== 'undefined') {
        setOverrides((prev) => ({ ...prev, [date]: updated }));
      }

      playPaperRustle(settings.soundEnabled !== false);
      triggerHaptic(8, settings.hapticsEnabled !== false);
    },
    [overrides, settings]
  );

  // Add decoration to journal page
  const addJournalDecoration = useCallback(
    async (date: string, stickerId: string) => {
      const existing = overrides[date];
      const currentJournal: JournalPageData = existing?.journalPage || {
        paperType: 'lined',
        title: '',
        content: existing?.note || '',
        decorations: [],
        updatedAt: new Date().toISOString()
      };

      const newDecor: JournalPageDecoration = {
        id: `decor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        stickerId,
        x: Math.round(Math.random() * 30 - 15),
        y: Math.round(Math.random() * 30 - 15),
        scale: 1,
        rotation: Math.round(Math.random() * 16 - 8)
      };

      const updatedJournal: JournalPageData = {
        ...currentJournal,
        decorations: [...currentJournal.decorations, newDecor],
        updatedAt: new Date().toISOString()
      };

      const updated: DayOverride = {
        date,
        pointId: existing?.pointId,
        status: existing?.status || 'work',
        isSwap: existing?.isSwap,
        originalPointId: existing?.originalPointId,
        note: existing?.note || '',
        tags: existing?.tags,
        intimate: existing?.intimate,
        activities: existing?.activities,
        noteSticker: existing?.noteSticker,
        journalPage: updatedJournal,
        updatedAt: new Date().toISOString()
      };

      await saveOverride(updated);
      if (typeof window !== 'undefined') {
        setOverrides((prev) => ({ ...prev, [date]: updated }));
      }

      playStickerPop(settings.soundEnabled !== false);
      triggerHaptic(10, settings.hapticsEnabled !== false);
    },
    [overrides, settings]
  );

  // Update decoration transform (x, y, scale, rotation)
  const updateJournalDecorationTransform = useCallback(
    async (
      date: string,
      decorId: string,
      transform: { x?: number; y?: number; scale?: number; rotation?: number }
    ) => {
      const existing = overrides[date];
      if (!existing || !existing.journalPage) return;

      const updatedDecors = existing.journalPage.decorations.map((d) => {
        if (d.id !== decorId) return d;
        return {
          ...d,
          x: transform.x !== undefined ? transform.x : d.x,
          y: transform.y !== undefined ? transform.y : d.y,
          scale: transform.scale !== undefined ? transform.scale : d.scale,
          rotation: transform.rotation !== undefined ? transform.rotation : d.rotation
        };
      });

      const updatedJournal: JournalPageData = {
        ...existing.journalPage,
        decorations: updatedDecors,
        updatedAt: new Date().toISOString()
      };

      const updated: DayOverride = {
        ...existing,
        journalPage: updatedJournal,
        updatedAt: new Date().toISOString()
      };

      await saveOverride(updated);
      if (typeof window !== 'undefined') {
        setOverrides((prev) => ({ ...prev, [date]: updated }));
      }
    },
    [overrides]
  );

  // Remove decoration from journal page
  const removeJournalDecoration = useCallback(
    async (date: string, decorId: string) => {
      const existing = overrides[date];
      if (!existing || !existing.journalPage) return;

      const updatedDecors = existing.journalPage.decorations.filter((d) => d.id !== decorId);
      const updatedJournal: JournalPageData = {
        ...existing.journalPage,
        decorations: updatedDecors,
        updatedAt: new Date().toISOString()
      };

      const updated: DayOverride = {
        ...existing,
        journalPage: updatedJournal,
        updatedAt: new Date().toISOString()
      };

      await saveOverride(updated);
      if (typeof window !== 'undefined') {
        setOverrides((prev) => ({ ...prev, [date]: updated }));
      }
      playStickerPop(settings.soundEnabled !== false);
    },
    [overrides, settings]
  );

  // Reset Day to default
  const resetDayToDefault = useCallback(
    async (date: string) => {
      if (overrides[date]) {
        await dbDeleteOverride(date);
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[date];
          return next;
        });
      }

      await addHistoryEvent('reset', date, `Сброс к автоматическому графику`);
      const h = await getHistoryEvents(100);
      setHistory(h);
    },
    [overrides]
  );

  // Sticker actions
  const addStickerToDate = useCallback(
    async (
      date: string,
      stickerId: string,
      coords?: { x?: number; y?: number; scale?: number; rotation?: number }
    ) => {
      // Deterministic slight natural rotation between -10 and +10 degrees if not provided
      const pseudoRandomAngle = Math.round((((Date.now() % 17) - 8) * 1.25) * 10) / 10;
      const newSticker: PlacedSticker = {
        id: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date,
        stickerId,
        x: coords?.x ?? 0,
        y: coords?.y ?? 0,
        scale: coords?.scale ?? 1.0,
        rotation: coords?.rotation ?? pseudoRandomAngle,
        createdAt: new Date().toISOString()
      };

      await savePlacedSticker(newSticker);
      setPlacedStickers((prev) => [...prev, newSticker]);

      playStickerPop(settings.soundEnabled !== false);
      triggerHaptic(12, settings.hapticsEnabled !== false);

      await addHistoryEvent('sticker', date, `Добавлен стикер на ${date}`);
      const h = await getHistoryEvents(100);
      setHistory(h);

      return newSticker;
    },
    [settings.soundEnabled, settings.hapticsEnabled]
  );

  const updateStickerTransform = useCallback(
    async (
      id: string,
      transform: { x?: number; y?: number; scale?: number; rotation?: number }
    ) => {
      const target = placedStickers.find((s) => s.id === id);
      if (!target) return;

      const updated: PlacedSticker = {
        ...target,
        x: transform.x !== undefined ? transform.x : target.x,
        y: transform.y !== undefined ? transform.y : target.y,
        scale: transform.scale !== undefined ? transform.scale : target.scale,
        rotation: transform.rotation !== undefined ? transform.rotation : target.rotation
      };

      await savePlacedSticker(updated);
      setPlacedStickers((prev) => prev.map((s) => (s.id === id ? updated : s)));
    },
    [placedStickers]
  );

  const removeSticker = useCallback(
    async (id: string) => {
      const target = placedStickers.find((s) => s.id === id);
      await dbDeletePlacedSticker(id);
      setPlacedStickers((prev) => prev.filter((s) => s.id !== id));
      if (target) {
        await addHistoryEvent('sticker', target.date, `Удалён стикер`);
        const h = await getHistoryEvents(100);
        setHistory(h);
      }
    },
    [placedStickers]
  );

  // Work Points Management
  const saveWorkPoint = useCallback(async (point: WorkPoint) => {
    await savePoint(point);
    const all = await getAllPoints();
    setPoints(all);
  }, []);

  const deleteWorkPoint = useCallback(
    async (id: string) => {
      await dbDeletePoint(id);
      const all = await getAllPoints();
      setPoints(all);
    },
    []
  );

  // Schedule config direct update
  const updateScheduleConfigAction = useCallback(async (config: ScheduleConfig) => {
    await saveScheduleConfig(config);
    setScheduleConfig(config);
    await addHistoryEvent('cycle_change', config.baseStartDate, 'Обновлена конфигурация графика');
    const h = await getHistoryEvents(100);
    setHistory(h);
  }, []);

  // Backup & Reset
  const exportDatabase = useCallback(async () => {
    return exportAllData();
  }, []);

  const importDatabase = useCallback(
    async (backup: BackupData) => {
      await importData(backup);
      await loadData();
    },
    [loadData]
  );

  const resetDatabase = useCallback(async () => {
    await resetAllData();
    await loadData();
  }, [loadData]);

  const value: AppContextType = {
    isLoading,
    settings,
    points,
    pointsMap,
    scheduleConfig,
    overrides,
    placedStickers,
    stickersByDate,
    history,
    activeTab,
    currentMonth,
    selectedDate,
    setActiveTab,
    setCurrentMonth,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    setSelectedDate,
    getDayInfo,
    changeDayPointSingle,
    changeDayCycleSubsequent,
    createDaySwap,
    updateDayStatus,
    updateDayNote,
    updateDayLifeDetails,
    updateNoteStickerTransform,
    updateJournalPage,
    addJournalDecoration,
    updateJournalDecorationTransform,
    removeJournalDecoration,
    resetDayToDefault,
    addStickerToDate,
    updateStickerTransform,
    removeSticker,
    saveWorkPoint,
    deleteWorkPoint,
    setTheme,
    updateSettings,
    toggleSound,
    toggleHaptics,
    updateScheduleConfigAction,
    completeInitialSetup,
    toggleFavoriteSticker,
    exportDatabase,
    importDatabase,
    resetDatabase
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
