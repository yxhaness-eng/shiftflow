const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function extractCircleBadges() {
  const imgPath = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/media_1794474783380_b003baba.jpg';
  const outDir = path.resolve('public/stickers/life');
  fs.mkdirSync(outDir, { recursive: true });

  const badges = [
    { row: 0, col: 0, id: 'love', name: 'Нежность / Любовь' },
    { row: 0, col: 1, id: 'wine', name: 'Свидание / Вино' },
    { row: 0, col: 2, id: 'chat', name: 'Болтовня' },
    { row: 0, col: 3, id: 'broom', name: 'Уборка' },
    { row: 1, col: 0, id: 'laundry', name: 'Стирка' },
    { row: 1, col: 1, id: 'cooking', name: 'Готовка' },
    { row: 1, col: 2, id: 'movie', name: 'Кино / Сериал' },
    { row: 1, col: 3, id: 'sleep', name: 'Сон и отдых' },
    { row: 2, col: 0, id: 'workout', name: 'Тренировка' },
    { row: 2, col: 1, id: 'food', name: 'Вкусняшки' },
    { row: 2, col: 2, id: 'shopping', name: 'Шопинг' },
    { row: 2, col: 3, id: 'gift', name: 'Подарочек' },
    { row: 3, col: 0, id: 'trip', name: 'Прогулка' },
    { row: 3, col: 1, id: 'beauty', name: 'Бьюти / Уход' },
    { row: 3, col: 2, id: 'special', name: 'Особенный день' },
    { row: 3, col: 3, id: 'star', name: 'Супер день' }
  ];

  const centers = [
    [ { cx: 140, cy: 140, r: 96 }, { cx: 135, cy: 140, r: 96 }, { cx: 122, cy: 140, r: 96 }, { cx: 115, cy: 140, r: 96 } ],
    [ { cx: 140, cy: 126, r: 96 }, { cx: 135, cy: 126, r: 96 }, { cx: 122, cy: 126, r: 96 }, { cx: 116, cy: 126, r: 96 } ],
    [ { cx: 140, cy: 128, r: 96 }, { cx: 135, cy: 128, r: 96 }, { cx: 122, cy: 128, r: 96 }, { cx: 116, cy: 128, r: 96 } ],
    [ { cx: 140, cy: 107, r: 93 }, { cx: 135, cy: 107, r: 93 }, { cx: 124, cy: 107, r: 93 }, { cx: 115, cy: 107, r: 93 } ]
  ];

  console.log('Extracting 16 circular badges...');

  for (const item of badges) {
    const spec = centers[item.row][item.col];
    const absX = item.col * 256 + spec.cx;
    const absY = item.row * 256 + spec.cy;
    const r = spec.r;
    const size = r * 2;
    const left = Math.round(absX - r);
    const top = Math.round(absY - r);

    const maskSvg = `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r - 1}" fill="white"/></svg>`;

    const dest = path.join(outDir, `${item.id}.webp`);
    await sharp(imgPath)
      .extract({ left, top, width: size, height: size })
      .composite([{
        input: Buffer.from(maskSvg),
        blend: 'dest-in'
      }])
      .webp({ quality: 95 })
      .toFile(dest);

    console.log(`Saved circular badge: ${item.id}.webp (${item.name})`);
  }

  // Also check f1 and f2 for the new badges
  const f1 = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/media_1794487048997_f1e7b17e.jpg';
  const f2 = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/media_1794487049010_2473f83c.jpg';

  if (fs.existsSync(f1)) {
    const r1 = 195;
    const cx1 = 240, cy1 = 274;
    const mask1 = `<svg width="${r1*2}" height="${r1*2}"><circle cx="${r1}" cy="${r1}" r="${r1-2}" fill="white"/></svg>`;
    await sharp(f1)
      .extract({ left: Math.round(cx1 - r1), top: Math.round(cy1 - r1), width: r1*2, height: r1*2 })
      .composite([{ input: Buffer.from(mask1), blend: 'dest-in' }])
      .webp({ quality: 95 })
      .toFile(path.join(outDir, 'badge_custom_1.webp'));
    console.log('Saved badge_custom_1.webp!');
  }

  if (fs.existsSync(f2)) {
    const r2 = 195;
    const cx2 = 230, cy2 = 246;
    const mask2 = `<svg width="${r2*2}" height="${r2*2}"><circle cx="${r2}" cy="${r2}" r="${r2-2}" fill="white"/></svg>`;
    await sharp(f2)
      .extract({ left: Math.round(cx2 - r2), top: Math.round(cy2 - r2), width: r2*2, height: r2*2 })
      .composite([{ input: Buffer.from(mask2), blend: 'dest-in' }])
      .webp({ quality: 95 })
      .toFile(path.join(outDir, 'badge_custom_2.webp'));
    console.log('Saved badge_custom_2.webp!');
  }

  // Also copy the user's paper texture to public/textures/
  const paperSrc = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/media_1794487048995_7af9f656.jpg';
  const texDir = path.resolve('public/textures');
  fs.mkdirSync(texDir, { recursive: true });
  if (fs.existsSync(paperSrc)) {
    await sharp(paperSrc)
      .webp({ quality: 90 })
      .toFile(path.join(texDir, 'journal_paper.webp'));
    console.log('Saved journal_paper.webp texture!');
  }

  console.log('All done successfully!');
}

extractCircleBadges().catch(err => {
  console.error(err);
  process.exit(1);
});
