// Journal Page Decorations Data
import { JournalPaperType } from '../types';

export interface JournalDecorItem {
  id: string;
  name: string;
  category: 'Гербарий' | 'Сухоцветы' | 'Винтаж' | 'Уют' | 'Скотч';
  imagePath: string;
}

export const JOURNAL_DECOR_ITEMS: JournalDecorItem[] = [
  // 1. Гербарий (Botanicals)
  { id: 'botanical_sage_herb', name: 'Шалфейная веточка', category: 'Гербарий', imagePath: 'stickers/journal/botanical_sage_herb.webp' },
  { id: 'botanical_terracotta_leaves', name: 'Терракотовые листья', category: 'Гербарий', imagePath: 'stickers/journal/botanical_terracotta_leaves.webp' },
  { id: 'botanical_green_daisy', name: 'Полевые ромашки', category: 'Гербарий', imagePath: 'stickers/journal/botanical_green_daisy.webp' },
  { id: 'botanical_warm_twigs', name: 'Тёплые веточки', category: 'Гербарий', imagePath: 'stickers/journal/botanical_warm_twigs.webp' },
  { id: 'botanical_dusty_wildflower', name: 'Пыльный колосок', category: 'Гербарий', imagePath: 'stickers/journal/botanical_dusty_wildflower.webp' },
  { id: 'botanical_blush_branch', name: 'Нежная ветвь', category: 'Гербарий', imagePath: 'stickers/journal/botanical_blush_branch.webp' },
  { id: 'botanical_taupe_dill', name: 'Соцветие укропа', category: 'Гербарий', imagePath: 'stickers/journal/botanical_taupe_dill.webp' },
  { id: 'botanical_olive_berries', name: 'Оливковые ягоды', category: 'Гербарий', imagePath: 'stickers/journal/botanical_olive_berries.webp' },
  { id: 'botanical_forest_eucalyptus', name: 'Лесной эвкалипт', category: 'Гербарий', imagePath: 'stickers/journal/botanical_forest_eucalyptus.webp' },

  // 2. Сухоцветы (Dried Flowers)
  { id: 'flower_lavender_stem', name: 'Сушёная лаванда', category: 'Сухоцветы', imagePath: 'stickers/journal/flower_lavender_stem.webp' },
  { id: 'flower_peony_blush', name: 'Чайная роза', category: 'Сухоцветы', imagePath: 'stickers/journal/flower_peony_blush.webp' },
  { id: 'flower_white_peony', name: 'Белый пион', category: 'Сухоцветы', imagePath: 'stickers/journal/flower_white_peony.webp' },
  { id: 'flower_purple_hydrangea', name: 'Сиреневая гортензия', category: 'Сухоцветы', imagePath: 'stickers/journal/flower_purple_hydrangea.webp' },
  { id: 'flower_daisy_chamomile', name: 'Прессованная ромашка', category: 'Сухоцветы', imagePath: 'stickers/journal/flower_daisy_chamomile.webp' },
  { id: 'flower_pink_hydrangea', name: 'Розовый сухоцвет', category: 'Сухоцветы', imagePath: 'stickers/journal/flower_pink_hydrangea.webp' },
  { id: 'flower_eucalyptus_branch', name: 'Листья эвкалипта', category: 'Сухоцветы', imagePath: 'stickers/journal/flower_eucalyptus_branch.webp' },
  { id: 'flower_cosmos_pink', name: 'Розовая космея', category: 'Сухоцветы', imagePath: 'stickers/journal/flower_cosmos_pink.webp' },
  { id: 'flower_anemone_violet', name: 'Фиолетовый анемон', category: 'Сухоцветы', imagePath: 'stickers/journal/flower_anemone_violet.webp' },

  // 3. Винтаж (Vintage)
  { id: 'vintage_postage_stamp', name: 'Почтовая марка', category: 'Винтаж', imagePath: 'stickers/journal/vintage_postage_stamp.webp' },
  { id: 'vintage_wax_seal', name: 'Сургучная печать', category: 'Винтаж', imagePath: 'stickers/journal/vintage_wax_seal.webp' },
  { id: 'vintage_travel_ticket', name: 'Билетик Admit One', category: 'Винтаж', imagePath: 'stickers/journal/vintage_travel_ticket.webp' },
  { id: 'vintage_olive_butterfly', name: 'Оливковая бабочка', category: 'Винтаж', imagePath: 'stickers/journal/vintage_olive_butterfly.webp' },
  { id: 'vintage_postcard', name: 'Старинная открытка', category: 'Винтаж', imagePath: 'stickers/journal/vintage_postcard.webp' },
  { id: 'vintage_lantern', name: 'Старинный фонарь', category: 'Винтаж', imagePath: 'stickers/journal/vintage_lantern.webp' },

  // 4. Уют (Cozy Autumn)
  { id: 'cozy_teddy_bear', name: 'Мишка Тедди', category: 'Уют', imagePath: 'stickers/journal/cozy_teddy_bear.webp' },
  { id: 'cozy_camera', name: 'Винтажная камера', category: 'Уют', imagePath: 'stickers/journal/cozy_camera.webp' },
  { id: 'cozy_books_stack', name: 'Стопка книг', category: 'Уют', imagePath: 'stickers/journal/cozy_books_stack.webp' },
  { id: 'cozy_tea_bag', name: 'Пакетик чая', category: 'Уют', imagePath: 'stickers/journal/cozy_tea_bag.webp' },
  { id: 'cozy_pinecone', name: 'Лесная шишка', category: 'Уют', imagePath: 'stickers/journal/cozy_pinecone.webp' },

  // 5. Скотч (Washi Tapes)
  { id: 'washi_stripes', name: 'Скотч в полоску', category: 'Скотч', imagePath: 'stickers/journal/washi_stripes.webp' },
  { id: 'washi_polka', name: 'Скотч в горошек', category: 'Скотч', imagePath: 'stickers/journal/washi_polka.webp' },
  { id: 'washi_hearts', name: 'Скотч с сердечками', category: 'Скотч', imagePath: 'stickers/journal/washi_hearts.webp' }
];

export const JOURNAL_DECOR_MAP: Record<string, JournalDecorItem> = JOURNAL_DECOR_ITEMS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<string, JournalDecorItem>);

export interface PaperOption {
  id: JournalPaperType;
  name: string;
  desc: string;
  previewBg: string;
}

export const JOURNAL_PAPER_OPTIONS: PaperOption[] = [
  { id: 'lined', name: 'Линейка', desc: 'Классический разлинованный лист ежедневника', previewBg: '#FFFDF9' },
  { id: 'grid', name: 'Клетка', desc: 'Уютная французская тонкая клетка', previewBg: '#FDFBF7' },
  { id: 'kraft', name: 'Крафт', desc: 'Тёплый бумажный крафт с органической текстурой', previewBg: '#DCC3A3' },
  { id: 'lavender', name: 'Лаванда', desc: 'Нежнейшая пастельная лавандовая бумага', previewBg: '#ECE6F4' },
  { id: 'sage_herbal', name: 'Шалфей', desc: 'Спокойный ботанический шалфейный лист', previewBg: '#E7EFE3' },
  { id: 'vintage', name: 'Винтаж', desc: 'Состаренный винтажный пергамент', previewBg: '#F4ECD8' }
];
