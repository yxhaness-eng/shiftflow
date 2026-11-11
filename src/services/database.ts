import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  AppSettings,
  WorkPoint,
  ScheduleConfig,
  DayOverride,
  PlacedSticker,
  HistoryEvent,
  BackupData
} from '../types';

interface ShiftFlowDB extends DBSchema {
  settings: {
    key: string;
    value: AppSettings;
  };
  points: {
    key: string;
    value: WorkPoint;
  };
  schedule: {
    key: string;
    value: ScheduleConfig;
  };
  overrides: {
    key: string; // date 'YYYY-MM-DD'
    value: DayOverride;
  };
  stickers: {
    key: string; // id
    value: PlacedSticker;
    indexes: {
      by_date: string;
    };
  };
  history: {
    key: string; // id
    value: HistoryEvent;
    indexes: {
      by_timestamp: string;
    };
  };
}

const DB_NAME = 'shiftflow_db';
const DB_VERSION = 1;

export const DEFAULT_POINTS: WorkPoint[] = [
  {
    id: 'point_a',
    name: 'Точка А',
    color: '#D9CDEB', // Soft pastel lavender
    textColor: '#4A3E59',
    isActive: true,
    order: 1
  },
  {
    id: 'point_b',
    name: 'Точка Б',
    color: '#D4DFCC', // Soft pastel sage
    textColor: '#3F4D38',
    isActive: true,
    order: 2
  }
];

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  baseStartDate: '2026-11-01',
  baseCycle: [
    { pointId: 'point_a', durationDays: 2 },
    { pointId: 'point_b', durationDays: 2 }
  ],
  epochs: []
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'cozy-cats',
  initialSetupDone: false,
  userNotesEnabled: true,
  highlightToday: true,
  soundEnabled: true,
  hapticsEnabled: true
};

let dbPromise: Promise<IDBPDatabase<ShiftFlowDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ShiftFlowDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ShiftFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('points')) {
          db.createObjectStore('points', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('schedule')) {
          db.createObjectStore('schedule');
        }
        if (!db.objectStoreNames.contains('overrides')) {
          db.createObjectStore('overrides', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('stickers')) {
          const stickerStore = db.createObjectStore('stickers', { keyPath: 'id' });
          stickerStore.createIndex('by_date', 'date');
        }
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by_timestamp', 'timestamp');
        }
      }
    });
  }
  return dbPromise;
}

/**
 * Initializes database with default data if empty
 */
export async function initializeDatabase(): Promise<{
  settings: AppSettings;
  points: WorkPoint[];
  schedule: ScheduleConfig;
}> {
  const db = await getDB();

  // Settings
  let settings = await db.get('settings', 'appSettings');
  if (!settings) {
    settings = { ...DEFAULT_SETTINGS };
    await db.put('settings', settings, 'appSettings');
  }

  // Points
  let points = await db.getAll('points');
  if (!points || points.length === 0) {
    const tx = db.transaction('points', 'readwrite');
    for (const p of DEFAULT_POINTS) {
      await tx.store.put(p);
    }
    await tx.done;
    points = [...DEFAULT_POINTS];
  }

  // Schedule Config
  let schedule = await db.get('schedule', 'scheduleConfig');
  if (!schedule) {
    schedule = { ...DEFAULT_SCHEDULE_CONFIG };
    await db.put('schedule', schedule, 'scheduleConfig');
  }

  return { settings, points, schedule };
}

// Settings operations
export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'appSettings');
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'appSettings');
  return settings || DEFAULT_SETTINGS;
}

// Points operations
export async function getAllPoints(): Promise<WorkPoint[]> {
  const db = await getDB();
  return db.getAll('points');
}

export async function savePoint(point: WorkPoint): Promise<void> {
  const db = await getDB();
  await db.put('points', point);
}

export async function deletePoint(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('points', id);
}

// Schedule operations
export async function getScheduleConfig(): Promise<ScheduleConfig> {
  const db = await getDB();
  const config = await db.get('schedule', 'scheduleConfig');
  return config || DEFAULT_SCHEDULE_CONFIG;
}

export async function saveScheduleConfig(config: ScheduleConfig): Promise<void> {
  const db = await getDB();
  await db.put('schedule', config, 'scheduleConfig');
}

