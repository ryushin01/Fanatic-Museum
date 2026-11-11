import { expect, test } from '@playwright/test';

test('본문 바로가기 링크가 첫 초점을 받고 본문으로 이동한다', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: '본문 바로가기' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('홈에서 소장품을 눌러 상세로 가고, 이전·다음으로 오간다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: '소장품 목록' }).scrollIntoViewIfNeeded();
  await page.getByRole('link', { name: /^1번/ }).click();
  await expect(page).toHaveURL(/\/works\/cyber-formula$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('신세기 GPX 사이버 포뮬러');
  await page.getByRole('link', { name: /다음 소장품/ }).click();
  await expect(page).toHaveURL(/\/works\/asurada-figure$/);
  await expect(page).toHaveTitle(/아스라다 피규어/);
});

test('소장품 찾기: 검색과 분류를 주소에 남기고, 새로 고쳐도 유지된다', async ({ page }) => {
  await page.goto('/works');
  await page.getByRole('searchbox', { name: '소장품 찾기' }).fill('이영도');
  await expect(page.getByRole('status')).toHaveText(/가운데 2점/);
  await expect(page).toHaveURL(/q=/);
  await page.reload();
  await expect(page.getByRole('searchbox', { name: '소장품 찾기' })).toHaveValue('이영도');
  await expect(page.getByRole('status')).toHaveText(/가운데 2점/);

  await page.getByRole('button', { name: '조건 모두 지우기' }).click();
  await page.getByRole('button', { name: '프라모델' }).click();
  await expect(page.getByRole('button', { name: '프라모델' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('status')).toHaveText(/가운데 2점/);
});

test('홈 전시 띠를 버튼으로 넘긴다', async ({ page }) => {
  await page.goto('/');
  const next = page.getByRole('button', { name: '다음' }).first();
  const prev = page.getByRole('button', { name: '이전' }).first();
  await expect(prev).toBeDisabled();
  await next.click();
  await expect(prev).toBeEnabled();
});

test('카테고리 탭은 지금 카테고리를 aria-current로 알린다', async ({ page }) => {
  await page.goto('/categories/comic');
  const nav = page.getByRole('navigation', { name: '카테고리 바꾸기' });
  await expect(nav.getByRole('link', { name: '만화·웹툰' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await nav.getByRole('link', { name: '소설' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('소설');
});

test('없는 주소는 404 안내를 보여 준다', async ({ page }) => {
  await page.goto('/works/does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('전시실을 찾을 수 없습니다');
});
