import { expect, test } from '@playwright/test';

import { pages } from './pages';

const SITE = 'https://fanatic-museum-ryushin01.vercel.app';

/** 구조화 데이터를 두지 않는 페이지(연표·소개). 나머지는 꼭 있어야 합니다. */
const WITHOUT_JSON_LD = new Set(['/timeline', '/about']);

test('모든 페이지에 대표 주소·공유 미리보기·구조화 데이터가 있다', async ({ page, request }) => {
  for (const path of pages) {
    await page.goto(path);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical, path).toHaveCount(1);
    const href = new URL(path, SITE).href;
    await expect(canonical, path).toHaveAttribute('href', href);
    await expect(page.locator('meta[property="og:url"]'), path).toHaveAttribute('content', href);
    const image = page.locator('meta[property="og:image"]');
    await expect(image, path).toHaveAttribute('content', /^https:\/\/.+\.png$/);
    // 공유 이미지가 빌드 결과에 실제로 있는지 같은 경로로 받아 봅니다.
    const imagePath = new URL((await image.getAttribute('content'))!).pathname;
    expect((await request.get(imagePath)).status(), `${path} → ${imagePath}`).toBe(200);
    const scripts = page.locator('script[type="application/ld+json"]');
    if (!WITHOUT_JSON_LD.has(path)) expect(await scripts.count(), `${path} 구조화 데이터`).toBe(1);
    for (const script of await scripts.all()) {
      const data = JSON.parse((await script.textContent()) ?? '');
      expect(data['@context'], path).toBe('https://schema.org');
    }
  }
});

test('없는 주소는 검색 결과에 싣지 않는다', async ({ page }) => {
  await page.goto('/works/does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('전시실을 찾을 수 없습니다');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test('웹 앱 매니페스트의 아이콘과 공유 이미지를 내려받을 수 있다', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.start_url).toBe('/');
  for (const icon of manifest.icons as { src: string }[]) {
    expect((await request.get(icon.src)).status(), icon.src).toBe(200);
  }
  const og = await request.get('/og/site.png');
  expect(og.status()).toBe(200);
  expect(og.headers()['content-type']).toContain('image/png');
});
