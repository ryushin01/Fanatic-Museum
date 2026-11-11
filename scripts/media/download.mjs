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
import { createReadStream, createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, appendFile, stat, rename, rm, link } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable, Transform } from 'node:stream';
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
      if (res.status === 429 || res.status >= 500) {
        await res.body?.cancel();
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(5000 * attempt);
    }
  }
}
/** 이미지 파일 요청. 목록 요청 간격과 별개로 재시도만 합니다. */
async function fetchFile(url, extraHeaders = {}) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    // 응답 머리가 2분 안에 오지 않으면 다시 시도합니다. 머리를 받으면 시간 제한을 풀고,
    // 본문은 download()에서 멈춤(60초 무응답)만 검사합니다.
    const headers = new AbortController();
    const timer = setTimeout(() => headers.abort(new Error('2분 동안 응답 없음')), 2 * 60 * 1000);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, ...extraHeaders },
        signal: headers.signal,
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        await res.body?.cancel();
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (error) {
      clearTimeout(timer);
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

/** Moebooru 게시판(yande.re, Konachan) 한 페이지. 점수 높은 순서, 일반 등급만. */
function moebooru(base, prefix) {
  return async (source, page) => {
    const q = encodeURIComponent(`${source.tags} rating:s order:score`);
    const posts = await getJson(`${base}/post.json?tags=${q}&limit=${PAGE_SIZE}&page=${page}`);
    if (!posts.length) return null;
    return posts.map((p) => ({
      key: `${prefix}-${p.id}`,
      fileUrl: p.file_url?.startsWith('//') ? `https:${p.file_url}` : p.file_url,
      ext: p.file_ext ?? p.file_url?.split('.').pop(),
      size: p.file_size,
      md5: p.md5,
      width: p.width,
      height: p.height,
      rating: p.rating,
      score: p.score,
      tags: p.tags.split(' '),
      page: `${base}/post/show/${p.id}`,
      origin: p.source || null,
      author: p.author || null,
    }));
  };
}

/** 출처별로 한 페이지를 받아 공통 형식의 후보 목록으로 바꿉니다. 더 없으면 null. */
const adapters = {
  yandere: moebooru('https://yande.re', 'yandere'),
  // Konachan의 전체 이용가 판. yande.re와 같은 Moebooru 방식이며 배경화면용 고해상도가 많습니다.
  konachan: moebooru('https://konachan.net', 'konachan'),
  async safebooru(source, page) {
    const q = encodeURIComponent(source.tags);
    const posts = await getJson(
      `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${q}&limit=${PAGE_SIZE}&pid=${page - 1}`,
    );
    if (!posts.length) return null;
    return posts.map((p) => ({
      key: `safebooru-${p.id}`,
      md5: p.hash,
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
  /**
   * 네이버 웹툰: 1쪽에서 작품 포스터, 그 뒤로 회차 목록 쪽마다 회차 대표 이미지(썸네일)를 받습니다.
   * 회차 본문 원고는 받지 않습니다.
   */
  async naver(source, page) {
    const base = 'https://comic.naver.com/api/article';
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    const items = [];
    const common = {
      ext: 'jpg',
      size: null,
      width: 0,
      height: 0,
      rating: null,
      official: true,
      tags: [],
      author: null,
      // 네이버 이미지 서버는 웹툰 페이지에서 온 요청만 허용합니다.
      headers: { Referer: 'https://comic.naver.com/' },
    };
    if (page === 1) {
      const res = await politeFetch(`${base}/list/info?titleId=${source.titleId}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const info = await res.json();
      const urls = new Set(
        [info.sharedThumbnailUrl, info.posterThumbnailUrl, info.thumbnailUrl].filter(Boolean),
      );
      [...urls].forEach((url, i) =>
        items.push({
          ...common,
          key: `naver-${source.titleId}-title-${i}`,
          fileUrl: url,
          page: `https://comic.naver.com/webtoon/list?titleId=${source.titleId}`,
          origin: info.titleName,
        }),
      );
    }
    const res = await politeFetch(`${base}/list?titleId=${source.titleId}&page=${page}`, {
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    if (page > (list.pageInfo?.totalPages ?? 0) && !items.length) return null;
    for (const article of list.articleList ?? []) {
      if (!article.thumbnailUrl) continue;
      items.push({
        ...common,
        key: `naver-${source.titleId}-ep${article.no}`,
        fileUrl: article.thumbnailUrl,
        page: `https://comic.naver.com/webtoon/detail?titleId=${source.titleId}&no=${article.no}`,
        origin: article.subtitle ?? null,
      });
    }
    return items.length ? items : null;
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
  let res = await fetchFile(item.fileUrl, item.headers);
  if (!res.ok && item.fallbackUrl) {
    await res.body?.cancel();
    res = await fetchFile(item.fallbackUrl, item.headers);
  }
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) {
    await res.body.cancel();
    throw new Error(`이미지가 아님(${type})`);
  }
  // 큰 스캔(100MB 넘음)도 끝까지 받도록 전체 시간 제한은 두지 않고,
  // 60초 동안 데이터가 하나도 오지 않을 때만 멈춘 연결로 보고 중단합니다.
  const stall = new AbortController();
  let timer = setTimeout(() => stall.abort(new Error('60초 동안 응답 없음')), 60_000);
  const watchdog = new Transform({
    transform(chunk, _encoding, callback) {
      clearTimeout(timer);
      timer = setTimeout(() => stall.abort(new Error('60초 동안 응답 없음')), 60_000);
      callback(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(res.body), watchdog, createWriteStream(partial), {
      signal: stall.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  await rename(partial, target);
  const { size } = await stat(target);
  return { file, size };
}

async function fileMd5(path) {
  const hash = createHash('md5');
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

/** 받은 파일의 MD5 목록. 기록에 없으면 계산해 .md5-cache.json에 저장합니다(처음 한 번만 오래 걸립니다). */
async function buildMd5Index(everywhere) {
  const cacheFile = join(MEDIA, '.md5-cache.json');
  const cache = await loadJson(cacheFile, {});
  const index = new Map();
  let computed = 0;
  for (const entry of everywhere.values()) {
    const path = join(MEDIA, entry.dir, entry.file);
    const cacheKey = `${entry.dir}/${entry.file}:${entry.bytes}`;
    let md5 = entry.md5 ?? cache[cacheKey];
    if (!md5) {
      try {
        md5 = await fileMd5(path);
        cache[cacheKey] = md5;
        computed++;
      } catch {
        continue;
      }
    }
    if (!index.has(md5)) index.set(md5, entry);
  }
  if (computed) {
    await writeFile(cacheFile, JSON.stringify(cache));
    await log(`기존 파일 ${computed}개의 MD5를 계산했습니다.`);
  }
  return index;
}

async function main() {
  const {
    works,
    artists = {},
    collections = {},
  } = await loadJson(join(ROOT, 'scripts', 'media', 'sources.json'), { works: {} });
  // 작품은 <slug>/, 작가 모음은 artists/<slug>/, 회사·시리즈 모음은 collections/<slug>/ 폴더에 받습니다.
  const groups = Object.fromEntries([
    ...Object.entries(works),
    ...Object.entries(artists).map(([slug, sources]) => [`artists/${slug}`, sources]),
    ...Object.entries(collections).map(([slug, sources]) => [`collections/${slug}`, sources]),
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
  // 다른 사이트에 올라온 같은 그림(MD5가 같은 파일)도 하드 링크로 연결합니다.
  const md5Index = await buildMd5Index(everywhere);
  await log(`시작: 사용 ${(used / 1e9).toFixed(2)}GB / 한도 ${(LIMIT_BYTES / 1e9).toFixed(0)}GB`);

  const queue = Object.entries(groups)
    .filter(([slug]) => !ONLY || ONLY.some((o) => slug === o || slug.startsWith(`${o}/`)))
    .flatMap(([slug, sources]) =>
      sources.map((source, i) => ({ slug, source, id: `${slug}#${i}` })),
    )
    .filter((s) => !state.done[s.id]);

  let reserved = 0;
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
      if (!DRY_RUN) await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
      await log(`${task.id} 출처를 모두 받았습니다.`);
      continue;
    }

    let added = 0;
    const keys = seen.get(task.slug);
    const pending = items.filter(
      (item) => !keys.has(item.key) && item.fileUrl && isAcceptable(item, task.source),
    );
    // 파일은 CDN에서 FILE_CONCURRENCY개씩 동시에 받습니다. 목록 요청은 politeFetch 간격을 지킵니다.
    // 동시에 받는 파일의 크기를 미리 예약해 한도를 넘지 않게 하고,
    // 한도 때문에 받지 못한 후보가 있으면 다음 페이지로 넘어가지 않습니다.
    let leftover = false;
    const worker = async () => {
      while (pending.length) {
        if (used + reserved >= LIMIT_BYTES) {
          leftover = true;
          return;
        }
        const item = pending.shift();
        keys.add(item.key);
        if (DRY_RUN) {
          added++;
          continue;
        }
        const existing =
          everywhere.get(item.key) ?? (item.md5 ? md5Index.get(item.md5) : undefined);
        if (existing) {
          try {
            await link(
              join(MEDIA, existing.dir, existing.file),
              join(MEDIA, task.slug, existing.file),
            );
            added++;
            const entry = {
              ...existing,
              key: item.key,
              page: item.page,
              dir: undefined,
              linked: true,
              linkedFrom: existing.dir,
            };
            await appendFile(
              join(MEDIA, task.slug, 'manifest.jsonl'),
              JSON.stringify(entry) + '\n',
            );
            continue;
          } catch (error) {
            // 같은 폴더에 이미 같은 파일이 있으면 중복이므로 건너뜁니다.
            if (error.code === 'EEXIST') continue;
            await log(`${task.slug} ${item.key} 링크 실패: ${error.message}`);
          }
        }
        // 하드 링크는 용량을 쓰지 않으므로, 용량 검사는 실제로 받을 때만 합니다.
        if (item.size && used + reserved + item.size > LIMIT_BYTES) {
          keys.delete(item.key);
          leftover = true;
          continue;
        }
        const reservation = item.size ?? 0;
        reserved += reservation;
        let released = false;
        try {
          const { file, size } = await download(item, task.slug);
          reserved -= reservation;
          released = true;
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
            // 출처가 MD5를 주지 않으면(Steam·교보문고) 받은 파일로 계산합니다.
            md5: item.md5 ?? (await fileMd5(join(MEDIA, task.slug, file))),
            tags: item.tags.slice(0, 40),
            downloadedAt: now(),
          };
          await appendFile(join(MEDIA, task.slug, 'manifest.jsonl'), JSON.stringify(entry) + '\n');
          everywhere.set(item.key, { ...entry, dir: task.slug });
          if (entry.md5 && !md5Index.has(entry.md5))
            md5Index.set(entry.md5, { ...entry, dir: task.slug });
        } catch (error) {
          keys.delete(item.key);
          await rm(join(MEDIA, task.slug, `${item.key}.${item.ext}.part`), { force: true });
          await log(`${task.slug} ${item.key} 실패: ${error.message}`);
        } finally {
          if (!released) reserved -= reservation;
        }
      }
    };
    await Promise.all(Array.from({ length: FILE_CONCURRENCY }, worker));
    if (leftover || pending.length) {
      await log(`${task.id} ${page}쪽: 용량 한도로 남은 이미지가 있어 이 쪽을 다음에 다시 봅니다.`);
      break;
    }
    state.cursors[task.id] = page;
    if (!DRY_RUN) await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
    await log(`${task.id} ${page}쪽: ${added}장 추가, 누적 ${(used / 1e9).toFixed(2)}GB`);
    queue.push(task);
  }

  await log(used >= LIMIT_BYTES ? '용량 한도에 도달해 멈췄습니다.' : '모든 출처를 받았습니다.');
}

main().catch(async (error) => {
  await log(`중단: ${error.stack ?? error}`);
  process.exit(1);
});
