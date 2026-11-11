import { expect, test } from '@playwright/test';

import { pages } from './pages';

for (const width of [320, 390, 768, 1440]) {
  test(`가로 ${width}px에서 가로 넘침이 없다`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of pages) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
}

test('글자를 200%로 키워도 본문이 잘리지 않는다', async ({ page }) => {
  await page.goto('/works/saekano');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