// Overrides operations
export async function getAllOverrides(): Promise<Record<string, DayOverride>> {
  const db = await getDB();
  const list = await db.getAll('overrides');
  const record: Record<string, DayOverride> = {};
  for (const item of list) {
    record[item.date] = item;
  }
  return record;
}

export async function saveOverride(override: DayOverride): Promise<void> {
  const db = await getDB();
  await db.put('overrides', override);
}

export async function deleteOverride(date: string): Promise<void> {
  const db = await getDB();
  await db.delete('overrides', date);
}

// Stickers operations
export async function getAllPlacedStickers(): Promise<PlacedSticker[]> {
  const db = await getDB();
  return db.getAll('stickers');
}

export async function getStickersForDate(date: string): Promise<PlacedSticker[]> {
  const db = await getDB();
  return db.getAllFromIndex('stickers', 'by_date', date);
}

export async function savePlacedSticker(sticker: PlacedSticker): Promise<void> {
  const db = await getDB();
  await db.put('stickers', sticker);
}

export async function deletePlacedSticker(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('stickers', id);
}

// History operations
export async function addHistoryEvent(
  type: HistoryEvent['type'],
  date: string,
  details: string
): Promise<void> {
  const db = await getDB();
  const event: HistoryEvent = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    date,
    type,
    details
  };
  await db.put('history', event);
}

export async function getHistoryEvents(limit = 100): Promise<HistoryEvent[]> {
  const db = await getDB();
  const list = await db.getAll('history');
  return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
}

// Export / Import / Reset
export async function exportAllData(): Promise<BackupData> {
  const db = await getDB();
  const settings = (await db.get('settings', 'appSettings')) || DEFAULT_SETTINGS;
  const points = await db.getAll('points');
  const scheduleConfig = (await db.get('schedule', 'scheduleConfig')) || DEFAULT_SCHEDULE_CONFIG;
  const overrides = await getAllOverrides();
  const stickers = await db.getAll('stickers');
  const history = await db.getAll('history');

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    points,
    scheduleConfig,
    overrides,
    stickers,
    history
  };
}

export function validateBackupData(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Partial<BackupData>;
  if (typeof obj.version !== 'number') return false;
  if (!obj.settings || typeof obj.settings !== 'object') return false;
  if (!Array.isArray(obj.points)) return false;
  if (!obj.scheduleConfig || typeof obj.scheduleConfig !== 'object') return false;
  if (!obj.overrides || typeof obj.overrides !== 'object') return false;
  if (!Array.isArray(obj.stickers)) return false;
  return true;
}

export async function importData(backup: BackupData): Promise<void> {
  if (!validateBackupData(backup)) {
    throw new Error('Некорректный формат файла резервной копии');
  }

  const db = await getDB();

  // Settings
  await db.put('settings', backup.settings, 'appSettings');

  // Points
  const pointsTx = db.transaction('points', 'readwrite');
  await pointsTx.store.clear();
  for (const p of backup.points) {
    await pointsTx.store.put(p);
  }
  await pointsTx.done;

  // Schedule
  await db.put('schedule', backup.scheduleConfig, 'scheduleConfig');

  // Overrides
  const overridesTx = db.transaction('overrides', 'readwrite');
  await overridesTx.store.clear();
  for (const o of Object.values(backup.overrides)) {
    await overridesTx.store.put(o);
  }
  await overridesTx.done;

  // Stickers
  const stickersTx = db.transaction('stickers', 'readwrite');
  await stickersTx.store.clear();
  for (const s of backup.stickers) {
    await stickersTx.store.put(s);
  }
  await stickersTx.done;

  // History
  const historyTx = db.transaction('history', 'readwrite');
  await historyTx.store.clear();
  if (Array.isArray(backup.history)) {
    for (const h of backup.history) {
      await historyTx.store.put(h);
    }
  }
  await historyTx.done;
}

export async function resetAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['settings', 'points', 'schedule', 'overrides', 'stickers', 'history'], 'readwrite');
  await tx.objectStore('settings').clear();
  await tx.objectStore('points').clear();
  await tx.objectStore('schedule').clear();
  await tx.objectStore('overrides').clear();
  await tx.objectStore('stickers').clear();
  await tx.objectStore('history').clear();
  await tx.done;

  // Re-seed defaults
  await initializeDatabase();
}

