#!/usr/bin/env node
/**
 * 작품별 고화질 이미지를 로컬 보관함(기본 ~/Downloads/Fanatic-Museum/<slug>/)에 내려받습니다.
 * 위치는 FANATIC_MEDIA_DIR 환경 변수로 바꿀 수 있습니다.
 *
 * - 전체 용량 한도(기본 100GB)를 넘기지 않습니다.
 * - 작품을 돌아가며 한 페이지씩 받아서, 큰 작품이 용량을 독차지하지 않게 합니다.
 * - 일반 등급만 받고, 선정적 태그와 저해상도 이미지는 거릅니다.
 * - 이미지마다 출처를 manifest.jsonl에 남깁니다.
 * - 중간에 멈춰도 다시 실행하면 이어서 받습니다.
 *
 * 받은 이미지는 저작권자에게 권리가 있으므로 개인 보관용입니다. 저장소와 배포본에는 넣지 않습니다.
 *
 * 사용: node scripts/media/download.mjs [--limit-gb 100] [--only fate,saekano] [--dry-run]
 */
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile, appendFile, stat, rename, rm, link } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MEDIA = process.env.FANATIC_MEDIA_DIR ?? join(homedir(), 'Downloads', 'Fanatic-Museum');
const STATE_FILE = join(MEDIA, '.download-state.json');
const LOG_FILE = join(MEDIA, 'download.log');
const UA = 'FanaticMuseumArchiver/1.0 (personal archive)';

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const LIMIT_BYTES = Number(argValue('--limit-gb') ?? 100) * 1000 ** 3;
const ONLY = argValue('--only')?.split(',');
const DRY_RUN = args.includes('--dry-run');

const PAGE_SIZE = 40;
// 해상도·점수 하한 없이 되도록 모두 받습니다(점수 높은 순서로 받고, 전체 용량 한도로 멈춥니다).
const MIN_LONG_EDGE = 0;
const MIN_SCORE = 0;
const REQUEST_GAP_MS = 1100;
const FILE_CONCURRENCY = 4;
const BLOCKED_TAGS = new Set([
  'animated',
  'animated_gif',
  'loli',
  'shota',
  'nude',
  'naked',
  'nipples',
  'underwear',
  'panties',
  'pantsu',
  'pantyshot',
  'upskirt',
  'bra',
  'lingerie',
  'bikini',
  'swimsuit',
  'cleavage',
  'breasts',
  'large_breasts',
  'ass',
  'bondage',
  'bdsm',
  'blood',
  'guro',
  'violence',
  'see_through',
  'wet_clothes',
  'bathing',
  'onsen',
  'naked_towel',
  'cameltoe',
  'erect_nipples',
  'no_bra',
  'bottomless',
  'topless',
  'thong',
  'garter_belt',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
async function log(message) {
  const line = `[${now()}] ${message}`;
  console.log(line);
  await appendFile(LOG_FILE, line + '\n');
}

let lastRequest = 0;
async function politeFetch(url, init = {}) {
  const wait = lastRequest + REQUEST_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...init.headers } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(5000 * attempt);
    }
  }
}
/** 이미지 파일 요청. 목록 요청 간격과 별개로 재시도만 합니다. */
async function fetchFile(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(10 * 60 * 1000),
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(5000 * attempt);
    }
  }
}

async function getJson(url) {
  const res = await politeFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const text = await res.text();
  return text.trim() ? JSON.parse(text) : [];
}

/** 출처에 minLongEdge·minScore가 있으면 기본 기준 대신 씁니다(옛 스캔이 많은 작가 등). */
function isAcceptable({ width, height, tags, rating, score, official }, source = {}) {
  if (score !== undefined && score < (source.minScore ?? MIN_SCORE)) return false;
  if (rating && !['s', 'safe', 'general', 'g'].includes(rating)) return false;
  // 공식 스크린샷(Steam)·책 표지는 해상도 기준을 적용하지 않습니다.
  if (!official && Math.max(width, height) < (source.minLongEdge ?? MIN_LONG_EDGE)) return false;
  return !tags.some((t) => BLOCKED_TAGS.has(t));
}

