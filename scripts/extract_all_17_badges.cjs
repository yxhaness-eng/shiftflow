const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/media_1794496626048_c0b6f5e5.jpg';
const outDir = path.resolve('public/stickers/life');
fs.mkdirSync(outDir, { recursive: true });

const badges = [
  // Row 0
  { id: 'love', name: 'Нежность / Любовь', cx: 136, cy: 141, r: 96 },
  { id: 'wine', name: 'Свидание / Вино', cx: 381, cy: 135, r: 96 },
  { id: 'chat', name: 'Болтовня', cx: 642, cy: 130, r: 96 },
  { id: 'broom', name: 'Уборка', cx: 884, cy: 133, r: 96 },
  // Row 1
  { id: 'laundry', name: 'Стирка', cx: 134, cy: 367, r: 95 },
  { id: 'cooking', name: 'Готовка', cx: 387, cy: 360, r: 95 },
  { id: 'movie', name: 'Кино / Сериал', cx: 644, cy: 361, r: 95 },
  { id: 'sleep', name: 'Сон и отдых', cx: 860, cy: 363, r: 95 },
  // Row 2
  { id: 'workout', name: 'Тренировка', cx: 138, cy: 597, r: 95 },
  { id: 'food', name: 'Вкусняшки', cx: 397, cy: 595, r: 95 },
  { id: 'shopping', name: 'Шопинг', cx: 626, cy: 601, r: 95 },
  { id: 'gift', name: 'Подарочек', cx: 860, cy: 601, r: 95 },
  // Row 3
  { id: 'trip', name: 'Прогулка', cx: 124, cy: 840, r: 95 },
  { id: 'beauty', name: 'Бьюти / Уход', cx: 327, cy: 840, r: 95 },
  { id: 'period', name: 'Эти дни', cx: 514, cy: 840, r: 95 },
  { id: 'special', name: 'Особенный день', cx: 709, cy: 840, r: 93 },
  { id: 'star', name: 'Супер день', cx: 906, cy: 840, r: 95 }
];

async function extractAll() {
  console.log(`Extracting all 17 circular badges from ${imgPath}...`);

  for (const b of badges) {
    const size = b.r * 2;
    const left = Math.round(b.cx - b.r);
    const top = Math.round(b.cy - b.r);
    const maskSvg = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${b.r}" cy="${b.r}" r="${b.r - 1}" fill="white"/></svg>`
    );

    const dest = path.join(outDir, `${b.id}.webp`);
    await sharp(imgPath)
      .extract({ left, top, width: size, height: size })
      .composite([{ input: maskSvg, blend: 'dest-in' }])
      .webp({ quality: 95 })
      .toFile(dest);

    console.log(`Saved ${b.id}.webp (${b.name})`);
  }

  console.log('Successfully extracted all 17 badges!');
}

extractAll().catch(err => {
  console.error(err);
  process.exit(1);
});
