import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { pages } from './pages';

for (const path of pages) {
  test(`${path}: axe 위반이 없다`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
    ).toEqual([]);
    expect(errors, '하이드레이션·런타임 오류').toEqual([]);
  });
}
