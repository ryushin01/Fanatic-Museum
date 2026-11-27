import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

/**
 * 주요 화면과 Storybook 스토리를 기준 이미지와 비교합니다.
 * 기준 이미지 갱신: pnpm test:visual:docker --update-snapshots
 */
const screens = [
  { name: 'home', path: '/' },
  { name: 'works', path: '/works' },
  { name: 'work', path: '/works/cyber-formula' },
  { name: 'category', path: '/categories/comic' },
  { name: 'authors', path: '/authors' },
  { name: 'timeline', path: '/timeline' },
  { name: 'about', path: '/about' },
  { name: 'not-found', path: '/nope' },
];

/** 글꼴을 다 받고(로딩 화면이 걷히고) 이미지가 그려진 뒤에 찍습니다. */
async function settle(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForFunction(() => document.documentElement.dataset.fonts !== 'loading');
  await page.evaluate(() => document.fonts.ready);
}

for (const { name, path } of screens) {
  test(`화면 ${name}`, async ({ page }) => {
    await page.goto(path);
    await settle(page);
    // 긴 화면(홈)은 전체 페이지를 두 번 같게 찍는 데 시간이 걸립니다.
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, timeout: 20_000 });
  });
}

interface StoryIndex {
  entries: Record<string, { id: string; type: string }>;
}

function isStoryIndex(value: unknown): value is StoryIndex {
  return typeof value === 'object' && value !== null && 'entries' in value;
}

const indexPath = join(process.cwd(), 'build', 'client', 'storybook', 'index.json');
const parsed: unknown = JSON.parse(readFileSync(indexPath, 'utf8'));
if (!isStoryIndex(parsed)) throw new Error(`Storybook 목록이 아닙니다: ${indexPath}`);
const stories = Object.values(parsed.entries).filter((entry) => entry.type === 'story');

for (const { id } of stories) {
  test(`스토리 ${id}`, async ({ page }) => {
    await page.goto(`/storybook/iframe.html?id=${id}&viewMode=story`);
    await settle(page);
    await expect(page.locator('#storybook-root > *').first()).toBeAttached();
    await expect(page).toHaveScreenshot(`story-${id}.png`, { fullPage: true });
  });
}
