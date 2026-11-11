const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertStickers() {
  const stickersDir = path.resolve('public/stickers');
  const files = fs.readdirSync(stickersDir).filter(f => f.endsWith('.png'));

  console.log(`Found ${files.length} PNG stickers to convert.`);

  let totalPngSize = 0;
  let totalWebpSize = 0;

  for (const file of files) {
    const pngPath = path.join(stickersDir, file);
    const webpName = file.replace(/\.png$/, '.webp');
    const webpPath = path.join(stickersDir, webpName);

    const pngStat = fs.statSync(pngPath);
    totalPngSize += pngStat.size;

    await sharp(pngPath)
      .webp({
        quality: 85,
        alphaQuality: 100,
        effort: 6
      })
      .toFile(webpPath);

    const webpStat = fs.statSync(webpPath);
    totalWebpSize += webpStat.size;

    // Remove original png
    fs.unlinkSync(pngPath);
  }

  console.log(`Converted ${files.length} stickers.`);
  console.log(`Original PNG size: ${(totalPngSize / (1024 * 1024)).toFixed(2)} MB (${totalPngSize} bytes)`);
  console.log(`Optimized WebP size: ${(totalWebpSize / (1024 * 1024)).toFixed(2)} MB (${totalWebpSize} bytes)`);
  const savings = ((1 - totalWebpSize / totalPngSize) * 100).toFixed(1);
  console.log(`Space savings: ${savings}%`);

  // Update manifest.json
  const manifestJsonPath = path.join(stickersDir, 'manifest.json');
  if (fs.existsSync(manifestJsonPath)) {
    const raw = fs.readFileSync(manifestJsonPath, 'utf8');
    const updated = raw.replace(/\.png/g, '.webp');
    fs.writeFileSync(manifestJsonPath, updated, 'utf8');
    console.log('Updated public/stickers/manifest.json');
  }

  // Update src/data/stickersManifest.ts
  const tsManifestPath = path.resolve('src/data/stickersManifest.ts');
  if (fs.existsSync(tsManifestPath)) {
    const raw = fs.readFileSync(tsManifestPath, 'utf8');
    const updated = raw.replace(/\.png/g, '.webp');
    fs.writeFileSync(tsManifestPath, updated, 'utf8');
    console.log('Updated src/data/stickersManifest.ts');
  }
}

convertStickers().catch(err => {
  console.error('Error during conversion:', err);
  process.exit(1);
});
