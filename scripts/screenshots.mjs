#!/usr/bin/env node
/**
 * README용 화면을 docs/images/에 JPG로 찍습니다.
 * 저작권 이미지가 나오지 않도록 public/media 없이 빌드한 결과(pnpm preview)를 찍어야 합니다.
 * 사용: pnpm build:all && pnpm preview & node scripts/screenshots.mjs
 */
import { chromium } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:4173';
const shots = [
  { name: 'home', path: '/', width: 1440, height: 900 },
  { name: 'home-index', path: '/', width: 1440, height: 900, scrollTo: '#home-works' },
  { name: 'work', path: '/works/cyber-formula', width: 1440, height: 900 },
  { name: 'works-filter', path: '/works?c=comic', width: 1440, height: 900 },
  { name: 'timeline', path: '/timeline', width: 1440, height: 900 },
  { name: 'authors', path: '/authors', width: 1440, height: 900 },
  { name: 'mobile-home', path: '/', width: 390, height: 844 },
  { name: 'mobile-work', path: '/works/the-breaker', width: 390, height: 844 },
  { name: 'mobile-dark', path: '/authors/lee-young-do', width: 390, height: 844, dark: true },
  {
    name: 'storybook',
    path: '/storybook/index.html?path=/story/pages-work-workgallery--with-images',
    width: 1440,
    height: 900,
    wait: 3000,
  },
];

const browser = await chromium.launch();
for (const shot of shots) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: shot.width < 500 ? 2 : 1,
    colorScheme: shot.dark ? 'dark' : 'light',
  });
  await page.goto(base + shot.path, { waitUntil: 'networkidle' });
  if (shot.scrollTo) await page.locator(shot.scrollTo).scrollIntoViewIfNeeded();
  if (shot.wait) await page.waitForTimeout(shot.wait);
  await page.screenshot({ path: `docs/images/${shot.name}.jpg`, type: 'jpeg', quality: 82 });
  await page.close();
  console.log(shot.name);
}
await browser.close();
