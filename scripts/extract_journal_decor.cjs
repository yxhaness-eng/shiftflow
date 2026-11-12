const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const baseDir = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/';
const outDir = path.resolve('public/stickers/journal');
fs.mkdirSync(outDir, { recursive: true });

async function extractAll() {
  console.log('Extracting journal decor stickers...');

  // 1. Watercolor botanicals on pastel blobs (media_1794475770696_dcb7a4be.jpg - 735x951)
  // 3 rows x 3 cols
  const botImg = path.join(baseDir, 'media_1794475770696_dcb7a4be.jpg');
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
      const left = c * colW + 15;
      const top = r * rowH + 15;
      const width = colW - 30;
      const height = rowH - 30;

      await sharp(botImg)
        .extract({ left, top, width, height })
        .webp({ quality: 90 })
        .toFile(path.join(outDir, `${botNames[idx]}.webp`));
    }
  }
  console.log('Extracted 9 watercolor botanicals');

  // 2. Dried flowers & pressed botanicals (media_1794475770700_8215d379.jpg - 682x1024)
  const flowerImg = path.join(baseDir, 'media_1794475770700_8215d379.jpg');
  const flowerCrops = [
    { id: 'flower_lavender_stem', left: 160, top: 25, width: 140, height: 280, name: 'Веточка лаванды' },
    { id: 'flower_peony_blush', left: 400, top: 440, width: 180, height: 160, name: 'Чайная роза' },
    { id: 'flower_white_peony', left: 270, top: 290, width: 155, height: 140, name: 'Белый пион' },
    { id: 'flower_purple_hydrangea', left: 85, top: 330, width: 170, height: 180, name: 'Гортензия' },
    { id: 'flower_daisy_chamomile', left: 395, top: 15, width: 110, height: 105, name: 'Ромашка' },
    { id: 'flower_pink_hydrangea', left: 270, top: 15, width: 110, height: 110, name: 'Сухоцвет' },
    { id: 'flower_eucalyptus_branch', left: 460, top: 660, width: 90, height: 250, name: 'Эвкалипт' },
    { id: 'flower_cosmos_pink', left: 160, top: 720, width: 125, height: 230, name: 'Космея' },
    { id: 'flower_anemone_violet', left: 50, top: 160, width: 130, height: 180, name: 'Анемон' }
  ];

  for (const f of flowerCrops) {
    await sharp(flowerImg)
      .extract({ left: f.left, top: f.top, width: f.width, height: f.height })
      .webp({ quality: 90 })
      .toFile(path.join(outDir, `${f.id}.webp`));
  }
  console.log('Extracted 9 dried pressed flowers');

  // 3. Vintage traveler & aesthetic elements (media_1794475770718_e6b06aa0.jpg - 576x1024)
  const vintageImg = path.join(baseDir, 'media_1794475770718_e6b06aa0.jpg');
  const vintageCrops = [
    { id: 'vintage_postage_stamp', left: 435, top: 125, width: 95, height: 130, name: 'Винтажная марка' },
    { id: 'vintage_wax_seal', left: 435, top: 265, width: 85, height: 85, name: 'Сургучная печать' },
    { id: 'vintage_travel_ticket', left: 295, top: 370, width: 115, height: 85, name: 'Билетик Admit One' },
    { id: 'vintage_olive_butterfly', left: 425, top: 695, width: 75, height: 60, name: 'Винтажная бабочка' },
    { id: 'vintage_postcard', left: 40, top: 655, width: 155, height: 100, name: 'Винтажная открытка' },
    { id: 'vintage_lantern', left: 205, top: 660, width: 95, height: 95, name: 'Старинный фонарь' }
  ];

  for (const v of vintageCrops) {
    await sharp(vintageImg)
      .extract({ left: v.left, top: v.top, width: v.width, height: v.height })
      .webp({ quality: 90 })
      .toFile(path.join(outDir, `${v.id}.webp`));
  }
  console.log('Extracted 6 vintage travel stickers');

  // 4. Cozy autumn brown elements (media_1794475770716_167e3fd8.jpg - 723x1024)
  const autumnImg = path.join(baseDir, 'media_1794475770716_167e3fd8.jpg');
  const autumnCrops = [
    { id: 'cozy_teddy_bear', left: 615, top: 720, width: 100, height: 145, name: 'Мишка Тедди' },
    { id: 'cozy_camera', left: 360, top: 885, width: 130, height: 90, name: 'Ретро-камера' },
    { id: 'cozy_books_stack', left: 510, top: 845, width: 140, height: 130, name: 'Стопка книг' },
    { id: 'cozy_tea_bag', left: 265, top: 730, width: 70, height: 95, name: 'Пакетик чая' },
    { id: 'cozy_pinecone', left: 515, top: 715, width: 90, height: 115, name: 'Шишка' }
  ];

  for (const a of autumnCrops) {
    await sharp(autumnImg)
      .extract({ left: a.left, top: a.top, width: a.width, height: a.height })
      .webp({ quality: 90 })
      .toFile(path.join(outDir, `${a.id}.webp`));
  }
  console.log('Extracted 5 cozy autumn stickers');

  // 5. Washi tape strips from autumn & sage sheets
  const washiStrips = [
    { file: autumnImg, id: 'washi_stripes', left: 18, top: 580, width: 236, height: 42, name: 'Скотч в полоску' },
    { file: autumnImg, id: 'washi_polka', left: 18, top: 680, width: 236, height: 42, name: 'Скотч в горошек' },
    { file: autumnImg, id: 'washi_hearts', left: 18, top: 780, width: 236, height: 40, name: 'Скотч с сердечками' }
  ];

  for (const w of washiStrips) {
    await sharp(w.file)
      .extract({ left: w.left, top: w.top, width: w.width, height: w.height })
      .webp({ quality: 90 })
      .toFile(path.join(outDir, `${w.id}.webp`));
  }
  console.log('Extracted washi tapes');

  console.log('ALL journal decor stickers successfully extracted!');
}

extractAll().catch(console.error);
