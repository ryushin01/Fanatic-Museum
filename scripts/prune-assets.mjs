#!/usr/bin/env node
/**
 * 서버 빌드가 build/client/assets에 남기는, 어디서도 참조하지 않는 CSS를 지웁니다.
 * (HTML·JS 어디에도 파일 이름이 나오지 않는 것만 지웁니다)
 */
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

const CLIENT = join(process.cwd(), 'build', 'client');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return files.flat();
}

const files = await walk(CLIENT);
const texts = await Promise.all(
  files.filter((f) => /\.(html|js|data)$/.test(f)).map((f) => readFile(f, 'utf8')),
);
const corpus = texts.join('\n');

for (const file of files.filter((f) => f.includes('/assets/') && f.endsWith('.css'))) {
  const name = file.split('/').pop();
  if (!corpus.includes(name)) {
    await rm(file);
    console.log(`참조되지 않는 CSS를 지웠습니다: ${name}`);
  }
}

// 정적 호스팅에서 없는 주소는 404.html을 404 상태로 돌려줍니다. 앱 셸(SPA fallback)이 404 화면을 그립니다.
const { copyFile } = await import('node:fs/promises');
await copyFile(join(CLIENT, '__spa-fallback.html'), join(CLIENT, '404.html'));

// 안전장치: 배포(Vercel)·CI 빌드에는 저작권 이미지 변환본(public/media)이 절대 들어가지 않게 지웁니다.
if (process.env.VERCEL || process.env.CI) {
  const media = join(CLIENT, 'media');
  if (
    await stat(media).then(
      () => true,
      () => false,
    )
  ) {
    await rm(media, { recursive: true, force: true });
    console.warn('배포 빌드에서 media 폴더를 지웠습니다. 이미지는 로컬에서만 씁니다.');
  }
}
