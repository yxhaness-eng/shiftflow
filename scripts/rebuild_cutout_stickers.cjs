const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const userUploadedDir = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/';
const journalOutDir = path.resolve('public/stickers/journal');
const notesOutDir = path.resolve('public/stickers/notes');
const lifeOutDir = path.resolve('public/stickers/life');

fs.mkdirSync(journalOutDir, { recursive: true });
fs.mkdirSync(notesOutDir, { recursive: true });
fs.mkdirSync(lifeOutDir, { recursive: true });

/**
 * Cutout function:
 * Takes an image buffer or file, flood-fills from all perimeter pixels to find background,
 * sets background pixels to alpha = 0, feathers edges smoothly,
 * trims transparent borders with padding, and writes as WebP.
 */
async function cutoutObject(imageBuffer, options = {}) {
  const {
    isBgFn,
    padding = 4,
    feather = 1,
    minArea = 100
  } = options;

  const image = sharp(imageBuffer);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;

  // Build RGBA buffer
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = data[i * ch];
    out[i * 4 + 1] = data[i * ch + 1];
    out[i * 4 + 2] = data[i * ch + 2];
    out[i * 4 + 3] = ch === 4 ? data[i * 4 + 3] : 255;
  }

  // Determine background function if not provided
  let testBg = isBgFn;
  if (!testBg) {
    // Sample 4 corners and midpoints
    const samplePts = [
      [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
      [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],
      [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)]
    ];
    let bgR = 0, bgG = 0, bgB = 0, count = 0;
    for (const [x, y] of samplePts) {
      const idx = (y * w + x) * ch;
      if (data[idx] > 210 && data[idx + 1] > 210 && data[idx + 2] > 210) {
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        count++;
      }
    }
    if (count === 0) {
      bgR = 255; bgG = 255; bgB = 255;
    } else {
      bgR /= count; bgG /= count; bgB /= count;
    }

    testBg = (r, g, b, a) => {
      if (a === 0) return true;
      const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
      const isVeryLight = (r >= 240 && g >= 240 && b >= 240);
      return dist < 28 || isVeryLight;
    };
  }

  // BFS Flood Fill from all 4 boundaries
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0, qTail = 0;

  function checkAndEnqueue(x, y) {
    const idx = y * w + x;
    if (visited[idx]) return;
    const r = out[idx * 4];
    const g = out[idx * 4 + 1];
    const b = out[idx * 4 + 2];
    const a = out[idx * 4 + 3];
    if (testBg(r, g, b, a)) {
      visited[idx] = 1;
      queue[qTail++] = idx;
    }
  }

  for (let x = 0; x < w; x++) {
    checkAndEnqueue(x, 0);
    checkAndEnqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    checkAndEnqueue(0, y);
    checkAndEnqueue(w - 1, y);
  }

  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % w;
    const cy = (curr / w) | 0;

    out[curr * 4 + 3] = 0; // Transparent

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1,
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1
    ];

    for (const n of neighbors) {
      if (n !== -1 && !visited[n]) {
        const nx = n % w;
        const ny = (n / w) | 0;
        const r = out[n * 4];
        const g = out[n * 4 + 1];
        const b = out[n * 4 + 2];
        const a = out[n * 4 + 3];
        if (testBg(r, g, b, a)) {
          visited[n] = 1;
          queue[qTail++] = n;
        }
      }
    }
  }

  // Smooth edge antialiasing (feather)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (out[idx * 4 + 3] === 255) {
        const touchesZero = (
          out[(idx - 1) * 4 + 3] === 0 ||
          out[(idx + 1) * 4 + 3] === 0 ||
          out[(idx - w) * 4 + 3] === 0 ||
          out[(idx + w) * 4 + 3] === 0
        );
        if (touchesZero) {
          const r = out[idx * 4];
          const g = out[idx * 4 + 1];
          const b = out[idx * 4 + 2];
          // If close to white, make semi-transparent
          if (r > 230 && g > 230 && b > 230) {
            out[idx * 4 + 3] = 120;
          } else if (r > 215 && g > 215 && b > 215) {
            out[idx * 4 + 3] = 200;
          }
        }
      }
    }
  }

  // Compute tight bounding box of visible pixels
  let minX = w, maxX = 0, minY = h, maxY = 0, visibleCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = out[(y * w + x) * 4 + 3];
      if (a > 20) {
        visibleCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (visibleCount < minArea) {
    // Fallback if everything became transparent
    return sharp(out, { raw: { width: w, height: h, channels: 4 } })
      .webp({ quality: 95 })
      .toBuffer();
  }

  // Add padding
  minX = Math.max(0, minX - padding);
  maxX = Math.min(w - 1, maxX + padding);
  minY = Math.max(0, minY - padding);
  maxY = Math.min(h - 1, maxY + padding);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  // Extract trimmed RGBA
  const trimmed = Buffer.alloc(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * w + (minX + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;
      trimmed[dstIdx] = out[srcIdx];
      trimmed[dstIdx + 1] = out[srcIdx + 1];
      trimmed[dstIdx + 2] = out[srcIdx + 2];
      trimmed[dstIdx + 3] = out[srcIdx + 3];
    }
  }

  return sharp(trimmed, { raw: { width: cropW, height: cropH, channels: 4 } })
    .webp({ quality: 95, lossless: true })
    .toBuffer();
}

