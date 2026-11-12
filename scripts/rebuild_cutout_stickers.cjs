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
 * Robust Die-Cut Sticker Extractor:
 * 1. Takes image source and bounding box crop.
 * 2. Identifies background color and finds the main object via connected components.
 * 3. Erases stray corner fragments from neighboring stickers on the sheet.
 * 4. Flood-fills from all 4 boundaries into background pixels.
 * 5. Applies 1px soft edge antialiasing.
 * 6. Tightly trims to visible silhouette with small transparent padding.
 * 7. Encodes as crisp WebP with alpha channel.
 */
async function extractDieCutSticker(imgSource, crop, options = {}) {
  const {
    isBgColor = (r, g, b) => (r >= 238 && g >= 238 && b >= 238),
    padding = 4,
    minComponentRatio = 0.4
  } = options;

  const raw = await sharp(imgSource).extract(crop).raw().toBuffer({ resolveWithObject: true });
  const w = raw.info.width;
  const h = raw.info.height;
  const ch = raw.info.channels;
  const src = raw.data;

  // 1. Identify non-background pixels
  const isObj = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = src[i * ch];
    const g = src[i * ch + 1];
    const b = src[i * ch + 2];
    if (!isBgColor(r, g, b)) {
      isObj[i] = 1;
    }
  }

  // 2. Find connected components of object pixels
  const labels = new Int32Array(w * h);
  let compId = 0;
  const compSizes = {};
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (isObj[idx] && labels[idx] === 0) {
        compId++;
        let size = 0;
        const q = [idx];
        labels[idx] = compId;
        let head = 0;
        while (head < q.length) {
          const curr = q[head++];
          size++;
          const cx = curr % w;
          const cy = (curr / w) | 0;
          const neighbors = [
            cx > 0 ? curr - 1 : -1,
            cx < w - 1 ? curr + 1 : -1,
            cy > 0 ? curr - w : -1,
            cy < h - 1 ? curr + w : -1
          ];
          for (const n of neighbors) {
            if (n !== -1 && isObj[n] && labels[n] === 0) {
              labels[n] = compId;
              q.push(n);
            }
          }
        }
        compSizes[compId] = size;
      }
    }
  }

  // Find the largest component (the main object)
  let maxComp = 0, maxSize = 0;
  for (const [id, size] of Object.entries(compSizes)) {
    if (size > maxSize) {
      maxSize = size;
      maxComp = Number(id);
    }
  }

  // Keep the main component AND any significant internal components near the center
  // Discard any small components that touch the outer boundary (stray neighboring sticker fragments)
  const allowedComponents = new Set([maxComp]);
  for (const [id, size] of Object.entries(compSizes)) {
    const numId = Number(id);
    if (numId === maxComp) continue;

    // Check if this component touches the 4 boundaries of the crop
    let touchesBorder = false;
    for (let x = 0; x < w; x++) {
      if (labels[x] === numId || labels[(h - 1) * w + x] === numId) {
        touchesBorder = true;
        break;
      }
    }
    if (!touchesBorder) {
      for (let y = 0; y < h; y++) {
        if (labels[y * w] === numId || labels[y * w + (w - 1)] === numId) {
          touchesBorder = true;
          break;
        }
      }
    }

    // If it doesn't touch the border and is of reasonable size, it's an internal part of the object
    if (!touchesBorder && size >= 10) {
      allowedComponents.add(numId);
    }
  }

  // Filter isObj
  for (let i = 0; i < w * h; i++) {
    if (!allowedComponents.has(labels[i])) {
      isObj[i] = 0;
    }
  }

  // 3. Flood-fill from borders into background
  const isBg = new Uint8Array(w * h);
  const q = [];
  for (let x = 0; x < w; x++) {
    if (!isObj[x]) { isBg[x] = 1; q.push(x); }
    const b = (h - 1) * w + x;
    if (!isObj[b] && !isBg[b]) { isBg[b] = 1; q.push(b); }
  }
  for (let y = 0; y < h; y++) {
    const l = y * w;
    if (!isObj[l] && !isBg[l]) { isBg[l] = 1; q.push(l); }
    const r = y * w + (w - 1);
    if (!isObj[r] && !isBg[r]) { isBg[r] = 1; q.push(r); }
  }

  let head = 0;
  while (head < q.length) {
    const curr = q[head++];
    const cx = curr % w;
    const cy = (curr / w) | 0;
    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1,
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1
    ];
    for (const n of neighbors) {
      if (n !== -1 && !isObj[n] && !isBg[n]) {
        isBg[n] = 1;
        q.push(n);
      }
    }
  }

  // 4. Construct RGBA buffer
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = src[i * ch];
    out[i * 4 + 1] = src[i * ch + 1];
    out[i * 4 + 2] = src[i * ch + 2];
    out[i * 4 + 3] = isBg[i] ? 0 : 255;
  }

  // 5. Feather boundary pixels touching transparent background
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
          if (r > 220 && g > 220 && b > 220) {
            out[idx * 4 + 3] = 120;
          } else if (r > 200 && g > 200 && b > 200) {
            out[idx * 4 + 3] = 200;
          }
        }
      }
    }
  }

  // 6. Tight bounding box of visible pixels
  let minX = w, maxX = 0, minY = h, maxY = 0, count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = out[(y * w + x) * 4 + 3];
      if (a > 30) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (count < 20) {
    // Fallback: return full
    return sharp(out, { raw: { width: w, height: h, channels: 4 } })
      .webp({ quality: 95, lossless: true })
      .toBuffer();
  }

  minX = Math.max(0, minX - padding);
  maxX = Math.min(w - 1, maxX + padding);
  minY = Math.max(0, minY - padding);
  maxY = Math.min(h - 1, maxY + padding);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

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

