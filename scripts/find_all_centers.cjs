const sharp = require('sharp');
const imgPath = 'C:/Users/j4yz11/.gemini/antigravity/brain/75440578-aac1-4c83-bb5d-6d1fe427e07d/.user_uploaded/media_1794496626048_c0b6f5e5.jpg';

async function main() {
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  function getPixel(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return [255, 255, 255];
    const idx = (y * width + x) * channels;
    return [data[idx], data[idx+1], data[idx+2]];
  }

  function circleScore(cx, cy, r) {
    let darkCount = 0;
    const steps = 72;
    for (let i = 0; i < steps; i++) {
      const angle = (i * 2 * Math.PI) / steps;
      const px = Math.round(cx + r * Math.cos(angle));
      const py = Math.round(cy + r * Math.sin(angle));
      const [cr, cg, cb] = getPixel(px, py);
      const lum = (cr + cg + cb) / 3;
      if (lum < 150) darkCount++;
    }
    return darkCount / steps;
  }

  function findBestCircle(candX, candY, minR = 90, maxR = 100) {
    let best = { cx: 0, cy: 0, r: 0, score: -1 };
    for (let cx = candX - 15; cx <= candX + 15; cx += 2) {
      for (let cy = candY - 15; cy <= candY + 15; cy += 2) {
        for (let r = minR; r <= maxR; r += 1) {
          const score = circleScore(cx, cy, r);
          if (score > best.score) {
            best = { cx, cy, r, score };
          }
        }
      }
    }
    return best;
  }

  console.log('--- Row 0 (4 items) ---');
  // Row 0 approx: cy = 135, cx = 145, 390, 635, 875
  const r0_x = [145, 390, 635, 875];
  const r0 = r0_x.map(x => findBestCircle(x, 140, 92, 102));
  console.log('Row 0:', r0);

  console.log('--- Row 1 (4 items) ---');
  // Row 1 approx: cy = 370
  const r1_x = [145, 390, 635, 875];
  const r1 = r1_x.map(x => findBestCircle(x, 370, 92, 102));
  console.log('Row 1:', r1);

  console.log('--- Row 2 (4 items) ---');
  // Row 2 approx: cy = 600
  const r2_x = [145, 390, 635, 875];
  const r2 = r2_x.map(x => findBestCircle(x, 600, 92, 102));
  console.log('Row 2:', r2);

  console.log('--- Row 3 (5 items) ---');
  // Row 3 approx: cy = 825, cx = 125, 320, 515, 710, 905
  const r3_x = [125, 320, 515, 710, 905];
  const r3 = r3_x.map(x => findBestCircle(x, 825, 90, 100));
  console.log('Row 3:', r3);
}

main().catch(console.error);