async function rebuildAll() {
  console.log('=== STARTING DIE-CUT STICKER PROCESSING ===');

  // 1. WATERCOLOR BOTANICALS (media_1794475770696_dcb7a4be.jpg - 735x951)
  console.log('\n1. Processing Watercolor Botanicals (9 items)...');
  const botImg = path.join(userUploadedDir, 'media_1794475770696_dcb7a4be.jpg');
  const botCols = 3, botRows = 3;
  const colW = Math.floor(735 / botCols);
  const rowH = Math.floor(951 / botRows);
  const botNames = [
    'botanical_sage_herb', 'botanical_terracotta_leaves', 'botanical_green_daisy',
    'botanical_warm_twigs', 'botanical_dusty_wildflower', 'botanical_blush_branch',
    'botanical_taupe_dill', 'botanical_olive_berries', 'botanical_forest_eucalyptus'
  ];

  for (let r = 0; r < botRows; r++) {
    for (let c = 0; c < botCols; c++) {
      const idx = r * botCols + c;
      const left = c * colW + 10;
      const top = r * rowH + 10;
      const width = colW - 20;
      const height = rowH - 20;

      const rawCrop = await sharp(botImg).extract({ left, top, width, height }).toBuffer();
      const cutout = await cutoutObject(rawCrop, {
        isBgFn: (cr, cg, cb, ca) => {
          // Off-white paper background in this sheet is ~248, 248, 246
          const dist = Math.sqrt((cr - 248)**2 + (cg - 248)**2 + (cb - 246)**2);
          return dist < 24 || (cr >= 242 && cg >= 242 && cb >= 240);
        },
        padding: 6
      });

      const outPath = path.join(journalOutDir, `${botNames[idx]}.webp`);
      fs.writeFileSync(outPath, cutout);
      console.log(`  ✓ Saved ${botNames[idx]}.webp`);
    }
  }

  // 2. DRIED PRESSED FLOWERS (media_1794475770700_8215d379.jpg - 682x1024)
  console.log('\n2. Processing Dried Pressed Flowers (9 items)...');
  const flowerImg = path.join(userUploadedDir, 'media_1794475770700_8215d379.jpg');
  const flowerCrops = [
    { id: 'flower_daisy_chamomile', left: 390, top: 10, width: 130, height: 130 },
    { id: 'flower_pink_hydrangea', left: 265, top: 15, width: 125, height: 125 },
    { id: 'flower_lavender_stem', left: 150, top: 20, width: 130, height: 320 },
    { id: 'flower_anemone_violet', left: 45, top: 155, width: 145, height: 215 },
    { id: 'flower_white_peony', left: 265, top: 295, width: 170, height: 180 },
    { id: 'flower_purple_hydrangea', left: 80, top: 330, width: 190, height: 220 },
    { id: 'flower_peony_blush', left: 420, top: 445, width: 220, height: 240 },
    { id: 'flower_eucalyptus_branch', left: 450, top: 675, width: 110, height: 310 },
    { id: 'flower_cosmos_pink', left: 150, top: 730, width: 145, height: 265 }
  ];

  for (const f of flowerCrops) {
    const rawCrop = await sharp(flowerImg).extract({ left: f.left, top: f.top, width: f.width, height: f.height }).toBuffer();
    const cutout = await cutoutObject(rawCrop, {
      isBgFn: (cr, cg, cb, ca) => {
        // Pure white background ~254, 254, 254
        return (cr >= 242 && cg >= 242 && cb >= 242);
      },
      padding: 6
    });

    const outPath = path.join(journalOutDir, `${f.id}.webp`);
    fs.writeFileSync(outPath, cutout);
    console.log(`  ✓ Saved ${f.id}.webp`);
  }

  // 3. VINTAGE TRAVEL ELEMENTS (media_1794475770718_e6b06aa0.jpg - 576x1024)
  console.log('\n3. Processing Vintage Elements (6 items)...');
  const vintageImg = path.join(userUploadedDir, 'media_1794475770718_e6b06aa0.jpg');
  const vintageCrops = [
    { id: 'vintage_postage_stamp', left: 430, top: 120, width: 115, height: 155 },
    { id: 'vintage_wax_seal', left: 435, top: 265, width: 98, height: 105 },
    { id: 'vintage_travel_ticket', left: 290, top: 370, width: 135, height: 110 },
    { id: 'vintage_postcard', left: 35, top: 665, width: 175, height: 120 },
    { id: 'vintage_lantern', left: 200, top: 665, width: 120, height: 120 },
    { id: 'vintage_olive_butterfly', left: 420, top: 665, width: 120, height: 120 }
  ];

  for (const v of vintageCrops) {
    const rawCrop = await sharp(vintageImg).extract({ left: v.left, top: v.top, width: v.width, height: v.height }).toBuffer();
    const cutout = await cutoutObject(rawCrop, {
      isBgFn: (cr, cg, cb, ca) => {
        return (cr >= 242 && cg >= 242 && cb >= 242);
      },
      padding: 6
    });

    const outPath = path.join(journalOutDir, `${v.id}.webp`);
    fs.writeFileSync(outPath, cutout);
    console.log(`  ✓ Saved ${v.id}.webp`);
  }

  // 4. COZY AUTUMN ELEMENTS (media_1794475770716_167e3fd8.jpg - 723x1024)
  console.log('\n4. Processing Cozy Autumn Elements (5 items)...');
  const autumnImg = path.join(userUploadedDir, 'media_1794475770716_167e3fd8.jpg');
  const autumnCrops = [
    { id: 'cozy_teddy_bear', left: 600, top: 728, width: 122, height: 152 },
    { id: 'cozy_camera', left: 355, top: 905, width: 140, height: 105 },
    { id: 'cozy_books_stack', left: 505, top: 855, width: 185, height: 165 },
    { id: 'cozy_tea_bag', left: 260, top: 740, width: 140, height: 120 },
    { id: 'cozy_pinecone', left: 510, top: 725, width: 110, height: 135 }
  ];

  for (const a of autumnCrops) {
    const rawCrop = await sharp(autumnImg).extract({ left: a.left, top: a.top, width: a.width, height: a.height }).toBuffer();
    const cutout = await cutoutObject(rawCrop, {
      isBgFn: (cr, cg, cb, ca) => {
        return (cr >= 240 && cg >= 240 && cb >= 240);
      },
      padding: 6
    });

    const outPath = path.join(journalOutDir, `${a.id}.webp`);
    fs.writeFileSync(outPath, cutout);
    console.log(`  ✓ Saved ${a.id}.webp`);
  }

  // 5. WASHI TAPES (media_1794474783377_805e4c60.jpg - 682x1024)
  console.log('\n5. Processing Washi Tapes (3 items)...');
  const sheetImg = path.join(userUploadedDir, 'media_1794474783377_805e4c60.jpg');
  const washiCrops = [
    { id: 'washi_stripes', left: 472, top: 660, width: 195, height: 42 },
    { id: 'washi_polka', left: 472, top: 720, width: 195, height: 42 },
    { id: 'washi_hearts', left: 472, top: 785, width: 195, height: 42 }
  ];

  for (const w of washiCrops) {
    const rawCrop = await sharp(sheetImg).extract({ left: w.left, top: w.top, width: w.width, height: w.height }).toBuffer();
    const cutout = await cutoutObject(rawCrop, {
      isBgFn: (cr, cg, cb, ca) => {
        return (cr >= 242 && cg >= 242 && cb >= 242);
      },
      padding: 4
    });

    const outPath = path.join(journalOutDir, `${w.id}.webp`);
    fs.writeFileSync(outPath, cutout);
    console.log(`  ✓ Saved ${w.id}.webp`);
  }

  // 6. SCRAPBOOK NOTE TEMPLATES (media_1794474783377_805e4c60.jpg)
  console.log('\n6. Processing Scrapbook Note Templates (7 items)...');
  const noteCrops = [
    { id: 'lined-tape', left: 14, top: 4, width: 162, height: 165 },
    { id: 'grid-clip', left: 178, top: 5, width: 166, height: 165 },
    { id: 'punched-lined', left: 346, top: 4, width: 168, height: 165 },
    { id: 'ribbon-card', left: 520, top: 3, width: 152, height: 165 },
    { id: 'binder-grid', left: 14, top: 162, width: 154, height: 160 },
    { id: 'dark-craft', left: 512, top: 838, width: 156, height: 165 },
    { id: 'spiral-pad', left: 368, top: 838, width: 135, height: 160 }
  ];

  for (const n of noteCrops) {
    const rawCrop = await sharp(sheetImg).extract({ left: n.left, top: n.top, width: n.width, height: n.height }).toBuffer();
    const cutout = await cutoutObject(rawCrop, {
      isBgFn: (cr, cg, cb, ca) => {
        return (cr >= 242 && cg >= 242 && cb >= 242);
      },
      padding: 4
    });

    const outPath = path.join(notesOutDir, `${n.id}.webp`);
    fs.writeFileSync(outPath, cutout);
    console.log(`  ✓ Saved note template ${n.id}.webp`);
  }

  // 7. LIFE STICKERS (16 items)
  console.log('\n7. Processing Life Stickers (16 items)...');
  const lifeFiles = fs.readdirSync(lifeOutDir).filter(f => f.endsWith('.webp'));
  for (const file of lifeFiles) {
    const filePath = path.join(lifeOutDir, file);
    const rawData = fs.readFileSync(filePath);
    const cutout = await cutoutObject(rawData, {
      isBgFn: (cr, cg, cb, ca) => {
        if (ca === 0) return true;
        // Cream background disk: light cream/tan
        return (cr >= 215 && cg >= 200 && cb >= 180 && Math.abs(cr - cg) <= 30 && cr >= cb);
      },
      padding: 4
    });

    fs.writeFileSync(filePath, cutout);
    console.log(`  ✓ Saved life sticker ${file}`);
  }

  console.log('\n=== ALL DIE-CUT STICKERS SUCCESSFULLY PROCESSED WITH TRANSPARENCY! ===');
}

rebuildAll().catch(err => {
  console.error('Error rebuilding stickers:', err);
  process.exit(1);
});
