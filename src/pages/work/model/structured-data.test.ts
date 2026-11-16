import { describe, expect, it } from 'vitest';

import { makeWork } from '@/shared/lib/test/fixtures';

import { workJsonLd } from './structured-data';

describe('workJsonLd', () => {
  it('사람·회사 역할을 나누고, 작품일 수 있는 원작은 넣지 않는다', () => {
    const ld = workJsonLd(
      makeWork({
        slug: 'black-god',
        title: '흑신',
        originalTitle: '黒神',
        firstReleased: 2005,
        categories: ['comic', 'animation'],
        creators: [
          { role: '글', name: '임달영' },
          { role: '그림', name: '박성우', author: 'park-sung-woo' },
          { role: '제작', name: '선라이즈' },
          { role: '원작', name: '어떤 작품' },
        ],
      }),
    );
    expect(ld).toMatchObject({
      '@type': 'CreativeWork',
      name: '흑신',
      alternateName: ['黒神'],
      dateCreated: '2005',
      genre: ['만화·웹툰', '애니메이션'],
      creator: [
        { '@type': 'Person', name: '임달영' },
        {
          '@type': 'Person',
          name: '박성우',
          url: expect.stringMatching(/\/authors\/park-sung-woo$/),
        },
      ],
      producer: [{ '@type': 'Organization', name: '선라이즈' }],
    });
    expect(JSON.stringify(ld)).not.toContain('어떤 작품');
  });

  it('없는 값은 비워 두지 않고 뺀다', () => {
    const ld = workJsonLd(makeWork({ creators: [] }));
    expect(ld).not.toHaveProperty('alternateName');
    expect(ld).not.toHaveProperty('dateCreated');
    expect(ld).not.toHaveProperty('creator');
  });
});
