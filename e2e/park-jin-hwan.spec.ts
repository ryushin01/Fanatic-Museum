import { expect, test } from '@playwright/test';

import { works } from '../src/entities/work/model/works';

// 박진환 작가가 그린 소장품. 목록·검색·상세·작가 페이지·연표에서 모두 보여야 합니다.
const byParkJinHwan = works.filter((w) =>
  w.creators.some((c) => 'author' in c && c.author === 'park-jin-hwan'),
);

test('박진환 작가의 소장품이 목록과 작가 페이지에 모두 보인다', async ({ page }) => {
  expect(byParkJinHwan.map((w) => w.title)).toEqual(
    expect.arrayContaining(['브레이커', '트리니티 원더', '난약', '절대회귀']),
  );

  await page.goto('/works');
  for (const work of byParkJinHwan) {
    await expect(
      page.getByRole('link', { name: new RegExp(`^${work.number}번 ${work.title}`) }),
    ).toBeVisible();
  }

  await page.goto('/authors/park-jin-hwan');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('박진환');
  const list = page.getByRole('region', { name: /소장품/ });
  for (const work of byParkJinHwan) {
    await expect(list.getByRole('link', { name: new RegExp(work.title) })).toBeVisible();
  }
});

test('초성으로 절대회귀를 찾고, 상세에서 작가 페이지로 간다', async ({ page }) => {
  await page.goto('/works');
  await page.getByRole('searchbox', { name: '소장품 찾기' }).fill('ㅈㄷㅎㄱ');
  await expect(page.locator('main').getByRole('status')).toHaveText(/가운데 1점/);
  await page.getByRole('link', { name: /절대회귀/ }).click();

  await expect(page).toHaveURL(/\/works\/absolute-regression$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('절대회귀');
  await expect(page.getByRole('list', { name: '전시 메모' })).toContainText('2024년 7월 29일');
  await page.getByRole('link', { name: '박진환' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('박진환');
});

test('대장정 연표에 박진환 작가의 웹툰이 처음 나온 해와 함께 놓인다', async ({ page }) => {
  await page.goto('/timeline');
  for (const [title, year, decade] of [
    ['트리니티 원더', 2016, '2010년대'],
    ['난약', 2019, '2010년대'],
    ['절대회귀', 2024, '2020년대'],
  ] as const) {
    const section = page.getByRole('region', { name: decade });
    const entry = section.getByRole('listitem').filter({
      has: page.getByRole('link', { name: title, exact: true }),
    });
    await expect(entry).toContainText(String(year));
    await expect(entry).toContainText('박진환');
  }
});
