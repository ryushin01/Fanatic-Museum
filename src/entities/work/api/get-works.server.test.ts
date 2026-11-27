import { describe, expect, it, vi } from 'vitest';

import type { MediaIndex } from '@/shared/api/index.server';

import { getWork, getWorks } from './get-works.server';

const media = vi.hoisted((): { index: MediaIndex } => ({ index: {} }));
vi.mock('@/shared/api/index.server', () => ({ loadMediaIndex: async () => media.index }));

const entry = (kind: 'illustration' | 'screenshot' | 'cover', origin: string | null = null) => ({
  key: `${kind}-key`,
  kind,
  src: `/media/x/${kind}.webp`,
  srcSet: `/media/x/${kind}.webp 640w`,
  width: 640,
  height: 800,
  sourcePage: null,
  origin,
});

describe('getWorks', () => {
  it('소장품을 번호순으로 돌려주고, 로컬 이미지가 없으면 이미지는 빈 목록이다', async () => {
    media.index = {};
    const works = await getWorks();
    expect(works.map((w) => w.number)).toEqual(
      [...works.map((w) => w.number)].sort((a, b) => a - b),
    );
    expect(works.every((w) => w.images.length === 0)).toBe(true);
  });

  it('로컬 이미지 종류마다 대체 텍스트를 만든다', async () => {
    media.index = {
      'cyber-formula': [
        entry('illustration'),
        entry('screenshot', '사이버 포뮬러 게임'),
        entry('cover', '원작 소설'),
      ],
    };
    const work = await getWork('cyber-formula');
    expect(work?.images.map((i) => i.alt)).toEqual([
      '신세기 GPX 사이버 포뮬러 일러스트 1',
      '사이버 포뮬러 게임 게임 화면 2',
      '원작 소설 표지',
    ]);
  });

  it('없는 소장품은 undefined', async () => {
    await expect(getWork('nope')).resolves.toBeUndefined();
  });
});
