import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public', 'favicon.svg');
const outDir = path.join(root, 'resources');
const outPath = path.join(outDir, 'icon.png');

await mkdir(outDir, { recursive: true });
await sharp(svgPath).resize(1024, 1024).png().toFile(outPath);
console.log(`Wrote ${outPath}`);
