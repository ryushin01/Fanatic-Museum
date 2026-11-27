import { describe, expect, it, vi } from 'vitest';

import { works } from '@/entities/work/model/works';

import { loader } from './loader.server';

vi.mock('@/shared/api/index.server', () => ({ loadMediaIndex: async () => ({}) }));

describe('소장품 목록 로더', () => {
  it('모든 소장품을 돌려준다', async () => {
    expect((await loader()).works).toHaveLength(works.length);
  });
});
