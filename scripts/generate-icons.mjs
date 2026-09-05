import sharp from 'sharp';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconPath = join(root, 'src-tauri', 'icon-source.svg');
const svg = readFileSync(
  existsSync(iconPath) ? iconPath : join(root, 'public', 'favicon.svg'),
);

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(join(root, 'public', `pwa-${size}.png`));
  console.log(`Generated pwa-${size}.png`);
}
