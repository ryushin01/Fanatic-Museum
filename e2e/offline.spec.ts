import { expect, test, type Page } from '@playwright/test';

import { works } from '../src/entities/work/model/works';
import { expectNoAxeViolations } from './axe';
import { pages } from './pages';

/**
 * 네트워크가 끊긴 곳(포트폴리오 시연, 비행기 안 등)에서도 사이트가 그대로 보이는지 검사합니다.
 * 사이트(기본은 localhost) 밖으로 나가는 요청은 모두 막습니다.
 * - 로컬(.env 없이, 로컬 보관함 이미지 없이 빌드): 막힌 요청과 실패한 요청이 하나도 없어야 합니다.
 *   (글꼴·아이콘·데이터·자리 표시 그래픽이 모두 같은 사이트에서 오고, Sentry는 DSN이 없으면 받지 않습니다)
 * - 배포본(E2E_BASE_URL=https://… 로 운영 주소를 줌): 배포본만 받는 바깥 요청(Sentry 등)이 막혀도
 *   같은 내용이 보여야 합니다. 이때는 막힌 바깥 요청만 허용하고 사이트 안 요청 실패는 허용하지 않습니다.
 * 모든 화면에서 axe 검사도 함께 돌립니다.
 */
const deployed = Boolean(process.env.E2E_BASE_URL);
const first = works[0]!;

/** 모든 사전 렌더링 화면과 없는 주소(404) */
const screens: readonly string[] = [
  ...pages,
  '/works/does-not-exist',
  '/categories/xyz',
  '/authors/nobody',
  '/nope',
];

let blocked: string[];
let failed: string[];
let errors: string[];

test.beforeEach(async ({ context, page, baseURL }) => {
  blocked = [];
  failed = [];
  errors = [];
  const site = new URL(baseURL ?? 'http://localhost').hostname;
  const local = new Set(['localhost', '127.0.0.1', site]);
  await context.route(
    (url) => !local.has(url.hostname),
    async (route) => {
      blocked.push(route.request().url());
      await route.abort('internetdisconnected');
    },
  );
  page.on('requestfailed', (request) => {
    // 화면 이동으로 그만둔 미리 받기(.data)는 실패가 아닙니다.
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return;
    // 배포본에서는 일부러 막은 바깥 요청의 실패만 허용합니다.
    if (deployed && !local.has(new URL(request.url()).hostname)) return;
    failed.push(`${request.url()} (${request.failure()?.errorText ?? ''})`);
  });
  page.on('pageerror', (error) => errors.push(error.message));
});

/** 화면이 내용과 함께 떴는지, 바깥으로 나간 요청·실패한 요청·런타임 오류가 없는지 봅니다. */
async function expectReady(page: Page) {
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('main')).not.toBeEmpty();
  // 글꼴 로딩 화면이 걷히고(같은 사이트의 글꼴을 다 받음) 본문이 보입니다.
  await expect(page.getByText('전시실 조명을 켜는 중입니다')).toBeHidden({ timeout: 10_000 });
}

function expectNoNetworkTrouble() {
  if (!deployed) expect(blocked, '사이트 밖으로 요청을 보내면 안 됩니다').toEqual([]);
  expect(failed, '실패한 요청이 없어야 합니다').toEqual([]);
  expect(errors, '하이드레이션·런타임 오류가 없어야 합니다').toEqual([]);
}

test.describe('오프라인: 모든 화면', () => {
  for (const path of screens) {
    test(`${path}: 바깥 네트워크 없이 내용이 보이고 axe 위반이 없다`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('load');
      await expectReady(page);
      await expectNoAxeViolations(page);
      expectNoNetworkTrouble();
    });
  }
});

