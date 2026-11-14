import { describe, expect, it } from 'vitest';

import { authors } from '@/entities/author';
import { categories } from '@/entities/category';

import { works } from './works';

describe('소장품 데이터', () => {
  it('slug와 전시 번호가 겹치지 않고 번호가 1부터 이어진다', () => {
    expect(new Set(works.map((w) => w.slug)).size).toBe(works.length);
    expect(works.map((w) => w.number)).toEqual(works.map((_, i) => i + 1));
  });

  it('함께 보기(related)는 있는 소장품만 가리킨다', () => {
    const slugs = new Set(works.map((w) => w.slug));
    for (const work of works)
      for (const slug of work.related) expect(slugs.has(slug), `${work.slug} → ${slug}`).toBe(true);
  });

  it('모든 카테고리에 소장품이 하나 이상 있다', () => {
    for (const c of categories)
      expect(
        works.some((w) => (w.categories as readonly string[]).includes(c.slug)),
        c.slug,
      ).toBe(true);
  });

  it('요청한 작품이 모두 들어 있다', () => {
    const titles = works.map((w) => w.title).join('|');
    for (const name of [
      '사이버 포뮬러',
      '시원찮은 그녀',
      'Fate',
      '소드 아트 온라인',
      '파이널 판타지',
      '창세기전',
      '윙건담',
      '아스라다',
      '가즈 나이트',
      '그라니트',
      '눈물을 마시는 새',
      '피를 마시는 새',
      '나우',
      '흑신',
      '브레이커',
      '신드로이아 연대기',
    ])
      expect(titles, name).toContain(name);
  });

  it('작가 연결(author)은 있는 작가만 가리키고, 작가마다 소장품이 있다', () => {
    const slugs = new Set<string>(authors.map((a) => a.slug));
    const linked = works.flatMap((w) =>
      w.creators.flatMap((c) => ('author' in c ? [c.author as string] : [])),
    );
    for (const slug of linked) expect(slugs.has(slug), slug).toBe(true);
    for (const author of authors) expect(linked, author.slug).toContain(author.slug);
  });
});