/** 출처별로 한 페이지를 받아 공통 형식의 후보 목록으로 바꿉니다. 더 없으면 null. */
const adapters = {
  async yandere(source, page) {
    const q = encodeURIComponent(`${source.tags} rating:s order:score`);
    const posts = await getJson(
      `https://yande.re/post.json?tags=${q}&limit=${PAGE_SIZE}&page=${page}`,
    );
    if (!posts.length) return null;
    return posts.map((p) => ({
      key: `yandere-${p.id}`,
      fileUrl: p.file_url,
      ext: p.file_ext,
      size: p.file_size,
      width: p.width,
      height: p.height,
      rating: p.rating,
      score: p.score,
      tags: p.tags.split(' '),
      page: `https://yande.re/post/show/${p.id}`,
      origin: p.source || null,
      author: p.author || null,
    }));
  },
  async safebooru(source, page) {
    const q = encodeURIComponent(source.tags);
    const posts = await getJson(
      `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${q}&limit=${PAGE_SIZE}&pid=${page - 1}`,
    );
    if (!posts.length) return null;
    return posts.map((p) => ({
      key: `safebooru-${p.id}`,
      fileUrl: p.file_url,
      ext: p.image.split('.').pop(),
      size: null,
      width: p.width,
      height: p.height,
      rating: p.rating,
      tags: p.tags.trim().split(/\s+/),
      page: `https://safebooru.org/index.php?page=post&s=view&id=${p.id}`,
      origin: p.source || null,
      author: p.owner || null,
    }));
  },
  /**
   * 교보문고 검색 결과의 책 표지(원본 약 1000px 폭). 소설·만화 단행본에 씁니다.
   * source.match(정규식)에 맞는 제목만 받습니다.
   */
  async kyobo(source, page) {
    if (page > (source.pages ?? 3)) return null;
    const url = `https://search.kyobobook.co.kr/search?keyword=${encodeURIComponent(source.query)}&page=${page}`;
    const res = await politeFetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    const html = await res.text();
    const match = new RegExp(source.match);
    const seen = new Set();
    const items = [];
    for (const [, isbn, rawName] of html.matchAll(/(\d{13})" data-name="([^"]+)"/g)) {
      const name = rawName
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      if (seen.has(isbn) || !match.test(name)) continue;
      seen.add(isbn);
      items.push({
        key: `kyobo-${isbn}`,
        fileUrl: `https://contents.kyobobook.co.kr/pdt/${isbn}.jpg`,
        // 원본 경로가 막힌 책은 크기 조정 경로(원본보다 크게 늘리지 않는 1000px)로 받습니다.
        fallbackUrl: `https://contents.kyobobook.co.kr/sih/fit-in/1000x0/pdt/${isbn}.jpg`,
        ext: 'jpg',
        size: null,
        width: 1000,
        height: 1400,
        rating: null,
        official: true,
        tags: [],
        page: `https://search.kyobobook.co.kr/search?keyword=${isbn}`,
        origin: name,
        author: null,
      });
    }
    return items.length ? items : page === 1 ? [] : null;
  },
  /** Steam은 게임 하나를 한 페이지로 봅니다. 공식 스크린샷과 배경 이미지입니다. */
  async steam(source, page) {
    const appid = source.appids[page - 1];
    if (appid === undefined) return null;
    const json = await getJson(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&l=korean`,
    );
    const data = json?.[appid]?.data;
    if (!data) return [];
    const items = (data.screenshots ?? []).map((s) => ({
      key: `steam-${appid}-ss-${s.id}`,
      fileUrl: s.path_full.split('?')[0],
      ext: 'jpg',
      size: null,
      width: 1920,
      height: 1080,
      rating: null,
      official: true,
      tags: [],
      page: `https://store.steampowered.com/app/${appid}/`,
      origin: data.name,
      author: (data.publishers ?? []).join(', ') || null,
    }));
    if (data.background_raw) {
      items.push({
        key: `steam-${appid}-background`,
        fileUrl: data.background_raw.split('?')[0],
        ext: 'jpg',
        size: null,
        width: 1920,
        height: 1080,
        rating: null,
        official: true,
        tags: [],
        page: `https://store.steampowered.com/app/${appid}/`,
        origin: data.name,
        author: (data.publishers ?? []).join(', ') || null,
      });
    }
    return items;
  },
};

