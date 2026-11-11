const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicStickersDir = path.resolve('public/stickers');
fs.mkdirSync(publicStickersDir, { recursive: true });

function isBgPixel(r, g, b, bgR = 252, bgG = 241, bgB = 224) {
  const diff = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
  return diff < 22;
}

async function processCell(file, rect, id, label) {
  const { left, top, width, height } = rect;
  if (width <= 10 || height <= 10) return null;

  const cropped = sharp(file).extract({ left, top, width, height });
  const { data, info } = await cropped.raw().toBuffer({ resolveWithObject: true });

  // Sample corner background color
  const samplePoints = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [Math.floor(width / 2), 0], [0, Math.floor(height / 2)]
  ];
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  for (const [sx, sy] of samplePoints) {
    const idx = (sy * width + sx) * 3;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
    bgCount++;
  }
  bgR /= bgCount;
  bgG /= bgCount;
  bgB /= bgCount;

  // Find tight bounding box of non-background content
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let fgPixels = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
      if (dist >= 20) {
        fgPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If too few foreground pixels, it's an empty cell
  if (fgPixels < 400 || minX >= maxX || minY >= maxY) {
    return null;
  }

  // Add 4px padding
  const pad = 4;
  const tightLeft = Math.max(0, minX - pad);
  const tightTop = Math.max(0, minY - pad);
  const tightRight = Math.min(width - 1, maxX + pad);
  const tightBottom = Math.min(height - 1, maxY + pad);
  const tightW = tightRight - tightLeft + 1;
  const tightH = tightBottom - tightTop + 1;

  // Build RGBA with clean background transparency
  const rgba = Buffer.alloc(tightW * tightH * 4);

  for (let ty = 0; ty < tightH; ty++) {
    for (let tx = 0; tx < tightW; tx++) {
      const srcX = tightLeft + tx;
      const srcY = tightTop + ty;
      const srcIdx = (srcY * width + srcX) * 3;
      const dstIdx = (ty * tightW + tx) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);

      rgba[dstIdx] = r;
      rgba[dstIdx + 1] = g;
      rgba[dstIdx + 2] = b;

      // Antialiased transparency threshold
      if (dist < 14) {
        rgba[dstIdx + 3] = 0;
      } else if (dist < 34) {
        const alpha = Math.round(((dist - 14) / 20) * 255);
        rgba[dstIdx + 3] = alpha;
      } else {
        rgba[dstIdx + 3] = 255;
      }
    }
  }

  const filename = `${id}.png`;
  const outPath = path.join(publicStickersDir, filename);

  await sharp(rgba, { raw: { width: tightW, height: tightH, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  return {
    id,
    filename,
    width: tightW,
    height: tightH,
    fgPixels
  };
}

async function extractAll() {
  const sheets = [
    {
      file: 'Изображение ChatGPT 11 нояб. 2026 г., 11_35_21.jpg',
      prefix: 'cat_art',
      cols: [
        [16, 210],
        [215, 410],
        [416, 610],
        [618, 814],
        [820, 1012]
      ],
      rows: [
        [25, 270],
        [278, 512],
        [518, 750],
        [756, 990],
        [996, 1236],
        [1246, 1495]
      ]
    },
    {
      file: 'Изображение ChatGPT 11 нояб. 2026 г., 11_35_28.jpg',
      prefix: 'cat_daily',
      cols: [
        [38, 226],
        [231, 410],
        [415, 598],
        [604, 786],
        [790, 976]
      ],
      rows: [
        [125, 322],
        [328, 524],
        [530, 726],
        [731, 926],
        [931, 1125],
        [1131, 1327],
        [1332, 1526]
      ]
    },
    {
      file: 'Изображение ChatGPT 11 нояб. 2026 г., 11_35_35.jpg',
      prefix: 'cat_cozy',
      cols: [
        [20, 215],
        [220, 412],
        [416, 612],
        [617, 814],
        [820, 1005]
      ],
      rows: [
        [40, 273],
        [282, 513],
        [523, 750],
        [761, 980],
        [992, 1210],
        [1221, 1472]
      ]
    }
  ];

  const extracted = [];
  let counter = 1;

  for (const sheet of sheets) {
    for (let r = 0; r < sheet.rows.length; r++) {
      for (let c = 0; c < sheet.cols.length; c++) {
        const [cStart, cEnd] = sheet.cols[c];
        const [rStart, rEnd] = sheet.rows[r];
        const rect = {
          left: cStart,
          top: rStart,
          width: cEnd - cStart,
          height: rEnd - rStart
        };
        const id = `${sheet.prefix}_${String(r * sheet.cols.length + c + 1).padStart(2, '0')}`;
        const res = await processCell(sheet.file, rect, id, `${sheet.prefix} r${r} c${c}`);
        if (res) {
          extracted.push(res);
        }
      }
    }
  }

  console.log(`Extracted total ${extracted.length} high-quality stickers into public/stickers/!`);
}

extractAll().catch(console.error);

