// saas/scripts/generate-icons.mjs
// Convertit les SVG sources de public/icons/ en PNG aux tailles requises.
// Lancement : `cd saas && node scripts/generate-icons.mjs`

import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, "../public");
const ICONS  = path.join(PUBLIC, "icons");

const TARGETS = [
  // PWA — manifest.webmanifest
  { src: "icon.svg",          out: "icons/icon-192.png",            size: 192 },
  { src: "icon.svg",          out: "icons/icon-512.png",            size: 512 },
  { src: "icon-maskable.svg", out: "icons/icon-maskable-192.png",   size: 192 },
  { src: "icon-maskable.svg", out: "icons/icon-maskable-512.png",   size: 512 },
  // Apple touch + meta
  { src: "icon.svg",          out: "apple-touch-icon.png",          size: 180 },
  // Splash screens iOS (les principaux)
  { src: "splash.svg",        out: "icons/splash-2048x2732.png",    width: 2048, height: 2732 },
  { src: "splash.svg",        out: "icons/splash-1668x2224.png",    width: 1668, height: 2224 },
  { src: "splash.svg",        out: "icons/splash-1284x2778.png",    width: 1284, height: 2778 }, // iPhone 14 Pro Max
  // Open Graph
  { src: "og-image.svg",      out: "og-image.png",                  width: 1200, height: 630 },
  // Favicon ICO via sharp = PNG 32×32 + 16×16 (manuel ou ImageMagick pour ICO)
  { src: "favicon.svg",       out: "favicon-16.png",                size: 16 },
  { src: "favicon.svg",       out: "favicon-32.png",                size: 32 },
];

const SCREENSHOTS = [
  // Manifest screenshots (placeholders, à remplacer par captures réelles)
  { src: "og-image.svg",      out: "screenshots/dashboard-1280.png", width: 1280, height: 720 },
  { src: "og-image.svg",      out: "screenshots/mobile-720.png",     width: 375,  height: 812 },
];

async function convert(target) {
  const srcPath = path.join(ICONS, target.src);
  const outPath = path.join(PUBLIC, target.out);
  await mkdir(path.dirname(outPath), { recursive: true });

  const svg = await readFile(srcPath);
  const sharpInstance = sharp(svg, { density: 384 });

  const w = target.width  ?? target.size;
  const h = target.height ?? target.size;
  const buffer = await sharpInstance
    .resize(w, h, { fit: "contain", background: { r: 17, g: 94, b: 89, alpha: 1 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await writeFile(outPath, buffer);
  console.log(`✓ ${target.out.padEnd(40)} ${w}×${h}  ${(buffer.length / 1024).toFixed(1)} KB`);
}

async function main() {
  console.log("Generating PWA icons + splash + OG image…\n");
  for (const t of [...TARGETS, ...SCREENSHOTS]) {
    try { await convert(t); }
    catch (e) { console.error(`✗ ${t.out}`, e.message); }
  }
  console.log("\n✅ Done. N'oubliez pas de générer favicon.ico via :");
  console.log("   convert public/favicon-16.png public/favicon-32.png public/favicon.ico");
  console.log("   (ImageMagick) — ou utilisez https://realfavicongenerator.net");
}

main().catch(e => { console.error(e); process.exit(1); });