test.describe('오프라인: 주요 상태', () => {
  test('홈 전시 띠에 자리 표시 그래픽이 보이고 띠를 넘긴다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expectReady(page);
    const strip = page.locator('section', { has: page.getByRole('heading', { name: '전시실' }) });
    // 로컬 보관함 이미지가 없으면 번호로 만든 자리 표시 그래픽이 보입니다.
    await expect(strip.getByText('001', { exact: true }).first()).toBeVisible();
    await strip.getByRole('button', { name: '다음' }).click();
    await expect(strip.getByRole('button', { name: '이전' })).toBeEnabled();
    await expectNoAxeViolations(page);
    expectNoNetworkTrouble();
  });

  test('소장품 찾기: 초성 검색·분류·정렬·결과 없음', async ({ page }) => {
    await page.goto('/works');
    await expectReady(page);
    const status = page.locator('main').getByRole('status');
    const search = page.getByRole('searchbox', { name: '소장품 찾기' });

    await search.fill('ㄷㄹㄱㄹㅈ');
    await expect(status).toHaveText(/가운데 1점/);
    await expect(page.getByRole('link', { name: /드래곤 라자/ })).toBeVisible();
    await expectNoAxeViolations(page);

    await search.fill('없는소장품이름');
    await expect(page.getByText('조건에 맞는 소장품이 없습니다')).toBeVisible();
    await expectNoAxeViolations(page);

    await page.getByRole('button', { name: '조건 모두 지우기' }).click();
    await page.getByRole('button', { name: '프라모델' }).click();
    await expect(page.getByRole('button', { name: '프라모델' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByText('처음 나온 해', { exact: true }).click();
    await expect(page.getByRole('radio', { name: '처음 나온 해' })).toBeChecked();
    await expect(page).toHaveURL(/s=year/);
    await expectNoAxeViolations(page);

    // 조건이 담긴 주소로 바로 들어와도(새로 고침) 같은 결과가 보입니다.
    await page.reload();
    await expectReady(page);
    await expect(page.getByRole('radio', { name: '처음 나온 해' })).toBeChecked();
    expectNoNetworkTrouble();
  });

  test('작품 상세: 자리 표시 그래픽과 안내, 이전·다음 소장품 이동', async ({ page }) => {
    await page.goto(`/works/${first.slug}`);
    await expectReady(page);
    const gallery = page.getByRole('region', { name: /전시 이미지/ });
    await expect(gallery.getByText(/로컬 보관함에만 있습니다/)).toBeVisible();
    await expect(gallery.getByText(String(first.number).padStart(3, '0'))).toBeVisible();
    await page.getByRole('link', { name: /다음 소장품/ }).click();
    await expect(page).toHaveURL(new RegExp(`/works/${works[1]!.slug}$`));
    await expectReady(page);
    expectNoNetworkTrouble();
  });

  test('어두운 테마로 바꿔도 내용과 접근성이 그대로다', async ({ page }) => {
    await page.goto('/timeline');
    await expectReady(page);
    const toggle = page.getByRole('button', { name: /^화면 테마:/ });
    for (let i = 0; i < 3 && !(await toggle.textContent())?.includes('어둡게'); i += 1) {
      await toggle.click();
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expectNoAxeViolations(page);
    expectNoNetworkTrouble();
  });

  test('없는 주소에서 목록으로 돌아간다', async ({ page }) => {
    await page.goto('/nope');
    await expectReady(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/찾을 수 없습니다/);
    await page
      .getByRole('main')
      .getByRole('link', { name: /소장품/ })
      .first()
      .click();
    await expectReady(page);
    expectNoNetworkTrouble();
  });

  test('정적 JSON API가 사이트 안에서 응답한다', async ({ request }) => {
    for (const path of ['/api/works.json', '/api/categories.json', '/api/authors.json']) {
      const response = await request.get(path);
      expect(response.ok(), path).toBe(true);
    }
    const body: unknown = await (await request.get(`/api/works/${first.slug}.json`)).json();
    expect(JSON.stringify(body)).toContain(first.slug);
  });
});

/**
 * 갤러리 크게 보기는 로컬 보관함 이미지가 있을 때만 나오므로, 코드로 만든 예시 이미지를 쓰는
 * Storybook 스토리(같은 사이트의 /storybook)로 오프라인에서 확인합니다.
 */
test.describe('오프라인: 갤러리 크게 보기', () => {
  const story = (id: string) => `/storybook/iframe.html?id=${id}&viewMode=story`;

  test('이미지를 크게 보고, 넘기고, Esc로 닫으면 초점이 돌아온다', async ({ page }) => {
    await page.goto(story('pages-work-workgallery--with-images'));
    const open = page.getByRole('button', { name: '예시 이미지 1, 크게 보기' });
    await open.click();
    const dialog = page.getByRole('dialog', { name: /이미지 크게 보기/ });
    await expect(dialog.getByRole('img', { name: '예시 이미지 1' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('img', { name: '예시 이미지 2' })).toBeVisible();
    await expectNoAxeViolations(page, { story: true });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    expect(blocked, '사이트 밖으로 요청을 보내면 안 됩니다').toEqual([]);
  });

  test('받지 못한 이미지는 빼고 남은 이미지만 보여 준다', async ({ page }) => {
    await page.goto(story('pages-work-workgallery--missing-files'));
    await expect(page.getByRole('heading', { name: /전시 이미지 2장/ })).toBeVisible();
    await expect(page.getByRole('button', { name: '예시 이미지 2, 크게 보기' })).toBeVisible();
    await expectNoAxeViolations(page, { story: true });
  });

  test('표지 파일을 받지 못하면 자리 표시 그래픽으로 바뀐다', async ({ page }) => {
    await page.goto(story('entities-work-workcover--missing-file'));
    await expect(page.getByText('001', { exact: true })).toBeVisible();
    await expect(page.getByRole('img')).toHaveCount(0);
  });
});
