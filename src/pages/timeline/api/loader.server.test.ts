import { describe, expect, it, vi } from 'vitest';

import { works } from '@/entities/work/model/works';

import { loader } from './loader.server';

vi.mock('@/shared/api/index.server', () => ({ loadMediaIndex: async () => ({}) }));

describe('연표 로더', () => {
  it('처음 나온 해가 있는 소장품은 해 순서로, 없는 소장품은 따로 나눈다', async () => {
    const { dated, undated } = await loader();
    expect(dated.length + undated.length).toBe(works.length);
    const years = dated.map((w) => w.firstReleased ?? 0);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    expect(undated.every((w) => w.firstReleased === undefined)).toBe(true);
  });
});
