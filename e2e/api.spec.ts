import { expect, test } from '@playwright/test';

import { works } from '../src/entities/work/model/works';

test('정적 API가 OpenAPI 문서의 형식대로 응답한다', async ({ request }) => {
  const list = await (await request.get('/api/works.json')).json();
  expect(list.total).toBe(works.length);
  for (const item of list.items) {
    expect(item).toEqual(
      expect.objectContaining({
        slug: expect.stringMatching(/^[a-z0-9-]+$/),
        number: expect.any(Number),
        title: expect.any(String),
        categories: expect.any(Array),
        accent: expect.stringMatching(/^#[0-9a-fA-F]{6}$/),
        images: expect.any(Array),
      }),
    );
  }

  const one = await (await request.get('/api/works/fate.json')).json();
  expect(one.title).toBe('Fate 시리즈');

  const categories = await (await request.get('/api/categories.json')).json();
  expect(categories.every((c: { count: number }) => c.count > 0)).toBe(true);
});
