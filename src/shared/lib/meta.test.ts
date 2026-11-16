import { describe, expect, it } from 'vitest';

import { absoluteUrl, breadcrumbList, pageMeta } from './meta';

describe('pageMeta', () => {
  const find = (meta: ReturnType<typeof pageMeta>, key: string, value: string) =>
    meta.find((m) => (m as Record<string, unknown>)[key] === value) as
      Record<string, unknown> | undefined;

  it('제목·설명·canonical·공유 미리보기를 한 번에 만든다', () => {
    const meta = pageMeta({
      title: 'Fate 시리즈 — Fanatic Museum',
      description: '성배전쟁',
      path: '/works/fate',
      shareTitle: 'Fate 시리즈',
    });
    expect(meta[0]).toEqual({ title: 'Fate 시리즈 — Fanatic Museum' });
    expect(find(meta, 'rel', 'canonical')?.href).toBe(absoluteUrl('/works/fate'));
    expect(find(meta, 'property', 'og:title')?.content).toBe('Fate 시리즈');
    expect(find(meta, 'property', 'og:image')?.content).toMatch(/^https:\/\/.+\/og\/site\.png$/);
    expect(find(meta, 'name', 'twitter:card')?.content).toBe('summary_large_image');
  });

  it('noindex 페이지는 canonical 대신 robots를 둔다', () => {
    const meta = pageMeta({ title: '없음', description: '', path: '/x', noindex: true });
    expect(find(meta, 'rel', 'canonical')).toBeUndefined();
    expect(find(meta, 'name', 'robots')?.content).toBe('noindex');
  });

  it('구조화 데이터는 @graph 하나로 묶는다', () => {
    const meta = pageMeta({
      title: 't',
      description: 'd',
      path: '/',
      jsonLd: [{ '@type': 'WebSite' }, breadcrumbList([{ name: '홈', path: '/' }])],
    });
    const ld = meta.find((m) => 'script:ld+json' in m) as {
      'script:ld+json': Record<string, unknown>;
    };
    expect(ld['script:ld+json']).toMatchObject({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite' },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [{ position: 1, name: '홈', item: absoluteUrl('/') }],
        },
      ],
    });
  });
});
