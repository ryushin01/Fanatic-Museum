import { describe, expect, it, vi } from 'vitest';

import { works } from '@/entities/work/model/works';

import { loader } from './loader.server';

vi.mock('@/shared/api/index.server', () => ({ loadMediaIndex: async () => ({}) }));

describe('홈 로더', () => {
  it('모든 소장품과 카테고리별 소장품 수를 돌려준다', async () => {
    const result = await loader();
    expect(result.works).toHaveLength(works.length);
    for (const category of result.categories) {
      expect(category.count).toBe(
        works.filter((w) => (w.categories as readonly string[]).includes(category.slug)).length,
      );
    }
  });
});
