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
  // 전시관: 소설관이 지나가고 라이트노벨관이 들어오는 순간(hall의 제목이 화면의 이 비율 높이에 오게)
  { name: 'home-halls', path: '/', width: 1440, height: 900, hall: '라이트노벨', at: 0.92 },
  { name: 'mobile-home', path: '/', width: 390, height: 844 },
  { name: 'mobile-halls', path: '/', width: 390, height: 844, hall: '소설', at: 0.32 },
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
  // 앱 화면은 통파일 글꼴(클래식체)을 다 받아 로딩 화면이 걷힐 때까지 기다립니다(Storybook은 앱 화면이 아니라 건너뜀).
  // 받지 못한 채(8초 제한으로) 열려 글꼴 정의가 꺼졌으면 기존 화면을 덮어쓰지 않고 멈춥니다.
  if (!shot.path.startsWith('/storybook/')) {
    await page.waitForFunction(() => document.documentElement.dataset.fonts === 'ready', null, {
      timeout: 30_000,
    });
    const loaded = await page.evaluate(
      () =>
        document.getElementById('font-faces')?.disabled === false &&
        ['500', '700'].every((weight) =>
          [...document.fonts].some(
            (face) =>
              face.family.includes('Museum Classic') &&
              face.weight === weight &&
              face.status === 'loaded',
          ),
        ),
    );
    if (!loaded) {
      await browser.close();
      throw new Error('클래식체를 받지 못해 화면을 바꾸지 않았습니다.');
    }
  }
  if (shot.hall) {
    await page.evaluate(
      ([name, at]) => {
        // 전시관 이름(영문 이름이 뒤에 붙음)이 가장 크게 쓰인 요소(큰 제목)를 찾습니다.
        const heading = [...document.querySelectorAll('body *')]
          .filter((el) => el.textContent?.replace(/\s/g, '').startsWith(name))
          .sort(
            (a, b) =>
              parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize),
          )[0];
        if (!heading) throw new Error(`${name} 전시관을 찾지 못했습니다.`);
        window.scrollTo(
          0,
          heading.getBoundingClientRect().top + window.scrollY - window.innerHeight * at,
        );
      },
      [shot.hall, shot.at],
    );
    await page.waitForTimeout(1500);
  }
  if (shot.scrollTo) await page.locator(shot.scrollTo).scrollIntoViewIfNeeded();
  if (shot.wait) await page.waitForTimeout(shot.wait);
  await page.screenshot({ path: `docs/images/${shot.name}.jpg`, type: 'jpeg', quality: 82 });
  await page.close();
  console.log(shot.name);
}
await browser.close();
