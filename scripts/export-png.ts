// saas/scripts/export-png.ts
// Génère 8 tailles PNG depuis chaque SVG dans public/brand/.
// 4 variantes (teal/white/mono-black/mono-white) × 8 tailles = 32 PNG par défaut.
//
// Lancement : `cd saas && npx tsx scripts/export-png.ts`

import sharp from "sharp";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRAND_DIR  = path.resolve(__dirname, "../public/brand");
const OUT_DIR    = path.resolve(__dirname, "../public/brand/png");

const SIZES = [16, 32, 48, 180, 192, 256, 512, 1024] as const;

async function exportOneSvg(svgPath: string) {
  const baseName = path.basename(svgPath, ".svg");
  const svg = await readFile(svgPath);

  for (const size of SIZES) {
    const outPath = path.join(OUT_DIR, `${baseName}-${size}.png`);
    const buffer = await sharp(svg, { density: 384 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
    await writeFile(outPath, buffer);
    console.log(`  ✓ ${baseName}-${size}.png  (${(buffer.length / 1024).toFixed(1)} KB)`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(BRAND_DIR))
    .filter(f => f.endsWith(".svg"))
    .map(f => path.join(BRAND_DIR, f));

  if (files.length === 0) {
    console.error("✗ Aucun .svg trouvé dans public/brand/");
    process.exit(1);
  }

  console.log(`▶ Export PNG depuis ${files.length} SVG sources × ${SIZES.length} tailles = ${files.length * SIZES.length} PNG\n`);

  for (const svg of files) {
    console.log(`📐 ${path.basename(svg)}`);
    await exportOneSvg(svg);
  }

  console.log(`\n✅ Sortie : ${OUT_DIR}`);
  console.log("   À utiliser pour : favicons, App Store, Play Store, OG images statiques.");
}

main().catch(e => { console.error(e); process.exit(1); });
