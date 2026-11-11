// ShiftFlow Data Models & Types

export type ThemeId = 'cozy-cats' | 'lavender-journal' | 'pastel-scrapbook';

export interface WorkPoint {
  id: string;
  name: string;
  color: string;           // Hex or pastel color
  textColor?: string;      // Optional contrast text color
  startTime?: string;      // e.g. "09:00"
  endTime?: string;        // e.g. "21:00"
  isActive: boolean;
  order: number;
}

export interface CycleStep {
  pointId: string;
  durationDays: number;    // e.g. 2 days
}

export interface ScheduleEpoch {
  id: string;
  startDate: string;       // YYYY-MM-DD
  cycle: CycleStep[];      // Sequence of points and their durations
  description?: string;
  createdAt: string;
}

export interface ScheduleConfig {
  baseStartDate: string;   // Default "2026-11-01"
  baseCycle: CycleStep[];  // e.g. Point A 2 days, Point B 2 days
  epochs: ScheduleEpoch[]; // Timeline overrides from a certain date onwards
}

export type DayStatus = 'work' | 'day_off' | 'vacation' | 'sick';

export interface DayOverride {
  date: string;            // YYYY-MM-DD
  pointId?: string;        // Actual point for this day (if work)
  status: DayStatus;       // 'work' | 'day_off' | 'vacation' | 'sick'
  isSwap?: boolean;        // Is this a shift substitution / подмена?
  originalPointId?: string;// Original scheduled point if swapped
  note?: string;           // Notes / journal text for this date
  tags?: string[];         // Personal event tags: "Романтика", "Отдых", "Встреча", etc.
  updatedAt: string;
}

export interface PlacedSticker {
  id: string;              // Unique placement id
  date: string;            // YYYY-MM-DD
  stickerId: string;       // ID referencing the sticker manifest
  x: number;               // Horizontal offset in percent (-50 .. 50)
  y: number;               // Vertical offset in percent (-50 .. 50)
  scale: number;           // Scale factor (0.6 .. 1.4)
  rotation: number;        // Rotation in degrees (-30 .. 30)
  createdAt: string;
}

export type StickerCategory =
  | 'Повседневная жизнь'
  | 'Хобби'
  | 'Отдых'
  | 'Настроение'
  | 'Погода'
  | 'Природа'
  | 'Романтика'
  | 'Другое';

export interface StickerManifestItem {
  id: string;
  name: string;
  category: StickerCategory;
  imagePath: string;
  description: string;
  isFavorite?: boolean;
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  date: string;            // The date modified
  type: 'point_change' | 'cycle_change' | 'swap' | 'note' | 'sticker' | 'reset';
  details: string;
}

export interface AppSettings {
  theme: ThemeId;
  initialSetupDone: boolean;
  userNotesEnabled: boolean;
  highlightToday: boolean;
  favoriteStickerIds?: string[];
  soundEnabled?: boolean;
  hapticsEnabled?: boolean;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  settings: AppSettings;
  points: WorkPoint[];
  scheduleConfig: ScheduleConfig;
  overrides: Record<string, DayOverride>;
  stickers: PlacedSticker[];
  history: HistoryEvent[];
}

export interface ResolvedDayInfo {
  date: string;            // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  dayNumber: number;
  dayOfWeek: number;       // 1 = Mon, 7 = Sun
  scheduledPoint: WorkPoint | null;
  actualPoint: WorkPoint | null;
  status: DayStatus;
  isSwap: boolean;
  originalPoint: WorkPoint | null;
  override?: DayOverride;
  stickers: PlacedSticker[];
  note?: string;
  tags?: string[];
}

