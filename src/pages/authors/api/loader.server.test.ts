import { describe, expect, it, vi } from 'vitest';

import { authors } from '@/entities/author';

import { loader } from './loader.server';

vi.mock('@/shared/api/index.server', () => ({ loadMediaIndex: async () => ({}) }));

describe('작가 목록 로더', () => {
  it('작가마다 쓴 작품의 주소와 제목만 붙인다', async () => {
    const result = await loader();
    expect(result.authors.map((a) => a.slug)).toEqual(authors.map((a) => a.slug));
    for (const author of result.authors) {
      expect(author.works.length).toBeGreaterThan(0);
      expect(Object.keys(author.works[0]!)).toEqual(['slug', 'title']);
    }
  });
});
