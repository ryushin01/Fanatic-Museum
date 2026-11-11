#!/usr/bin/env node
/**
 * 사전 렌더링된 HTML 목록으로 build/client/sitemap.xml과 robots.txt를 만듭니다.
 * 사이트 주소는 SITE_URL 환경 변수(기본 https://fanatic-museum-ryushin01.vercel.app)입니다.
 */
import { readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const CLIENT = join(process.cwd(), 'build', 'client');
const SITE = (process.env.SITE_URL ?? 'https://fanatic-museum-ryushin01.vercel.app').replace(
  /\/$/,
  '',
);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((e) => !['assets', 'storybook', 'media', 'api'].includes(e.name))
      .map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return nested.flat();
}

const pages = (await walk(CLIENT))
  .filter((f) => f.endsWith('index.html'))
  .map(
    (f) =>
      '/' +
      relative(CLIENT, f)
        .replace(/index\.html$/, '')
        .replace(/\/$/, ''),
  )
  .sort();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE}${p === '/' ? '/' : p}</loc></url>`).join('\n')}
</urlset>
`;
await writeFile(join(CLIENT, 'sitemap.xml'), xml);
await writeFile(
  join(CLIENT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`,
);
console.log(`sitemap.xml: ${pages.length}개 주소`);
