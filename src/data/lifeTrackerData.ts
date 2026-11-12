// Preset data for Life, Mood, Intimate Tracking and Scrapbook Note Stickers
import { NoteStickerStyle } from '../types';

export interface IntimatePreset {
  id: string;
  label: string;
  shortLabel: string;
  emoji: string;
}

export const INTIMATE_PRESETS: IntimatePreset[] = [
  { id: 'passionate', label: 'Страстный', shortLabel: 'Страстный', emoji: '🔥' },
  { id: 'tender', label: 'Нежный', shortLabel: 'Нежный', emoji: '🥰' },
  { id: 'quick', label: 'Быстрый', shortLabel: 'Быстрый', emoji: '⚡' },
  { id: 'romantic', label: 'Романтичный', shortLabel: 'Романтич...', emoji: '🍷' },
  { id: 'experimental', label: 'Экспериментальный', shortLabel: 'Эксперим...', emoji: '🎲' },
  { id: 'morning', label: 'Утренний', shortLabel: 'Утренний', emoji: '🌞' },
  { id: 'long', label: 'Долгий', shortLabel: 'Долгий', emoji: '🌙' },
  { id: 'playful', label: 'Игривый', shortLabel: 'Игривый', emoji: '😈' },
  { id: 'cozy', label: 'Уютный', shortLabel: 'Уютный', emoji: '🧸' }
];

export interface ActivityPreset {
  id: string;
  label: string;
  emoji: string;
  iconImage?: string; // Path relative to public/
}

export const ACTIVITY_PRESETS: ActivityPreset[] = [
  { id: 'date', label: 'Свидание', emoji: '🥂', iconImage: 'stickers/life/wine.webp' },
  { id: 'treats', label: 'Вкусняшки', emoji: '🍩', iconImage: 'stickers/life/food.webp' },
  { id: 'super_day', label: 'Супер день', emoji: '🌸', iconImage: 'stickers/life/star.webp' },
  { id: 'period', label: 'Эти дни', emoji: '🩸' },
  { id: 'movie', label: 'Кино / Сериал', emoji: '🎬', iconImage: 'stickers/life/movie.webp' },
  { id: 'walk', label: 'Прогулка', emoji: '🪴', iconImage: 'stickers/life/trip.webp' },
  { id: 'gift', label: 'Подарочек', emoji: '🎁', iconImage: 'stickers/life/gift.webp' },
  { id: 'cleaning', label: 'Уборка', emoji: '🧹', iconImage: 'stickers/life/broom.webp' },
  { id: 'cooking', label: 'Готовка', emoji: '🍳', iconImage: 'stickers/life/cooking.webp' },
  { id: 'laundry', label: 'Стирка', emoji: '🧺', iconImage: 'stickers/life/laundry.webp' },
  { id: 'sleep', label: 'Сон и отдых', emoji: '🐱', iconImage: 'stickers/life/sleep.webp' },
  { id: 'workout', label: 'Тренировка', emoji: '🏋️‍♀️', iconImage: 'stickers/life/workout.webp' },
  { id: 'shopping', label: 'Шопинг', emoji: '🛍️', iconImage: 'stickers/life/shopping.webp' },
  { id: 'chat', label: 'Болтовня', emoji: '💬', iconImage: 'stickers/life/chat.webp' },
  { id: 'beauty', label: 'Бьюти / Уход', emoji: '✨', iconImage: 'stickers/life/beauty.webp' }
];

export interface NoteStyleOption {
  id: NoteStickerStyle;
  name: string;
  description: string;
}

export const NOTE_STYLE_OPTIONS: NoteStyleOption[] = [
  { id: 'paper-clip', name: 'Со скрепкой', description: 'Светлый листочек в линейку с металлической скрепкой' },
  { id: 'washi-tape', name: 'Со скотчем', description: 'Крафтовый стикер с декоративным скотчем по бокам' },
  { id: 'spiral-pad', name: 'Блокнот', description: 'Страничка из спирального блокнота' },
  { id: 'cloud', name: 'Облачко', description: 'Нежное облачко для мыслей и секретиков' },
  { id: 'ribbon-card', name: 'С бантиком', description: 'Элегантная карточка с аккуратным бантиком' },
  { id: 'tag', name: 'Ярлычок', description: 'Скрапбук-тег с дырочкой и веревочкой' },
  { id: 'dark-craft', name: 'Тёмный крафт', description: 'Уютный тёплый крафтовый лист' }
];

export const ACTIVITY_MAP: Record<string, ActivityPreset> = ACTIVITY_PRESETS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<string, ActivityPreset>);
