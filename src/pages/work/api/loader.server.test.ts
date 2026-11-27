import { describe, expect, it, vi } from 'vitest';

import { works } from '@/entities/work/model/works';
import { loaderArgs } from '@/shared/lib/test/loader-args';

import { loader } from './loader.server';

vi.mock('@/shared/api/index.server', () => ({ loadMediaIndex: async () => ({}) }));

const args = (slug: string) => loaderArgs(`/works/${slug}`, '/works/:slug', { slug });

const sorted = [...works].sort((a, b) => a.number - b.number);

describe('작품 상세 로더', () => {
  it('첫 소장품은 이전이 없고 다음이 있다', async () => {
    const result = await loader(args(sorted[0]!.slug));
    expect(result.previous).toBeNull();
    expect(result.next?.slug).toBe(sorted[1]!.slug);
  });

  it('마지막 소장품은 다음이 없고, 관련 소장품을 붙인다', async () => {
    const last = sorted.at(-1)!;
    const result = await loader(args(last.slug));
    expect(result.next).toBeNull();
    expect(result.previous?.slug).toBe(sorted.at(-2)!.slug);
    expect(result.related.map((w) => w.slug)).toEqual(
      sorted.filter((w) => (last.related as readonly string[]).includes(w.slug)).map((w) => w.slug),
    );
  });

  it('없는 소장품은 404', async () => {
    await expect(loader(args('nope'))).rejects.toMatchObject({ init: { status: 404 } });
  });
});
