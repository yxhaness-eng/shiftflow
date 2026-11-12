const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function extractNoteTemplates() {
  const imgPath = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/media_1794474783377_805e4c60.jpg';
  const outDir = path.resolve('public/stickers/notes');
  fs.mkdirSync(outDir, { recursive: true });

  // 682 x 1024
  // Let's sample a few representative scrapbook paper notes:
  // 1. Top-left: Lined paper with plaid washi tape & flower (col 0, row 0: left ~15, top ~10, w ~155, h ~150)
  // 2. Top-middle-left: Grid paper with paperclip (left ~180, top ~10, w ~155, h ~150)
  // 3. Top-middle-right: Lined paper with holes on left (left ~345, top ~10, w ~155, h ~150)
  // 4. Top-right: Card with ribbon bow (left ~515, top ~10, w ~155, h ~150)
  // 5. Row 2 binder clip note: left ~15, top ~165, w ~155, h ~140
  // 6. Row 3 dark craft note: left ~15, top ~320, w ~160, h ~120
  // 7. Bottom spiral pad: left ~370, top ~820, w ~125, h ~140

  const notes = [
    { id: 'lined-tape', name: 'Листочек со скотчем', left: 16, top: 12, width: 156, height: 150 },
    { id: 'grid-clip', name: 'Клетка со скрепкой', left: 180, top: 12, width: 156, height: 150 },
    { id: 'punched-lined', name: 'Блокнотный лист', left: 348, top: 12, width: 156, height: 150 },
    { id: 'ribbon-card', name: 'Открытка с бантиком', left: 518, top: 12, width: 154, height: 150 },
    { id: 'binder-grid', name: 'Крафт с зажимом', left: 16, top: 166, width: 156, height: 145 },
    { id: 'dark-craft', name: 'Тёмный крафт', left: 16, top: 320, width: 160, height: 125 },
    { id: 'spiral-pad', name: 'Блокнот на пружине', left: 370, top: 825, width: 130, height: 145 }
  ];

  for (const n of notes) {
    await sharp(imgPath)
      .extract({ left: n.left, top: n.top, width: n.width, height: n.height })
      .webp({ quality: 90 })
      .toFile(path.join(outDir, `${n.id}.webp`));
    console.log(`Saved note template ${n.id}.webp`);
  }
}

extractNoteTemplates().catch(console.error);
