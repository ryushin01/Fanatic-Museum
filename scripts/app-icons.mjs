#!/usr/bin/env node
/**
 * 웹 앱 매니페스트 아이콘(192·512px, 마스크용 512px)을 박물관 로고(public/brand/logo.svg)로 만듭니다.
 * 애플 아이콘(apple-touch-icon.png)과 같은 사이트 바탕색(#f1efe9) 위에 로고를 가운데 둡니다.
 *
 * 사용: node scripts/app-icons.mjs  (로고가 바뀌면 다시 만들어 커밋합니다)
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'icons');
const BACKGROUND = '#f1efe9';
const logo = await readFile(join(ROOT, 'public', 'brand', 'logo.svg'));

/** ratio: 아이콘 한 변에서 로고가 차지하는 비율. 마스크용은 잘려도 되는 가장자리를 비워 둡니다. */
const icons = [
  { file: 'icon-192.png', size: 192, ratio: 0.72 },
  { file: 'icon-512.png', size: 512, ratio: 0.72 },
  { file: 'icon-maskable-512.png', size: 512, ratio: 0.56 },
];

await mkdir(OUT, { recursive: true });
for (const { file, size, ratio } of icons) {
  const mark = await sharp(logo, { density: 1200 })
    .resize(Math.round(size * ratio))
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: BACKGROUND } })
    .composite([{ input: mark, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, file));
  console.log(`public/icons/${file}`);
}
