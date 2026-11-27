import { describe, expect, it, vi } from 'vitest';

import { authors } from '@/entities/author';
import { loaderArgs } from '@/shared/lib/test/loader-args';

import { loader } from './loader.server';

vi.mock('@/shared/api/index.server', () => ({ loadMediaIndex: async () => ({}) }));

const args = (slug: string) => loaderArgs(`/authors/${slug}`, '/authors/:slug', { slug });

describe('작가 로더', () => {
  it('작가의 작품을 처음 나온 해 순서로(해가 없으면 뒤로) 돌려준다', async () => {
    for (const author of authors) {
      const { works } = await loader(args(author.slug));
      expect(works.length).toBeGreaterThan(0);
      const years = works.map((w) => w.firstReleased ?? Number.MAX_SAFE_INTEGER);
      expect(years).toEqual([...years].sort((a, b) => a - b));
      expect(works.every((w) => w.creators.some((c) => c.author === author.slug))).toBe(true);
    }
  });

  it('없는 작가는 404', async () => {
    await expect(loader(args('nobody'))).rejects.toMatchObject({ init: { status: 404 } });
    await expect(loader(loaderArgs('/authors', '/authors/:slug'))).rejects.toMatchObject({
      init: { status: 404 },
    });
  });
});
