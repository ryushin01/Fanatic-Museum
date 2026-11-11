#!/usr/bin/env node
/**
 * 로컬 보관함(기본 ~/Downloads/Fanatic-Museum/<slug>/)의 원본에서 작품마다 이미지를 골라
 * 화면용 WebP 변환본(public/media/<slug>/)과 목록(public/media/index.json)을 만듭니다.
 *
 * - 원본 순서(출처의 점수순)를 따르되, 한 출처에 쏠리지 않게 출처를 번갈아 고릅니다.
 * - 너비 640·1280·2048 세 가지를 만들고, 원본보다 크게 늘리지 않습니다.
 * - 이미 만든 변환본은 건너뜁니다.
 *
 * 사용: node scripts/media/build-variants.mjs [--per-work 24]
 */
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGINALS = process.env.FANATIC_MEDIA_DIR ?? join(homedir(), 'Downloads', 'Fanatic-Museum');
const OUT = join(ROOT, 'public', 'media');
const WIDTHS = [640, 1280, 2048];

const args = process.argv.slice(2);
const perWorkIndex = args.indexOf('--per-work');
const PER_WORK = perWorkIndex >= 0 ? Number(args[perWorkIndex + 1]) : 24;

const exists = (path) => stat(path).then(() => true, () => false);

function sourceOf(key) {
  return key.split('-')[0];
}

/** 출처(yandere, safebooru, steam)를 번갈아 가며 고릅니다. */
function interleave(entries, limit) {
  const groups = new Map();
  for (const entry of entries) {
    const source = sourceOf(entry.key);
    if (!groups.has(source)) groups.set(source, []);
    groups.get(source).push(entry);
  }
  const picked = [];
  while (picked.length < limit && [...groups.values()].some((g) => g.length)) {
    for (const group of groups.values()) {
      const next = group.shift();
      if (next) picked.push(next);
      if (picked.length >= limit) break;
    }
  }
  return picked;
}

async function readManifest(slug) {
  const text = await readFile(join(ORIGINALS, slug, 'manifest.jsonl'), 'utf8').catch(() => '');
  return text.split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

async function main() {
  const slugs = (await readdir(ORIGINALS, { withFileTypes: true }).catch(() => []))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const index = {};

  for (const slug of slugs) {
    const entries = (await readManifest(slug)).filter((e) => !e.file.endsWith('.gif'));
    const picked = interleave(entries, PER_WORK);
    const images = [];
    await mkdir(join(OUT, slug), { recursive: true });

    for (const entry of picked) {
      try {
        const input = join(ORIGINALS, slug, entry.file);
        const meta = await sharp(input).metadata();
        const widths = WIDTHS.filter((w) => w <= meta.width);
        if (!widths.length) widths.push(meta.width);
        const variants = [];
        for (const width of widths) {
          const name = `${entry.key}-${width}.webp`;
          const target = join(OUT, slug, name);
          if (!(await exists(target))) {
            await sharp(input).rotate().resize({ width }).webp({ quality: 80 }).toFile(target);
          }
          variants.push({ width, src: `/media/${slug}/${name}` });
        }
        const largest = variants.at(-1);
        images.push({
          key: entry.key,
          kind: { steam: 'screenshot', kyobo: 'cover' }[sourceOf(entry.key)] ?? 'illustration',
          src: largest.src,
          srcSet: variants.map((v) => `${v.src} ${v.width}w`).join(', '),
          width: largest.width,
          height: Math.round((meta.height / meta.width) * largest.width),
          sourcePage: entry.page ?? null,
          origin: entry.origin ?? null,
        });
      } catch (error) {
        console.warn(`${slug}/${entry.file} 변환 실패: ${error.message}`);
      }
    }
    index[slug] = images;
    console.log(`${slug}: ${images.length}장`);
  }

  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'index.json'), JSON.stringify(index, null, 2));
}

main();
