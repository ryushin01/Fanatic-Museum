import { expect, test } from '@playwright/test';

import { works } from '../src/entities/work/model/works';

/**
 * 네트워크가 끊긴 곳(포트폴리오 시연, 비행기 안 등)에서도 사이트가 그대로 보이는지 검사합니다.
 * localhost 밖으로 나가는 요청은 모두 막고, 막힌 요청이 하나도 없어야 합니다.
 * (글꼴·아이콘·데이터·이미지가 모두 같은 사이트에서 오고, Sentry는 DSN이 없으면 받지 않습니다)
 */
const first = works[0];

const screens = [
  { path: '/', heading: /소장품 목록/ },
  { path: '/works', heading: /소장품/ },
  { path: `/works/${first.slug}`, heading: first.title },
  { path: '/authors', heading: /작가/ },
  { path: '/timeline', heading: /연표|대장정/ },
  { path: '/about', heading: /대장정의 기록/ },
];

test.describe('오프라인', () => {
  let blocked: string[];

  test.beforeEach(async ({ context }) => {
    blocked = [];
    await context.route(
      (url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1',
      async (route) => {
        blocked.push(route.request().url());
        await route.abort('internetdisconnected');
      },
    );
  });

  for (const { path, heading } of screens) {
    test(`${path}: 바깥 네트워크 없이 내용이 보인다`, async ({ page }) => {
      const failed: string[] = [];
      page.on('requestfailed', (request) => failed.push(request.url()));

      await page.goto(path);
      await page.waitForLoadState('load');

      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
      await expect(page.locator('main')).not.toBeEmpty();
      // 글꼴 로딩 화면이 걷히고(같은 사이트의 글꼴을 다 받음) 본문이 보입니다.
      await expect(page.getByText('전시실 조명을 켜는 중입니다')).toBeHidden({ timeout: 10_000 });

      expect(blocked, '사이트 밖으로 요청을 보내면 안 됩니다').toEqual([]);
      expect(failed, '실패한 요청이 없어야 합니다').toEqual([]);
    });
  }

  test('정적 JSON API가 사이트 안에서 응답한다', async ({ request }) => {
    const response = await request.get('/api/works.json');
    expect(response.ok()).toBe(true);
    const body: unknown = await response.json();
    expect(JSON.stringify(body)).toContain(first.slug);
  });
});
