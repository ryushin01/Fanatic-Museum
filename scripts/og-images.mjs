#!/usr/bin/env node
/**
 * 공유 미리보기 이미지(Open Graph, 1200×630)를 public/og/에 만듭니다.
 * - site.png: 홈 첫 화면과 같은 구성(사이트 대표)
 * - works/<slug>.png: 공개 사이트의 자리 표시 그래픽과 같은 모양(대표색·번호·제목)
 * 사이트와 같은 글꼴·색으로 그린 HTML을 Chromium(Playwright)으로 찍고 sharp로 줄입니다.
 * 저작권 이미지는 쓰지 않습니다(작품 이미지 대신 글자와 대표색만 씀).
 *
 * 사용: pnpm og:build  (소장품을 더하거나 제목·대표색이 바뀌면 다시 만들어 커밋합니다)
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';
import sharp from 'sharp';

import { categories } from '../src/entities/category/model/categories.ts';
import { works } from '../src/entities/work/model/works.ts';
import { padNumber } from '../src/shared/lib/format.ts';
import { isLightColor } from '../src/shared/lib/color.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'og');
const file = (...parts) => pathToFileURL(join(ROOT, ...parts)).href;

const FONTS = `
@font-face { font-family: 'Archivo Variable'; font-weight: 100 900; font-stretch: 62% 125%;
  src: url('${file('node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'MedievalSharp'; font-weight: 400;
  src: url('${file('node_modules/@fontsource/medievalsharp/files/medievalsharp-latin-400-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Museum Classic'; font-weight: 500;
  src: url('${file('src/app/fonts/museum-classic/MuseumClassic-M.woff')}') format('woff'); }
@font-face { font-family: 'Museum Classic'; font-weight: 700;
  src: url('${file('src/app/fonts/museum-classic/MuseumClassic-B.woff')}') format('woff'); }
`;

const BASE = `
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; }
body { font-family: 'Archivo Variable', 'Museum Classic', sans-serif; font-stretch: 75%;
  -webkit-font-smoothing: antialiased; word-break: keep-all; }
.label { font-size: 20px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
`;

/** 홈 첫 화면과 같은 구성: 머리글 표지, 큰 영문 제목(MedievalSharp), 붉은 한글 부제 */
function siteTemplate() {
  const since = Math.min(...works.flatMap((w) => (w.firstReleased ? [w.firstReleased] : [])));
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${FONTS}${BASE}
body { display: grid; grid-template-rows: auto 1fr; padding: 64px 80px 72px; background: #f1efe9; color: #121212; }
.top { display: flex; justify-content: space-between; align-items: center; color: #55524b; }
.brand { display: flex; align-items: center; gap: 16px; }
.brand img { width: 52px; height: 52px; }
.title { align-self: end; font-weight: 900; line-height: 0.92; letter-spacing: -0.055em; }
.latin { display: block; font-family: 'MedievalSharp', serif; font-weight: 400; font-size: 156px;
  letter-spacing: -0.01em; font-synthesis: none; }
.accent { color: #b5121b; }
.ko { display: block; margin-top: 18px; font-size: 80px; }
</style></head><body>
<div class="top"><span class="brand"><img src="${file('public/brand/logo.svg')}" alt=""><span class="label">Fanatic Museum</span></span>
<span class="label">${since} — Now</span></div>
<h1 class="title"><span class="latin">Fanatic</span><span class="latin">Museum<span class="accent">.</span></span>
<span class="ko accent">서브컬처 대장정</span></h1>
</body></html>`;
}

const escape = (text) =>
  String(text).replace(
    /[&<>"]/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch],
  );

/** 자리 표시 그래픽(entities/work WorkCover)과 같은 배경: 대표색 위 빗금과 오른쪽 위 빛 */
function workTemplate(work) {
  const color = isLightColor(work.accent) ? '#121212' : '#ffffff';
  const kinds = work.categories.map(
    (slug) => categories.find((c) => c.slug === slug)?.name ?? slug,
  );
  const meta = [kinds.join(' / '), work.origin, work.firstReleased && `${work.firstReleased}년`]
    .filter(Boolean)
    .join(' · ');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${FONTS}${BASE}
body { display: grid; grid-template-rows: auto 1fr auto; padding: 56px 72px 64px; color: ${color};
  background: repeating-linear-gradient(-45deg, rgb(255 255 255 / 6%) 0 2px, transparent 2px 14px),
    radial-gradient(120% 90% at 85% 10%, rgb(255 255 255 / 22%), transparent 60%), ${work.accent}; }
.top { opacity: 0.85; }
.number { font-size: 230px; font-weight: 800; line-height: 0.9; letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums; margin-top: 12px; }
.title { font-size: 68px; font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; max-width: 1000px; }
.meta { margin-top: 16px; font-size: 26px; font-weight: 600; opacity: 0.85; }
</style></head><body>
<div class="top"><span class="label">Fanatic Museum</span></div>
<div class="number">${padNumber(work.number)}</div>
<div><h1 class="title">${escape(work.title)}</h1><p class="meta">${escape(meta)}</p></div>
</body></html>`;
}

async function render(browser, html, out) {
  const dir = await mkdtemp(join(tmpdir(), 'fm-og-'));
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    const htmlFile = join(dir, 'og.html');
    await writeFile(htmlFile, html);
    await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
    // 쓰는 글꼴을 모두 받은 뒤 찍습니다. 하나라도 받지 못하면 운영체제 글꼴로 찍히므로 멈춥니다.
    const failed = await page.evaluate(async () => {
      const wanted = [
        '700 80px "Archivo Variable"',
        '400 80px "MedievalSharp"',
        '500 80px "Museum Classic"',
        '700 80px "Museum Classic"',
      ];
      const loaded = await Promise.all(wanted.map((font) => document.fonts.load(font, 'A가')));
      return wanted.filter((_, i) => loaded[i].length === 0);
    });
    if (failed.length) throw new Error(`글꼴을 받지 못했습니다: ${failed.join(', ')}`);
    const png = await page.screenshot({ type: 'png' });
    await page.close();
    await mkdir(dirname(out), { recursive: true });
    await sharp(png).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(out);
    console.log(out.replace(`${ROOT}/`, ''));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const browser = await chromium.launch();
try {
  await render(browser, siteTemplate(), join(OUT, 'site.png'));
  for (const work of works)
    await render(browser, workTemplate(work), join(OUT, 'works', `${work.slug}.png`));
} finally {
  await browser.close();
}
