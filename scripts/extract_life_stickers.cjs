const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function extractLifeStickers() {
  const imgPath = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/media_1794474783380_b003baba.jpg';
  const outDir = path.resolve('public/stickers/life');
  fs.mkdirSync(outDir, { recursive: true });

  const items = [
    { row: 0, col: 0, id: 'love', name: 'Любовь', category: 'Романтика' },
    { row: 0, col: 1, id: 'wine', name: 'Свидание', category: 'Романтика' },
    { row: 0, col: 2, id: 'chat', name: 'Общение', category: 'Повседневная жизнь' },
    { row: 0, col: 3, id: 'broom', name: 'Уборка', category: 'Повседневная жизнь' },
    { row: 1, col: 0, id: 'laundry', name: 'Стирка', category: 'Повседневная жизнь' },
    { row: 1, col: 1, id: 'cooking', name: 'Готовка', category: 'Повседневная жизнь' },
    { row: 1, col: 2, id: 'movie', name: 'Кино / Сериал', category: 'Отдых' },
    { row: 1, col: 3, id: 'sleep', name: 'Сон / Отдых', category: 'Отдых' },
    { row: 2, col: 0, id: 'workout', name: 'Тренировка', category: 'Хобби' },
    { row: 2, col: 1, id: 'food', name: 'Вкусняшки', category: 'Повседневная жизнь' },
    { row: 2, col: 2, id: 'shopping', name: 'Шопинг', category: 'Повседневная жизнь' },
    { row: 2, col: 3, id: 'gift', name: 'Подарочек', category: 'Романтика' },
    { row: 3, col: 0, id: 'trip', name: 'Прогулка', category: 'Отдых' },
    { row: 3, col: 1, id: 'beauty', name: 'Бьюти / Уход', category: 'Повседневная жизнь' },
    { row: 3, col: 2, id: 'intimate', name: '18+', category: 'Романтика' },
    { row: 3, col: 3, id: 'star', name: 'Супер день', category: 'Настроение' }
  ];

  console.log('Extracting 16 life stickers...');

  for (const item of items) {
    // 1024 / 4 = 256. Center is at (col * 256 + 128, row * 256 + 128).
    // Let's find tight bounding circle: size ~230
    const size = 230;
    const left = Math.round(item.col * 256 + (256 - size) / 2);
    const top = Math.round(item.row * 256 + (256 - size) / 2);

    const circleMaskSvg = `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="white"/></svg>`;

    await sharp(imgPath)
      .extract({ left, top, width: size, height: size })
      .composite([{
        input: Buffer.from(circleMaskSvg),
        blend: 'dest-in'
      }])
      .webp({ quality: 90 })
      .toFile(path.join(outDir, `${item.id}.webp`));

    console.log(`Saved ${item.id}.webp (${item.name})`);
  }

  console.log('All 16 life stickers successfully extracted!');
}

extractLifeStickers().catch(console.error);