/**
 * Process Life Stickers (16 items):
 * Removes cream circle background, feathers edges, trims to object silhouette.
 */
async function processLifeSticker(imgPath) {
  const fileBuffer = fs.readFileSync(imgPath);
  const raw = await sharp(fileBuffer).raw().toBuffer({ resolveWithObject: true });
  const w = raw.info.width, h = raw.info.height;
  const data = raw.data;
  const out = Buffer.from(data);

  // Background is cream: r>=210 && g>=195 && b>=175 && Math.abs(r-g)<=35 && r>=b
  function isCreamBg(idx) {
    const a = data[idx * 4 + 3];
    if (a === 0) return true;
    const r = data[idx * 4], g = data[idx * 4 + 1], b = data[idx * 4 + 2];
    return (r >= 210 && g >= 195 && b >= 175 && Math.abs(r - g) <= 35 && r >= b);
  }

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0, qTail = 0;

  for (let x = 0; x < w; x++) {
    if (isCreamBg(x)) { visited[x] = 1; queue[qTail++] = x; }
    const b = (h - 1) * w + x;
    if (isCreamBg(b) && !visited[b]) { visited[b] = 1; queue[qTail++] = b; }
  }
  for (let y = 0; y < h; y++) {
    const l = y * w;
    if (isCreamBg(l) && !visited[l]) { visited[l] = 1; queue[qTail++] = l; }
    const r = y * w + (w - 1);
    if (isCreamBg(r) && !visited[r]) { visited[r] = 1; queue[qTail++] = r; }
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
      if (n !== -1 && !visited[n] && isCreamBg(n)) {
        visited[n] = 1;
        queue[qTail++] = n;
      }
    }
  }

  // Feather
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
          if (r > 200 && g > 190 && b > 170) {
            out[idx * 4 + 3] = 140;
          }
        }
      }
    }
  }

  // Trim to visible content
  let minX = w, maxX = 0, minY = h, maxY = 0, count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (out[(y * w + x) * 4 + 3] > 30) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (count < 20) {
    return sharp(out, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 95, lossless: true }).toBuffer();
  }

  const pad = 4;
  minX = Math.max(0, minX - pad);
  maxX = Math.min(w - 1, maxX + pad);
  minY = Math.max(0, minY - pad);
  maxY = Math.min(h - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

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

  return sharp(trimmed, { raw: { width: cropW, height: cropH, channels: 4 } }).webp({ quality: 95, lossless: true }).toBuffer();
}

