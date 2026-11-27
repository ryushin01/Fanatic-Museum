import { describe, expect, it, vi } from 'vitest';

import { categories } from '@/entities/category';
import { loaderArgs } from '@/shared/lib/test/loader-args';

import { loader } from './loader.server';

vi.mock('@/shared/api/index.server', () => ({ loadMediaIndex: async () => ({}) }));

const args = (slug: string) => loaderArgs(`/categories/${slug}`, '/categories/:slug', { slug });

describe('카테고리 로더', () => {
  it('카테고리에 속한 소장품만 돌려준다', async () => {
    for (const category of categories) {
      const result = await loader(args(category.slug));
      expect(result.category.slug).toBe(category.slug);
      expect(result.works.every((w) => w.categories.includes(category.slug))).toBe(true);
    }
  });

  it('없는 카테고리는 404', async () => {
    await expect(loader(args('xyz'))).rejects.toMatchObject({ init: { status: 404 } });
    await expect(loader(loaderArgs('/categories', '/categories/:slug'))).rejects.toMatchObject({
      init: { status: 404 },
    });
  });
});
