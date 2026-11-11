const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.resolve('public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

async function generateIcons() {
  // Use cat_cozy_01 or cat_art_01 as base icon
  const sourceWebp = path.resolve('public/stickers/cat_cozy_01.webp');
  const sourcePng = path.resolve('public/stickers/cat_cozy_01.png');
  const source = fs.existsSync(sourceWebp) ? sourceWebp : sourcePng;
  
  // Background circle or rounded rect with milk/cream pastel background (#FAF5EB)
  const bg512 = Buffer.from(
    `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="110" fill="#FAF5EB"/>
      <circle cx="256" cy="256" r="210" fill="#F4EBDD" stroke="#D9CDEB" stroke-width="8"/>
    </svg>`
  );

  const catBuffer = await sharp(source)
    .resize(340, 340, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const icon512 = await sharp(bg512)
    .composite([{ input: catBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));

  await sharp(path.join(iconsDir, 'icon-512x512.png'))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));

  await sharp(path.join(iconsDir, 'icon-512x512.png'))
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));

  await sharp(path.join(iconsDir, 'icon-192x192.png'))
    .resize(48, 48)
    .png()
    .toFile(path.resolve('public/favicon.ico'));

  console.log('Successfully generated PWA icons!');
}

generateIcons().catch(console.error);