async function loadJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function readManifest(slug) {
  const text = await readFile(join(MEDIA, slug, 'manifest.jsonl'), 'utf8').catch(() => '');
  return text
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

async function download(item, slug) {
  const dir = join(MEDIA, slug);
  const file = `${item.key}.${item.ext}`;
  const target = join(dir, file);
  const partial = `${target}.part`;
  let res = await fetchFile(item.fileUrl);
  if (!res.ok && item.fallbackUrl) {
    await res.body?.cancel();
    res = await fetchFile(item.fallbackUrl);
  }
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) {
    await res.body.cancel();
    throw new Error(`이미지가 아님(${type})`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(partial));
  await rename(partial, target);
  const { size } = await stat(target);
  return { file, size };
}

async function main() {
  const { works, artists = {} } = await loadJson(join(ROOT, 'scripts', 'media', 'sources.json'), {
    works: {},
  });
  // 작품은 <slug>/, 작가 모음은 artists/<slug>/ 폴더에 받습니다.
  const groups = Object.fromEntries([
    ...Object.entries(works),
    ...Object.entries(artists).map(([slug, sources]) => [`artists/${slug}`, sources]),
  ]);
  await mkdir(MEDIA, { recursive: true });
  const state = await loadJson(STATE_FILE, { cursors: {}, done: {} });

  // 이미 받은 파일로 현재 사용량과 중복 키를 계산합니다.
  // 다른 폴더에 이미 있는 이미지는 다시 받지 않고 하드 링크로 연결합니다(용량을 쓰지 않습니다).
  let used = 0;
  const seen = new Map();
  const everywhere = new Map();
  for (const slug of Object.keys(groups)) {
    await mkdir(join(MEDIA, slug), { recursive: true });
    const entries = await readManifest(slug);
    seen.set(slug, new Set(entries.map((e) => e.key)));
    for (const e of entries) if (!e.linked) everywhere.set(e.key, { ...e, dir: slug });
    used += entries.reduce((sum, e) => sum + (e.linked ? 0 : e.bytes), 0);
  }
  await log(`시작: 사용 ${(used / 1e9).toFixed(2)}GB / 한도 ${(LIMIT_BYTES / 1e9).toFixed(0)}GB`);

  const queue = Object.entries(groups)
    .filter(([slug]) => !ONLY || ONLY.some((o) => slug === o || slug.startsWith(`${o}/`)))
    .flatMap(([slug, sources]) =>
      sources.map((source, i) => ({ slug, source, id: `${slug}#${i}` })),
    )
    .filter((s) => !state.done[s.id]);

  // 작품마다 한 번씩 돌아가며 한 페이지씩 받습니다.
  while (queue.length && used < LIMIT_BYTES) {
    const task = queue.shift();
    const page = (state.cursors[task.id] ?? 0) + 1;
    let items;
    try {
      items = await adapters[task.source.type](task.source, page);
    } catch (error) {
      await log(`${task.id} ${page}쪽 목록 실패: ${error.message}. 다음 차례에 다시 시도합니다.`);
      queue.push(task);
      continue;
    }
    if (items === null) {
      state.done[task.id] = true;
      await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
      await log(`${task.id} 출처를 모두 받았습니다.`);
      continue;
    }

    let added = 0;
    const keys = seen.get(task.slug);
    const pending = items.filter(
      (item) => !keys.has(item.key) && item.fileUrl && isAcceptable(item, task.source),
    );
    // 파일은 CDN에서 FILE_CONCURRENCY개씩 동시에 받습니다. 목록 요청은 politeFetch 간격을 지킵니다.
    const worker = async () => {
      while (pending.length && used < LIMIT_BYTES) {
        const item = pending.shift();
        if (item.size && used + item.size > LIMIT_BYTES) continue;
        keys.add(item.key);
        if (DRY_RUN) {
          added++;
          continue;
        }
        const existing = everywhere.get(item.key);
        if (existing) {
          try {
            await link(
              join(MEDIA, existing.dir, existing.file),
              join(MEDIA, task.slug, existing.file),
            );
            added++;
            const entry = { ...existing, dir: undefined, linked: true, linkedFrom: existing.dir };
            await appendFile(
              join(MEDIA, task.slug, 'manifest.jsonl'),
              JSON.stringify(entry) + '\n',
            );
            continue;
          } catch (error) {
            if (error.code !== 'EEXIST')
              await log(`${task.slug} ${item.key} 링크 실패: ${error.message}`);
          }
        }
        try {
          const { file, size } = await download(item, task.slug);
          used += size;
          added++;
          const entry = {
            key: item.key,
            file,
            bytes: size,
            width: item.width,
            height: item.height,
            page: item.page,
            origin: item.origin,
            author: item.author,
            tags: item.tags.slice(0, 40),
            downloadedAt: now(),
          };
          await appendFile(join(MEDIA, task.slug, 'manifest.jsonl'), JSON.stringify(entry) + '\n');
          everywhere.set(item.key, { ...entry, dir: task.slug });
        } catch (error) {
          keys.delete(item.key);
          await rm(join(MEDIA, task.slug, `${item.key}.${item.ext}.part`), { force: true });
          await log(`${task.slug} ${item.key} 실패: ${error.message}`);
        }
      }
    };
    await Promise.all(Array.from({ length: FILE_CONCURRENCY }, worker));
    state.cursors[task.id] = page;
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
    await log(`${task.id} ${page}쪽: ${added}장 추가, 누적 ${(used / 1e9).toFixed(2)}GB`);
    queue.push(task);
  }

  await log(used >= LIMIT_BYTES ? '용량 한도에 도달해 멈췄습니다.' : '모든 출처를 받았습니다.');
}

main().catch(async (error) => {
  await log(`중단: ${error.stack ?? error}`);
  process.exit(1);
});
