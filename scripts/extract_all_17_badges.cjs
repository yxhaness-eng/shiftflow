const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/media_1794496626048_c0b6f5e5.jpg';
const outDir = path.resolve('public/stickers/life');
fs.mkdirSync(outDir, { recursive: true });

// Pixel-accurate coordinates fitted via 180-ray least squares circle detection
const badges = [
  // Row 0
  { id: 'love', name: 'Нежность / Любовь', cx: 149.1, cy: 141.7, r: 112.0 },
  { id: 'wine', name: 'Свидание / Вино', cx: 392.4, cy: 142.2, r: 111.7 },
  { id: 'chat', name: 'Болтовня', cx: 632.6, cy: 142.3, r: 111.4 },
  { id: 'broom', name: 'Уборка', cx: 874.7, cy: 142.3, r: 112.3 },
  // Row 1
  { id: 'laundry', name: 'Стирка', cx: 149.1, cy: 378.2, r: 112.6 },
  { id: 'cooking', name: 'Готовка', cx: 393.0, cy: 377.7, r: 111.5 },
  { id: 'movie', name: 'Кино / Сериал', cx: 632.4, cy: 377.3, r: 111.2 },
  { id: 'sleep', name: 'Сон и отдых', cx: 875.4, cy: 378.0, r: 112.3 },
  // Row 2
  { id: 'workout', name: 'Тренировка', cx: 149.6, cy: 613.7, r: 112.7 },
  { id: 'food', name: 'Вкусняшки', cx: 393.9, cy: 613.5, r: 112.0 },
  { id: 'shopping', name: 'Шопинг', cx: 634.5, cy: 613.8, r: 111.0 },
  { id: 'gift', name: 'Подарочек', cx: 876.6, cy: 613.7, r: 112.0 },
  // Row 3
  { id: 'trip', name: 'Прогулка', cx: 124.6, cy: 841.3, r: 97.8 },
  { id: 'beauty', name: 'Бьюти / Уход', cx: 326.9, cy: 840.0, r: 96.0 },
  { id: 'period', name: 'Эти дни', cx: 519.5, cy: 842.6, r: 89.0 },
  { id: 'special', name: 'Особенный день', cx: 708.5, cy: 843.5, r: 94.9 },
  { id: 'star', name: 'Супер день', cx: 905.3, cy: 841.4, r: 96.5 }
];

async function extractAll() {
  console.log(`Extracting all 17 circular badges with 4x supersampled anti-aliased mask from ${imgPath}...`);

  const scale = 4;

  for (const b of badges) {
    const targetSize = Math.round(b.r) * 2;
    const left = Math.round(b.cx - b.r);
    const top = Math.round(b.cy - b.r);

    const hiSize = targetSize * scale;
    const maskCx = (b.cx - left) * scale;
    const maskCy = (b.cy - top) * scale;
    const hiR = (b.r - 0.25) * scale;

    // 4x vector mask for mathematical circle contour with sub-pixel antialiasing
    const hiMask = Buffer.from(
      `<svg width="${hiSize}" height="${hiSize}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${maskCx.toFixed(3)}" cy="${maskCy.toFixed(3)}" r="${hiR.toFixed(3)}" fill="white" />
      </svg>`
    );

    // Extract cropped bounding box, ensure alpha, upscale 4x with lanczos3
    const hiImgBuffer = await sharp(imgPath)
      .extract({ left, top, width: targetSize, height: targetSize })
      .ensureAlpha()
      .resize(hiSize, hiSize, { kernel: 'lanczos3' })
      .png()
      .toBuffer();

    // Composite mask in dest-in blend mode
    const compositedHi = await sharp(hiImgBuffer)
      .composite([{ input: hiMask, blend: 'dest-in' }])
      .png()
      .toBuffer();

    // Downscale back with lanczos3 for zero stair-stepping and perfectly smooth circle contours
    const dest = path.join(outDir, `${b.id}.webp`);
    await sharp(compositedHi)
      .resize(targetSize, targetSize, { kernel: 'lanczos3' })
      .webp({ quality: 95, effort: 6 })
      .toFile(dest);

    console.log(`Saved ${b.id}.webp (${b.name}) - ${targetSize}x${targetSize}`);
  }

  // Backward compatibility alias for intimate.webp -> special.webp
  const specialPath = path.join(outDir, 'special.webp');
  const intimatePath = path.join(outDir, 'intimate.webp');
  if (fs.existsSync(specialPath)) {
    fs.copyFileSync(specialPath, intimatePath);
    console.log('Synchronized intimate.webp with special.webp');
  }

  console.log('Successfully extracted all 17 badges with smooth mathematical circular contours!');
}

extractAll().catch(err => {
  console.error(err);
  process.exit(1);
});