async function rebuildAll() {
  console.log('=== STARTING DIE-CUT REBUILD WITH COMPONENT ISOLATION ===');

  // 1. WATERCOLOR BOTANICALS (media_1794475770696_dcb7a4be.jpg)
  console.log('\n1. Watercolor Botanicals (9 items)...');
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

      const cutout = await extractDieCutSticker(botImg, { left, top, width, height }, {
        isBgColor: (cr, cg, cb) => {
          const dist = Math.sqrt((cr - 248)**2 + (cg - 248)**2 + (cb - 246)**2);
          return dist < 26 || (cr >= 240 && cg >= 240 && cb >= 238);
        },
        padding: 5
      });

      fs.writeFileSync(path.join(journalOutDir, `${botNames[idx]}.webp`), cutout);
      console.log(`  ✓ Saved ${botNames[idx]}.webp`);
    }
  }

  // 2. DRIED FLOWERS (media_1794475770700_8215d379.jpg)
  console.log('\n2. Dried Pressed Flowers (9 items)...');
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
    const cutout = await extractDieCutSticker(flowerImg, { left: f.left, top: f.top, width: f.width, height: f.height }, {
      isBgColor: (cr, cg, cb) => (cr >= 240 && cg >= 240 && cb >= 240),
      padding: 5
    });
    fs.writeFileSync(path.join(journalOutDir, `${f.id}.webp`), cutout);
    console.log(`  ✓ Saved ${f.id}.webp`);
  }

  // 3. VINTAGE ELEMENTS (media_1794475770718_e6b06aa0.jpg)
  console.log('\n3. Vintage Elements (6 items)...');
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
    const cutout = await extractDieCutSticker(vintageImg, { left: v.left, top: v.top, width: v.width, height: v.height }, {
      isBgColor: (cr, cg, cb) => (cr >= 240 && cg >= 240 && cb >= 240),
      padding: 5
    });
    fs.writeFileSync(path.join(journalOutDir, `${v.id}.webp`), cutout);
    console.log(`  ✓ Saved ${v.id}.webp`);
  }

  // 4. COZY AUTUMN (media_1794475770716_167e3fd8.jpg)
  console.log('\n4. Cozy Autumn Elements (5 items)...');
  const autumnImg = path.join(userUploadedDir, 'media_1794475770716_167e3fd8.jpg');
  const autumnCrops = [
    { id: 'cozy_teddy_bear', left: 595, top: 728, width: 128, height: 155 },
    { id: 'cozy_camera', left: 355, top: 905, width: 140, height: 105 },
    { id: 'cozy_books_stack', left: 505, top: 855, width: 185, height: 165 },
    { id: 'cozy_tea_bag', left: 260, top: 740, width: 140, height: 120 },
    { id: 'cozy_pinecone', left: 510, top: 725, width: 110, height: 135 }
  ];

  for (const a of autumnCrops) {
    const cutout = await extractDieCutSticker(autumnImg, { left: a.left, top: a.top, width: a.width, height: a.height }, {
      isBgColor: (cr, cg, cb) => (cr >= 238 && cg >= 238 && cb >= 238),
      padding: 5
    });
    fs.writeFileSync(path.join(journalOutDir, `${a.id}.webp`), cutout);
    console.log(`  ✓ Saved ${a.id}.webp`);
  }

  // 5. WASHI TAPES (media_1794474783377_805e4c60.jpg)
  console.log('\n5. Washi Tapes (3 items)...');
  const sheetImg = path.join(userUploadedDir, 'media_1794474783377_805e4c60.jpg');
  const washiCrops = [
    { id: 'washi_stripes', left: 472, top: 652, width: 195, height: 35 },
    { id: 'washi_polka', left: 472, top: 701, width: 195, height: 36 },
    { id: 'washi_hearts', left: 472, top: 746, width: 195, height: 36 }
  ];

  for (const w of washiCrops) {
    const cutout = await extractDieCutSticker(sheetImg, { left: w.left, top: w.top, width: w.width, height: w.height }, {
      isBgColor: (cr, cg, cb) => (cr >= 240 && cg >= 240 && cb >= 240),
      padding: 3
    });
    fs.writeFileSync(path.join(journalOutDir, `${w.id}.webp`), cutout);
    console.log(`  ✓ Saved ${w.id}.webp`);
  }

  // 6. SCRAPBOOK NOTE TEMPLATES (media_1794474783377_805e4c60.jpg)
  console.log('\n6. Scrapbook Note Templates (7 items)...');
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
    const cutout = await extractDieCutSticker(sheetImg, { left: n.left, top: n.top, width: n.width, height: n.height }, {
      isBgColor: (cr, cg, cb) => (cr >= 240 && cg >= 240 && cb >= 240),
      padding: 4
    });
    fs.writeFileSync(path.join(notesOutDir, `${n.id}.webp`), cutout);
    console.log(`  ✓ Saved note template ${n.id}.webp`);
  }

  // 7. LIFE STICKERS (16 items)
  console.log('\n7. Life Stickers (16 items)...');
  const lifeFiles = fs.readdirSync(lifeOutDir).filter(f => f.endsWith('.webp'));
  for (const file of lifeFiles) {
    const filePath = path.join(lifeOutDir, file);
    const cutout = await processLifeSticker(filePath);
    fs.writeFileSync(filePath, cutout);
    console.log(`  ✓ Saved life sticker ${file}`);
  }

  console.log('\n=== COMPLETE DIE-CUT STICKER REBUILD FINISHED ===');
}

rebuildAll().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
